import React, { useState, useMemo } from 'react';
import { 
  Bot, Sparkles, Loader2, PieChart, BarChart3, TrendingUp, 
  AlertTriangle, CheckCircle2, Zap 
} from 'lucide-react';
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { CATEGORIES } from '../config/constants';
import { normalizeDate, formatIndianCompact } from '../utils/helpers';
import { AIService } from '../services/aiService'; // NEW IMPORT

// --- VISUAL CONFIGURATION ---
const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#6366f1', '#06b6d4', '#64748b'];

// --- SUB-COMPONENT: CUSTOM CHART TOOLTIP ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 p-3 rounded-xl shadow-xl z-50">
        <p className="text-white font-bold text-xs">{payload[0].name}</p>
        <p className="text-cyan-400 text-sm font-bold">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

// --- SUB-COMPONENT: INSIGHT CARD (THE WATCHDOG UI) ---
const InsightCard = ({ type, title, message, impact }) => {
    let styles = "bg-slate-800 border-slate-700 text-slate-300";
    let Icon = Bot;

    switch (type) {
        case 'alert':
            styles = "bg-rose-500/10 border-rose-500/20 text-rose-200";
            Icon = AlertTriangle;
            break;
        case 'tip':
            styles = "bg-blue-500/10 border-blue-500/20 text-blue-200";
            Icon = Zap;
            break;
        case 'praise':
            styles = "bg-emerald-500/10 border-emerald-500/20 text-emerald-200";
            Icon = CheckCircle2;
            break;
        case 'trend':
            styles = "bg-purple-500/10 border-purple-500/20 text-purple-200";
            Icon = TrendingUp;
            break;
    }

    return (
        <div className={`p-4 rounded-2xl border ${styles} relative overflow-hidden transition-all hover:scale-[1.02]`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 opacity-80" />
                    <h4 className="font-bold text-sm uppercase tracking-wide opacity-90">{title}</h4>
                </div>
                {impact === 'high' && <span className="bg-white/10 text-[10px] font-bold px-2 py-0.5 rounded-full">HIGH IMPACT</span>}
            </div>
            <p className="text-xs opacity-80 leading-relaxed">{message}</p>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
const StatsPage = ({ transactions }) => {
    const [aiInsights, setAiInsights] = useState([]); 
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [viewMode, setViewMode] = useState('expense');

    // --- Data Processing for Charts ---
    const chartData = useMemo(() => {
        const categoryMap = {};
        const monthlyMap = {};

        transactions.forEach(t => {
            const date = normalizeDate(t.date);
            const amt = parseFloat(t.amount);
            const monthKey = date.toLocaleString('default', { month: 'short' });

            // 1. Category Data (Pie Chart)
            if (t.type === viewMode) {
                const catName = CATEGORIES.find(c => c.id === t.category)?.name || t.category;
                categoryMap[catName] = (categoryMap[catName] || 0) + amt;
            }

            // 2. Monthly Trend (Bar Chart)
            if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { name: monthKey, income: 0, expense: 0 };
            if (t.type === 'income') monthlyMap[monthKey].income += amt;
            else monthlyMap[monthKey].expense += amt;
        });

        const pieData = Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const barData = Object.values(monthlyMap).reverse().slice(0, 6); // Last 6 months

        return { pieData, barData };
    }, [transactions, viewMode]);

    const totalVal = chartData.pieData.reduce((acc, curr) => acc + curr.value, 0);

    // --- THE WATCHDOG ENGINE (Refactored to use Service) ---
    const generateAIInsights = async () => {
        setAiLoading(true);
        setAiError(null);

        try {
            // 1. Prepare Data Context (The "What")
            const topCats = chartData.pieData.slice(0, 5).map(c => `${c.name}: ₹${c.value}`).join(', ');
            const recentMonth = chartData.barData[chartData.barData.length - 1];
            const prevMonth = chartData.barData[chartData.barData.length - 2];
            
            let trendText = "No trend data";
            if (recentMonth && prevMonth) {
                const diff = recentMonth.expense - prevMonth.expense;
                trendText = diff > 0 ? `Expenses up by ₹${diff}` : `Expenses down by ₹${Math.abs(diff)}`;
            }

            const contextData = `
                Total Spend: ₹${totalVal}
                Top Categories: ${topCats}
                Trend: ${trendText}
            `;

            // 2. The Engineer Prompt (The "How")
            const systemPrompt = `
                Act as a sophisticated Financial Watchdog for an Indian user.
                Goal: Generate exactly 3 Insight Cards based on the context provided.
                
                JSON Structure:
                [
                  { "type": "alert", "title": "Spending Spike", "message": "...", "impact": "high" },
                  { "type": "tip", "title": "Savings Opportunity", "message": "...", "impact": "medium" },
                  { "type": "trend", "title": "Monthly Pattern", "message": "...", "impact": "low" }
                ]

                Rules:
                1. 'type' must be: 'alert' (bad news), 'praise' (good news), 'tip' (advice), or 'trend' (observation).
                2. 'message' must be specific to the numbers provided. Max 25 words.
            `;

            // 3. Call the Agnostic Service
            const jsonInsights = await AIService.askForJSON(systemPrompt, contextData);
            setAiInsights(jsonInsights);

        } catch (error) { 
            console.error("AI Logic Failed:", error);
            setAiError("Watchdog is sleeping (Network or Service Error)."); 
        } finally { 
            setAiLoading(false); 
        }
    };

    return (
        <div className="space-y-6 pb-24 animate-in fade-in">
            {/* Header */}
            <div className="flex justify-between items-center px-1">
                <h2 className="text-2xl font-bold text-white">Analytics</h2>
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    <button onClick={() => setViewMode('expense')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'expense' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'}`}>Expense</button>
                    <button onClick={() => setViewMode('income')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'income' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}>Income</button>
                </div>
            </div>

            {/* 1. Watchdog Section (AI) */}
            <div className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] p-6 rounded-[2rem] border border-white/10 relative overflow-hidden shadow-2xl">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Bot className="w-5 h-5 text-indigo-400" />
                            <h3 className="font-bold text-white text-lg tracking-tight">The Watchdog</h3>
                        </div>
                        <p className="text-xs text-slate-400">AI-powered financial surveillance</p>
                    </div>
                    <button 
                        onClick={generateAIInsights} 
                        disabled={aiLoading} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                    >
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-300" />}
                        {aiLoading ? 'Analyzing...' : 'Run Scan'}
                    </button>
                </div>

                <div className="relative z-10 min-h-[100px]">
                    {aiError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs text-rose-200 text-center">
                            {aiError}
                        </div>
                    )}

                    {!aiLoading && !aiError && aiInsights.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-700 rounded-xl">
                            Tap 'Run Scan' to detect anomalies and patterns.
                        </div>
                    )}

                    {aiInsights.length > 0 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4">
                            {aiInsights.map((insight, idx) => (
                                <InsightCard key={idx} {...insight} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Donut Chart Section */}
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 relative overflow-hidden">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <PieChart className="w-4 h-4" /> Category Breakdown
                </h3>
                
                <div className="h-64 relative">
                    {chartData.pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={chartData.pieData}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </RePieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">No data available</div>
                    )}
                    {/* Center Text */}
                    {chartData.pieData.length > 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-slate-400 font-bold uppercase">Total</span>
                            <span className="text-xl font-bold text-white">{formatIndianCompact(totalVal)}</span>
                        </div>
                    )}
                </div>

                {/* Legend List */}
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {chartData.pieData.map((entry, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-slate-300">{entry.name}</span>
                            </div>
                            <span className="font-bold text-slate-200">
                                {((entry.value / totalVal) * 100).toFixed(1)}% <span className="text-slate-500 ml-1">₹{entry.value.toLocaleString()}</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Monthly Trends Bar Chart */}
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> 6 Month Trend
                </h3>
                <div className="h-56 w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.barData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(val) => `₹${val/1000}k`} />
                            <Tooltip 
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                content={<CustomTooltip />}
                            />
                            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                            <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default StatsPage;