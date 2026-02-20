from rest_framework import serializers
from .models import Transaction, WealthItem, UserProfile, TaxProfile

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
        
class TaxProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxProfile
        # Keep snake_case here; the methods below handle the conversion
        fields = [
            'is_business', 'annual_rent', 'annual_epf', 
            'nps_contribution', 'health_insurance_self', 
            'health_insurance_parents', 'home_loan_interest', 
            'education_loan_interest'
        ]

    def to_representation(self, instance):
        """Converts database snake_case to React camelCase"""
        return {
            "isBusiness": instance.is_business,
            "annualRent": float(instance.annual_rent),
            "annualEPF": float(instance.annual_epf),
            "npsContribution": float(instance.nps_contribution),
            "healthInsuranceSelf": float(instance.health_insurance_self),
            "healthInsuranceParents": float(instance.health_insurance_parents),
            "homeLoanInterest": float(instance.home_loan_interest),
            "educationLoanInterest": float(instance.education_loan_interest),
        }

    def to_internal_value(self, data):
        """Converts React camelCase back to database snake_case"""
        # Define the mapping
        map_fields = {
            "isBusiness": "is_business",
            "annualRent": "annual_rent",
            "annualEPF": "annual_epf",
            "npsContribution": "nps_contribution",
            "healthInsuranceSelf": "health_insurance_self",
            "healthInsuranceParents": "health_insurance_parents",
            "homeLoanInterest": "home_loan_interest",
            "educationLoanInterest": "education_loan_interest",
        }
        
        internal_data = {}
        for json_key, db_key in map_fields.items():
            if json_key in data:
                internal_data[db_key] = data.get(json_key)
        
        return super().to_internal_value(internal_data)