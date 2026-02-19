from rest_framework import serializers
from .models import Transaction, WealthItem, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        # Using camelCase to match your React state
        fields = ['monthlyIncome', 'monthlyBudget', 'dailyBudget', 'is_business']

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        # Added 'is_recurring' so your frontend knows which are subscriptions
        fields = ['id', 'title', 'amount', 'type', 'category', 'date', 'is_recurring']
        
class WealthItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WealthItem
        # Changed 'name' to 'title' and 'institution' to 'category' 
        # to match your models.py
        fields = ['id', 'title', 'amount', 'type', 'category']