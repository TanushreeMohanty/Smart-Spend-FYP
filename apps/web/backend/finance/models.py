from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone 

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    monthly_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_business = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def calc_daily_budget(self): # Fixed typo 'clac' to 'calc'
        if self.monthly_budget > 0:
            return self.monthly_budget / 30
        return 0

    def __str__(self):
        return f"Profile: {self.user.username}"

class Transaction(models.Model):
    TRANSACTION_TYPES = (('income', 'Income'), ('expense', 'Expense'))
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, default='expense')
    category = models.CharField(max_length=100, default='other')
    date = models.DateField(default=timezone.now)
    is_recurring = models.BooleanField(default=False) # Add this if missing
    
    def __str__(self):
        return f"{self.title} - {self.amount}"

class WealthItem(models.Model):
    WEALTH_TYPES = (('asset', 'Asset'), ('liability', 'Liability'))
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    type = models.CharField(max_length=10, choices=WEALTH_TYPES)
    institution = models.CharField(max_length=100, blank=True) # e.g., "HDFC Bank"

    def __str__(self):
        return f"{self.name} ({self.type})"