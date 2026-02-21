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