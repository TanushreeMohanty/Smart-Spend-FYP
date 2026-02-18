from django.contrib import admin
from .models import Transaction

from django.contrib import admin
from .models import Transaction

class TransactionAdmin(admin.ModelAdmin):
    # This list defines the columns in your Django Admin table
    list_display = ('user', 'amount', 'note', 'created_at')
    
    # Optional: Adds a sidebar filter for users and dates
    list_filter = ('user', 'created_at')
    
    # Optional: Adds a search bar for the notes
    search_fields = ('note',)

# Register the model with the customized admin class
admin.site.register(Transaction, TransactionAdmin)

# #first check done
# from django.contrib import admin
# from django.utils.html import format_html
# from django.utils import timezone
# from .models import TaxDeclaration, Transaction, UserProfile, WealthItem

# # 1. User Profile Admin
# @admin.register(UserProfile)
# class UserProfileAdmin(admin.ModelAdmin):
#     list_display = ('user', 'monthly_income', 'monthly_budget', 'onboarding_step', 'is_business')
#     list_filter = ('is_business', 'onboarding_step')
#     search_fields = ('user__username', 'user__email')

# # 2. Transaction Admin (Enhanced with Risk Highlighting)
# @admin.register(Transaction)
# class TransactionAdmin(admin.ModelAdmin):
#     list_display = ('description', 'user', 'amount', 'type', 'category', 'date', 'confidence_tag', 'is_verified')
#     list_filter = ('type', 'category', 'date', 'is_verified', 'source')
#     search_fields = ('description', 'user__username')
#     ordering = ('-date', '-created_at')
    
#     # Bulk Action: Verify multiple transactions at once
#     actions = ['mark_as_verified']

#     @admin.display(description="OCR Confidence")
#     def confidence_tag(self, obj):
#         """Visual tag to highlight low-confidence OCR scans."""
#         color = "green" if obj.confidence > 80 else "orange" if obj.confidence > 50 else "red"
#         return format_html('<b style="color:{};">{}%</b>', color, obj.confidence)

#     @admin.action(description="Mark selected as Verified")
#     def mark_as_verified(self, request, queryset):
#         queryset.update(is_verified=True)

# # 3. Wealth Item Admin
# @admin.register(WealthItem)
# class WealthItemAdmin(admin.ModelAdmin):
#     list_display = ('name', 'user', 'amount_display', 'type', 'category')
#     list_filter = ('type', 'category', 'user')
#     search_fields = ('name',)

#     @admin.display(description="Amount")
#     def amount_display(self, obj):
#         color = "red" if obj.type == 'liability' else "black"
#         return format_html('<span style="color:{};">₹{:,.2f}</span>', color, obj.amount)

# # 4. Tax Declaration Admin
# @admin.register(TaxDeclaration)
# class TaxDeclarationAdmin(admin.ModelAdmin):
#     list_display = ('user', 'regime', 'status_tag', 'total_tax_payable', 'filed_at')
#     list_filter = ('status', 'regime', 'financial_year')
#     readonly_fields = ('filed_at', 'updated_at', 'created_at')
    
#     @admin.display(description="Filing Status")
#     def status_tag(self, obj):
#         """Visual badge for filing status."""
#         colors = {'draft': 'gray', 'filed': 'blue'}
#         return format_html(
#             '<span style="background:{}; color:white; padding:2px 6px; border-radius:4px;">{}</span>',
#             colors.get(obj.status, 'black'),
#             obj.status.upper()
#         )