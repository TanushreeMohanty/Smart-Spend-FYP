from django.contrib import admin
from .models import Profile, Transaction, WealthItem

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'monthly_income', 'monthly_budget', 'is_business')
    list_filter = ('is_business',)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    # Added 'title' and 'is_recurring' to the list
    list_display = ('user', 'title', 'amount', 'type', 'category', 'date', 'is_recurring') 
    
    # Added 'is_recurring' to filters so you can find subscriptions easily
    list_filter = ('user', 'type', 'category', 'date', 'is_recurring')
    
    # Added 'title' to search so you can find specific purchases like "Starbucks"
    search_fields = ('title', 'category', 'user__username') # 'user__username' lets you search by the actual name

@admin.register(WealthItem)
class WealthItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'amount', 'type', 'institution', 'user')
    list_filter = ('type', 'institution', 'user')
    search_fields = ('name', 'institution')