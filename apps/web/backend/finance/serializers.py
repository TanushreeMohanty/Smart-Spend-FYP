from rest_framework import serializers
from .models import Transaction, WealthItem

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'title', 'amount', 'type', 'category', 'date']

class WealthItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WealthItem
        fields = ['id', 'name', 'amount', 'type', 'institution']
 