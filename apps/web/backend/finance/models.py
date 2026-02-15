#first check done
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class TaxDeclaration(models.Model):
    REGIME_CHOICES = [('old', 'Old'), ('new', 'New')]
    STATUS_CHOICES = [('draft', 'Draft'), ('filed', 'Filed')]

    # Core Relationships and Metadata
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tax_declarations")
    financial_year = models.CharField(max_length=10, default="2025-26")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    regime = models.CharField(max_length=10, choices=REGIME_CHOICES, default='new')
    
    # Standard Deduction (₹75,000 for New Regime FY 25-26)
    standard_deduction = models.DecimalField(max_digits=15, decimal_places=2, default=75000.00)

    # --- Step 1: Income Fields ---
    salary = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    business_income = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    house_property_income = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    capital_gains = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    other_income = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Specific Interest breakdown for 80TTA/80TTB Audits
    savings_interest = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    fd_interest = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    # --- Step 2: Deduction Fields ---
    section_80c = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    section_80d = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    section_80e = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    section_80g = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    hra = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    home_loan_interest = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    nps_80ccd = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    # --- Step 3: Totals ---
    total_tax_payable = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    # --- Step 4: Filing Details ---
    pan_number = models.CharField(max_length=10, blank=True)
    aadhar_number = models.CharField(max_length=12, blank=True)
    bank_account = models.CharField(max_length=20, blank=True)
    ifsc_code = models.CharField(max_length=11, blank=True)
    
    is_filed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    filed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-financial_year', '-created_at']
        verbose_name = "Tax Declaration"

    def calculate_taxable_income(self):
        """Calculates taxable income after standard and regime-based deductions."""
        total_income = (
            self.salary + self.business_income + self.house_property_income + 
            self.capital_gains + self.other_income + self.savings_interest + self.fd_interest
        )
        
        if self.regime == 'new':
            # New Regime logic (Simplified for FY 25-26)
            return max(0, total_income - self.standard_deduction)
        else:
            # Old Regime logic (Standard deduction also applies to salary in Old regime)
            deductions = (
                self.section_80c + self.section_80d + self.hra + 
                self.home_loan_interest + self.standard_deduction
            )
            return max(0, total_income - deductions)

    def __str__(self):
        return f"ITR ({self.financial_year}) - {self.user.username} [{self.status.upper()}]"

    def save(self, *args, **kwargs):
        if self.status == 'filed' and not self.is_filed:
            self.is_filed = True
            self.filed_at = self.filed_at or timezone.now()
        super().save(*args, **kwargs)


class Transaction(models.Model):
    TYPES = [('income', 'Income'), ('expense', 'Expense')]
    SOURCES = [('manual', 'Manual'), ('ocr', 'OCR Scan'), ('pdf', 'PDF Parser')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    is_verified = models.BooleanField(default=False)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    type = models.CharField(max_length=10, choices=TYPES)
    category = models.CharField(max_length=100)
    date = models.DateField() 
    is_recurring = models.BooleanField(default=False)
    source = models.CharField(max_length=20, choices=SOURCES, default='manual')
    confidence = models.IntegerField(default=100) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def audit_status(self):
        if self.confidence < 50: return "High Risk"
        if not self.is_verified and self.source != 'manual': return "Pending Review"
        return "Verified"

    @property
    def is_risky(self):
        return self.confidence < 50 and self.amount > 10000

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = "Transaction"

    def __str__(self):
        return f"{self.description} - ₹{self.amount} ({self.type})"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    
    # Financial Goals
    monthly_income = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    monthly_budget = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    daily_budget = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Feature Toggles
    is_business = models.BooleanField(default=False)
    is_onboarded = models.BooleanField(default=False)
    has_completed_onboarding = models.BooleanField(default=False)

    # --- FIX: ONBOARDING_STEPS moved inside class ---
    ONBOARDING_STEPS = [
        ('profile', 'Profile Set'),
        ('budget', 'Budget Set'),
        ('complete', 'Completed')
    ]
    onboarding_step = models.CharField(max_length=20, choices=ONBOARDING_STEPS, default='profile')

    # Tax Deduction Data
    annual_rent = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    annual_epf = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    nps_contribution = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    health_insurance_self = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    health_insurance_parents = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    home_loan_interest = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    education_loan_interest = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.user.username}'s Financial Profile"

    def save(self, *args, **kwargs):
        if self.is_onboarded:
            self.has_completed_onboarding = True
        super().save(*args, **kwargs)


class WealthItem(models.Model):
    WEALTH_TYPES = [('asset', 'Asset'), ('liability', 'Liability')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wealth_items")
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    type = models.CharField(max_length=10, choices=WEALTH_TYPES)
    category = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-amount']
        verbose_name = "Wealth Item"

    def __str__(self):
        return f"{self.name} - ₹{self.amount} ({self.type.capitalize()})"