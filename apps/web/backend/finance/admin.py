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
    # Columns to display in the list view
    list_display = ('title', 'user', 'amount_formatted', 'type', 'category', 'created_at')
    
    # Filters on the right sidebar
    list_filter = ('type', 'category', 'user')
    
    # Search box functionality
    search_fields = ('title', 'user__username', 'category')
    
    # Read-only fields
    readonly_fields = ('created_at',)

    # Helper to show currency symbol in admin
    def amount_formatted(self, obj):
        return f"₹{obj.amount:,.2f}"
    amount_formatted.short_description = 'Amount'