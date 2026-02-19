from django.db import models
from django.contrib.auth.models import User

class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # Changed to 12 for better safety against large inputs
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    note = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.amount} ({self.note})"    
    
from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    monthly_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_business = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __clac_daily_budget__(self):
        return self.monthly_budget / 30

    def __str__(self):
        return f"Profile: {self.user.username}"
 