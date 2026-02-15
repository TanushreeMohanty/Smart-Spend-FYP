#first check done
from decimal import Decimal
import google.generativeai as genai
import json
import re
from django.conf import settings
from django.db.models import Sum
from .models import Transaction

class TaxEngine:
    @staticmethod
    def calculate_new_regime_tax(taxable_income):
        income = Decimal(str(taxable_income))
        
        # 1. Standard Slab Calculation (FY 2025-26)
        tax = Decimal('0.00')
        if income > 400000:
            tax += min(income - 400000, 400000) * Decimal('0.05')
        if income > 800000:
            tax += min(income - 800000, 400000) * Decimal('0.10')
        if income > 1200000:
            tax += min(income - 1200000, 400000) * Decimal('0.15')
        if income > 1600000:
            tax += min(income - 1600000, 400000) * Decimal('0.20')
        if income > 2000000:
            tax += min(income - 2000000, 400000) * Decimal('0.25')
        if income > 2400000:
            tax += (income - 2400000) * Decimal('0.30')

        # 2. Section 87A Rebate & Marginal Relief (FY 25-26 Updates)
        if income <= 1200000:
            return Decimal('0.00')
        
        # CORRECTION: Marginal Relief Logic
        # Tax cannot exceed the income earned above 12L
        excess_income = income - Decimal('1200000')
        if tax > excess_income:
            tax = excess_income

        # 3. Final Cess & Rounding
        total_tax = tax * Decimal('1.04')
        return total_tax.quantize(Decimal('1'))

    @staticmethod
    def calculate_new_regime(taxable_income):
        return TaxEngine.calculate_new_regime_tax(taxable_income)


class WatchdogService:
    @staticmethod
    def run_scan(user):
        genai.configure(api_key=settings.GEMINI_API_KEY)

        # Optimization: Fetching only necessary fields for context
        recent = Transaction.objects.filter(user=user, type='expense').order_by('-date')[:15]
        top_cats = Transaction.objects.filter(user=user, type='expense').values('category').annotate(v=Sum('amount')).order_by('-v')[:3]
        
        expenses_summary = [f"{t['description']} (₹{t['amount']})" for t in recent.values('description', 'amount')]
        context = f"Top Spend: {list(top_cats)}. Recent: {', '.join(expenses_summary)}"
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # PROMPT IMPROVEMENT: Explicitly asking for NO markdown
        prompt = f"""
        Act as a FinTech Audit Bot. Data: {context}
        Output a raw JSON array of 3 insights. 
        Format: [{{"type": "alert", "title": "...", "message": "...", "impact": "high"}}]
        Types: alert, tip, trend. Impact: high, medium.
        DO NOT include ```json tags. Return only the array.
        """
        
        try:
            response = model.generate_content(prompt)
            # Robust cleaning
            clean_json = re.sub(r'```(?:json)?|```', '', response.text).strip()
            return json.loads(clean_json)
        except Exception as e:
            return [{"type": "tip", "title": "Watchdog Ready", "message": "Add more data to see patterns.", "impact": "medium"}]