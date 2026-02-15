#first check done
#checked
from rest_framework import serializers
from .models import TaxDeclaration, Transaction, UserProfile, WealthItem
from rest_framework import serializers
from .models import TaxDeclaration, Transaction, UserProfile, WealthItem

class TaxDeclarationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxDeclaration
        fields = '__all__'
        # Ensure calculated fields and user ownership aren't editable by the client
        read_only_fields = ['user', 'total_tax_payable', 'status']

    def to_representation(self, instance):
        """
        Maps flat Database snake_case to nested React camelCase.
        """
        data = super().to_representation(instance)
        return {
            "id": data['id'],
            "financialYear": data['financial_year'],
            "regime": data['regime'],
            "isFiled": data['is_filed'],
            "status": data['status'],
            "totalTaxPayable": float(data['total_tax_payable']) if data['total_tax_payable'] else 0,
            "income": {
                "salary": float(data['salary']),
                "housePropertyIncome": float(data['house_property_income']),
                "businessIncome": float(data['business_income']),
                "capitalGains": float(data['capital_gains']),
                "otherIncome": float(data['other_income']),
                "interestIncome": float(data['interest_income']),
            },
            "deductions": {
                "section80C": float(data['section_80c']),
                "section80D": float(data['section_80d']),
                "section80E": float(data['section_80e']),
                "section80G": float(data['section_80g']),
                "hra": float(data['hra']),
                "homeLoanInterest": float(data['home_loan_interest']),
                "nps80CCD": float(data['nps_80ccd']),
            }
        }

    def to_internal_value(self, data):
        """
        Maps nested React camelCase back to flat Database snake_case for saving.
        """
        # Extract nested structures safely
        income = data.get('income', {})
        deductions = data.get('deductions', {})
        
        # Create a flat dictionary for the standard validator
        internal_data = {
            "financial_year": data.get('financialYear'),
            "regime": data.get('regime'),
            "is_filed": data.get('isFiled'),
            # Income mapping
            "salary": income.get('salary'),
            "house_property_income": income.get('housePropertyIncome'),
            "business_income": income.get('businessIncome'),
            "capital_gains": income.get('capitalGains'),
            "other_income": income.get('otherIncome'),
            "interest_income": income.get('interestIncome'),
            # Deduction mapping
            "section_80c": deductions.get('section80C'),
            "section_80d": deductions.get('section80D'),
            "section_80e": deductions.get('section80E'),
            "section_80g": deductions.get('section80G'),
            "hra": deductions.get('hra'),
            "home_loan_interest": deductions.get('homeLoanInterest'),
            "nps_80ccd": deductions.get('nps_80ccd'),
        }
        
        # Remove None values to allow model defaults to kick in
        internal_data = {k: v for k, v in internal_data.items() if v is not None}
        
        return super().to_internal_value(internal_data)
    
class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        # Using '__all__' is fine, but specifically listing fields 
        # is often safer for financial apps.
        fields = [
            'id', 'user', 'description', 'amount', 'type', 
            'category', 'date', 'confidence'
        ]
        # 'user' must be read_only so it's set by the ViewSet, not the client
        read_only_fields = ['id', 'user']

    def validate_confidence(self, value):
        """
        Ensures the OCR/AI confidence level stays within 
        a logical percentage range.
        """
        if value < 0 or value > 100:
            raise serializers.ValidationError("Confidence must be between 0 and 100.")
        return value

    def validate_amount(self, value):
        """
        Extra check: Transactions should usually not be zero or negative.
        """
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

class WealthItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WealthItem
        # Including all fields relevant to the frontend, including category/type
        fields = [
            'id', 'user', 'name', 'amount', 
            'type', 'category', 'created_at', 'updated_at'
        ]
        
        # 'user' must be read-only so it's assigned automatically in the ViewSet.
        # 'id' and 'created_at' are managed by the database.
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_amount(self, value):
        """Ensures that assets or liabilities are not saved with negative values."""
        if value < 0:
            raise serializers.ValidationError("Amount cannot be negative.")
        return value

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        # 1. FIXED: Added 'has_completed_onboarding' so Django recognizes it
        fields = [
            'monthly_income', 'monthly_budget', 'daily_budget', 
            'is_business', 'is_onboarded', 'has_completed_onboarding'
        ]

    def to_representation(self, instance):
        """
        Convert snake_case (Django) to camelCase (React).
        This is what React RECEIVES.
        """
        data = super().to_representation(instance)
        return {
            "monthlyIncome": data.get('monthly_income'),
            "monthlyBudget": data.get('monthly_budget'),
            "dailyBudget": data.get('daily_budget'),
            "isBusiness": data.get('is_business'),
            "isOnboarded": data.get('is_onboarded'),
            "hasCompletedOnboarding": data.get('has_completed_onboarding')
        }

    def to_internal_value(self, data):
        """
        Convert camelCase (React) back to snake_case (Django) for saving.
        This is what React SENDS.
        """
        # 2. Map camelCase from the request to snake_case for the Model
        mapped_data = {
            "monthly_income": data.get('monthlyIncome'),
            "monthly_budget": data.get('monthlyBudget'),
            "daily_budget": data.get('dailyBudget'),
            "is_business": data.get('isBusiness'),
            "is_onboarded": data.get('isOnboarded'),
            "has_completed_onboarding": data.get('hasCompletedOnboarding'),
        }
        
        # 3. Remove None values so we don't overwrite existing data with null
        # if only one field is sent (e.g., during a partial update)
        clean_data = {k: v for k, v in mapped_data.items() if v is not None}
        
        # 4. FIXED: Pass the CLEANED snake_case data to the standard validator
        return super().to_internal_value(clean_data)
#checking

#unchecked



