from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone 

class UserProfile(models.Model):
    """
    Unified Profile Model.
    Field names (monthlyIncome, etc.) match your React state exactly 
    to avoid mapping logic in the frontend.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Financial Goals (Matching React keys)
    monthlyIncome = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    monthlyBudget = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    dailyBudget = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    # Meta Data
    is_business = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.username}"

class Transaction(models.Model):
    TRANSACTION_TYPES = (('income', 'Income'), ('expense', 'Expense'))
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, default='expense')
    category = models.CharField(max_length=100, default='other')
    date = models.DateField(default=timezone.now)
    is_recurring = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.title} - {self.amount}"

class WealthItem(models.Model):
    # Mapping to your React "type": "asset" or "liability"
    TYPE_CHOICES = [
        ('asset', 'Asset'),
        ('liability', 'Liability'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wealth_items")
    title = models.CharField(max_length=100)  # e.g., "HDFC Bank", "Car Loan"
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    category = models.CharField(max_length=50, default="General") # e.g., "Cash", "Investment"
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.amount}"
    
class TaxProfile(models.Model):
    # Link to the built-in Django User
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tax_profile')
    
    # Checkbox field
    is_business = models.BooleanField(default=False)
    
    # Numeric Input fields (from your 'fields' constant in React)
    annual_rent = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    annual_epf = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    nps_contribution = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    health_insurance_self = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    health_insurance_parents = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    home_loan_interest = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    education_loan_interest = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Metadata
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tax Profile for {self.user.username}"
    
class ITRProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='itr_profile')
    tax_regime = models.CharField(max_length=10, default='new', choices=[('new', 'New'), ('old', 'Old')])
    
    # Income Details
    salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    house_property = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    business_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    capital_gains = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    interest_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Deductions
    section_80c = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    section_80d = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    section_80e = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    section_80g = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    hra_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    home_loan_interest = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nps_80ccd = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Filing Details (Encrypted or sensitive-ready)
    pan_number = models.CharField(max_length=10, blank=True)
    aadhar_number = models.CharField(max_length=12, blank=True)
    bank_account = models.CharField(max_length=20, blank=True)
    ifsc_code = models.CharField(max_length=11, blank=True)
    email = models.EmailField(blank=True)
    mobile = models.CharField(max_length=15, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"ITR Profile - {self.user.username}"    
    
    
    
    
    