from django.contrib import admin
from .models import UserProfile, Transaction, WealthItem

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    # Updated to match the new field names in your unified UserProfile model
    list_display = ('user', 'monthlyIncome', 'monthlyBudget', 'dailyBudget', 'is_business')
    list_filter = ('is_business',)
    search_fields = ('user__username', 'user__email')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    # 'title' and 'is_recurring' are now visible in the admin list
    list_display = ('user', 'title', 'amount', 'type', 'category', 'date', 'is_recurring') 
    
    # Filter by user or recurrence to find subscriptions quickly
    list_filter = ('user', 'type', 'category', 'date', 'is_recurring')
    
    # Search by title or username
    search_fields = ('title', 'category', 'user__username')

@admin.register(WealthItem)
class WealthItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'amount', 'type', 'institution', 'user')
    list_filter = ('type', 'institution', 'user')
    search_fields = ('name', 'institution', 'user__username')