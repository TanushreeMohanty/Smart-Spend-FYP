import { generateId, categorizeTransaction, loadScript } from '../utils/helpers';

// --- HELPER: SCORING ENGINE ---
// Determines if a string is likely a transaction amount vs a date or page number
const scoreNumberLikelihood = (numStr, line) => {
    let score = 0;
    
    // Feature 1: Decimal places (High Confidence for Citibank/Banks)
    if (numStr.includes('.')) score += 20; 
    
    // Feature 2: Commas (High Confidence)
    if (numStr.includes(',')) score += 15;
    
    const val = parseFloat(numStr.replace(/,/g, ''));
    
    // Penalty 1: Small integers without decimals (likely dates like '02' or pages '5')
    if (Number.isInteger(val) && val < 50 && !numStr.includes('.')) score -= 50; 
    
    // Penalty 2: Years (2020-2030)
    if (val >= 2020 && val <= 2030) score -= 100;

    // Penalty 3: Page numbers
    if (line.toLowerCase().includes(`page ${val}`)) score -= 100;

    return score;
};

const parseAmount = (str) => {
    if (!str) return 0;
    let clean = str.replace(/,/g, '').trim();
    
    // Detect Sign based on banking keywords (fallback if not detected by line context)
    const isDebit = /dr|debit|wdl|out|withdrawal/i.test(clean);
    const isCredit = /cr|credit|dep|in|deposit/i.test(clean);
    
    clean = clean.replace(/[^\d.-]/g, '');
    let val = parseFloat(clean);
    
    if (isNaN(val)) return 0;
    if (isDebit) return -Math.abs(val);
    if (isCredit) return Math.abs(val);
    return val;
};

// --- HELPER: DIRECTION DETECTOR ---
// Intelligently decides Income vs Expense based on banking keywords
const detectTransactionType = (line) => {
    const text = line.toUpperCase();

    // 1. Income Keywords
    if (text.includes("CREDIT") || text.includes("CR ") || text.includes("DEPOSIT") || 
        text.includes("SALARY") || text.includes("IMPS INWARD") || text.includes("NEFT IN") || 
        text.includes("REFUND") || text.includes("CASHBACK") || text.includes("RECEIVED")) {
        return 'income';
    }

    // 2. Expense Keywords
    if (text.includes("DEBIT") || text.includes("DR ") || text.includes("WITHDRAW") || 
        text.includes("IMPS OUTWARD") || text.includes("NEFT OUT") || text.includes("PURCHASE") || 
        text.includes("SPENT") || text.includes("PAYMENT") || text.includes("EMI")) {
        return 'expense';
    }

    // 3. Fallback: UPI is usually expense unless it explicitly says received
    if (text.includes("UPI")) {
        if (text.includes("REC") || text.includes("FROM")) return 'income';
        return 'expense';
    }

    // Default to expense (Safe bet for personal finance)
    return 'expense';
};

export const ParserService = {
  patterns: {
    // Robust date regex for Citibank (02Feb23) & others
    date: /(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4})|(?:\d{1,2}(?:[-/\s]?)(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:[a-z]*)(?:[-/\s]?)\d{2,4})/i,
    // Lines to strictly ignore
    noise: /(page\s+\d+|statement\s+period|account\s+summary|opening\s+balance|closing\s+balance|total|brought\s+forward|relationship\s+value|credit\s+limit|reward\s+points)/i
  },

  // OPTIMIZATION: Quick check on first 1000 chars only
  detectMode: (text) => {
    if (!text || text.length < 50) return 'OCR';
    const sample = text.substring(0, 1000); 
    const cleanText = sample.replace(/\s/g, '');
    // Fixed: Correct Rupee Symbol '₹'
    const readable = cleanText.replace(/[^a-zA-Z0-9.,:/\-₹]/g, '');
    if ((readable.length / (cleanText.length || 1)) < 0.4) return 'OCR'; 
    return 'TEXT';
  },

  processLines: (lines, source = 'TEXT') => {
    const transactions = [];
    
    lines.forEach(line => {
      // 1. Skip Noise
      if (line.length < 10) return;
      if (ParserService.patterns.noise.test(line.toLowerCase())) return;

      // 2. Find Date
      const dateMatch = line.match(ParserService.patterns.date);
      if (!dateMatch) return; 

      // 3. Find Amounts
      const numberMatches = [...line.matchAll(/(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{2})(?:\s?(?:Cr|Dr))?/gi)];
      if (!numberMatches || numberMatches.length === 0) return; 

      // 4. Score Candidates (Eliminate Dates/Page Numbers)
      let validCandidates = [];
      numberMatches.forEach(match => {
          const numStr = match[0];
          if (dateMatch[0].includes(numStr)) return; 
          const score = scoreNumberLikelihood(numStr, line);
          if (score > 0) validCandidates.push({ raw: numStr, value: parseAmount(numStr), index: match.index, score });
      });

      if (validCandidates.length === 0) return;

      // Select Best Amount (First valid money number found -> Ignores Balance Column)
      validCandidates.sort((a, b) => a.index - b.index);
      const bestAmount = validCandidates[0].value;

      // 5. Clean Description
      let desc = line.replace(dateMatch[0], '').replace(validCandidates[0].raw, '').trim();
      if (validCandidates.length > 1) desc = desc.replace(validCandidates[1].raw, '').trim();

      desc = desc.replace(/\s+/g, ' ')
                 .replace(/[\d,]+\.\d{2}/g, '') 
                 .replace(/IMPS|NEFT|UPI|Ref\s?no\.?|/gi, '')
                 .replace(/[^\w\s\-@.]/gi, '')
                 .trim();

      if (desc.length > 50) desc = desc.substring(0, 50) + "...";

      // 6. AUTO-DETECT TYPE (Income vs Expense)
      const type = detectTransactionType(line);
      
      // 7. Categorize
      let category = categorizeTransaction(desc);
      
      // Safety: Fix rare category mismatch
      if (type === 'income' && category !== 'salary' && category !== 'investment') {
          category = 'others';
      }
      if (desc.toLowerCase().includes('salary')) {
          category = 'salary'; 
      }

      transactions.push({
          id: generateId(),
          date: new Date(dateMatch[0]),
          description: desc || "Transaction",
          amount: Math.abs(bestAmount),
          type: type,
          category: category,
          confidence: source === 'OCR' ? 80 : 95,
          bank: "Detected"
      });
    });

    return transactions;
  },

  // --- HIGH PERFORMANCE PARALLEL EXTRACTOR ---
  // Reads 5 pages at once for "Instant" feel
  extractLinesFromPdf: async (pdfDoc) => {
    let allLines = [];
    const totalPages = pdfDoc.numPages; // NO LIMIT
    const BATCH_SIZE = 5; 

    for (let i = 1; i <= totalPages; i += BATCH_SIZE) {
        const batchPromises = [];
        const endPage = Math.min(i + BATCH_SIZE - 1, totalPages);

        for (let j = i; j <= endPage; j++) {
            batchPromises.push(pdfDoc.getPage(j).then(async (page) => {
                const textContent = await page.getTextContent();
                const items = textContent.items;
                const rows = {};
                items.forEach(item => {
                    const y = Math.round(item.transform[5]); 
                    if (!rows[y]) rows[y] = [];
                    rows[y].push(item.str);
                });
                const pageLines = Object.keys(rows)
                    .sort((a, b) => b - a)
                    .map(y => rows[y].join('   ').trim()) // Large spacer
                    .filter(line => line.length > 0);
                return { pageIndex: j, lines: pageLines };
            }));
        }
        const batchResults = await Promise.all(batchPromises);
        batchResults.sort((a, b) => a.pageIndex - b.pageIndex);
        batchResults.forEach(res => allLines.push(...res.lines));
    }
    return allLines;
  },

  // --- OCR (Fallback for Image PDFs) ---
  performOCR: async (file, onProgress) => {
    await loadScript("https://unpkg.com/tesseract.js@v5.0.5/dist/tesseract.min.js");
    if (!window.Tesseract) throw new Error("OCR Engine failed to load");
    
    let worker = null;
    let allLines = [];
    
    try {
      worker = await window.Tesseract.createWorker('eng', 1, { 
        logger: m => { if (m.status === 'recognizing text' && onProgress) onProgress(Math.floor(m.progress * 100)); } 
      });
      
      const pdf = await window.pdfjsLib.getDocument(await file.arrayBuffer()).promise;
      const pagesToScan = pdf.numPages;      
      for (let i = 1; i <= pagesToScan; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        const { data: { words } } = await worker.recognize(canvas.toDataURL('image/png'));
        
        const rows = [];
        words.forEach(w => {
          if (w.confidence < 50) return;
          const y = Math.round(w.bbox.y0 / 10) * 10;
          const row = rows.find(r => Math.abs(r.y - y) < 15);
          if (row) row.items.push(w); else rows.push({ y, items: [w] });
        });
        
        rows.sort((a, b) => a.y - b.y);
        rows.forEach(r => {
          r.items.sort((a, b) => a.bbox.x0 - b.bbox.x0);
          const line = r.items.map(w => w.text).join(' ');
          if (line.length > 5) allLines.push(line);
        });
      }
    } catch (e) { console.error("OCR Failed", e); throw e; } 
    finally { if (worker) await worker.terminate(); }
    return allLines;
  }
};