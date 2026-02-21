from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, Transaction, WealthItem, TaxProfile,ITRData
import json
from django.utils.safestring import mark_safe
# --- 1. INLINES ---
# These allow you to edit profile/tax data directly on the User page
class TaxProfileInline(admin.StackedInline): # Corrected inheritance
    model = TaxProfile
    can_delete = False
    verbose_name_plural = 'Tax Profile'
    # Defining fieldsets for the inline view
    fieldsets = (
        ('Deductions', {
            'fields': (
                'is_business',
                ('annual_rent', 'annual_epf'),
                ('nps_contribution', 'health_insurance_self'),
                ('health_insurance_parents', 'home_loan_interest', 'education_loan_interest'),
            ),
        }),
    )

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'General Profile'

# --- 2. USER RE-REGISTRATION ---
# Unregister the default User admin and register with our inlines
admin.site.unregister(User)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline, TaxProfileInline)

# --- 3. MODEL ADMINS ---

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'monthlyIncome', 'monthlyBudget', 'is_business')
    list_filter = ('is_business',)
    search_fields = ('user__username', 'user__email')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'amount', 'type', 'category', 'date', 'is_recurring') 
    list_filter = ('type', 'category', 'date', 'is_recurring', 'user')
    search_fields = ('title', 'category', 'user__username')
    date_hierarchy = 'date' # Adds a nice date drill-down at the top

@admin.register(WealthItem)
class WealthItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'amount_formatted', 'type', 'category')
    list_filter = ('type', 'category', 'user')
    search_fields = ('title', 'user__username')
    readonly_fields = ('created_at',)

    def amount_formatted(self, obj):
        return f"₹{obj.amount:,.2f}"
    amount_formatted.short_description = 'Amount'

@admin.register(TaxProfile)
class TaxProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_business', 'annual_rent', 'updated_at')
    list_filter = ('is_business', 'updated_at')
    search_fields = ('user__username',)
    
    fieldsets = (
        ('Owner', {'fields': ('user',)}),
        ('Status', {'fields': ('is_business',)}),
        ('Section 80C & HRA', {
            'description': "Common deductions",
            'fields': ('annual_rent', 'annual_epf')
        }),
        ('Other Deductions', {
            'fields': ('nps_contribution', 'health_insurance_self', 'health_insurance_parents')
        }),
        ('Loan Interests', {
            'fields': ('home_loan_interest', 'education_loan_interest')
        }),
    )
    
@admin.register(ITRData)
class ITRDataAdmin(admin.ModelAdmin):
    # 1. Main List View: Added Regime and Total Deductions for quick overview
    list_display = ('user', 'get_pan', 'get_salary', 'get_total_deductions', 'tax_regime', 'updated_at')
    
    # 2. Search and Filters: Search by PAN, Email, or Username
    search_fields = ('user__username', 'filing_details__panNumber', 'filing_details__email')
    list_filter = ('tax_regime', 'updated_at')

    # --- HELPER METHODS FOR LIST DISPLAY ---
    
    def get_salary(self, obj):
        val = obj.income_data.get('salary', 0)
        return f"₹{val}" if val else "₹0"
    get_salary.short_description = 'Salary'

    def get_pan(self, obj):
        return obj.filing_details.get('panNumber', 'N/A').upper()
    get_pan.short_description = 'PAN'

    def get_total_deductions(self, obj):
        # Sums up the common deduction fields for the admin list view
        d = obj.deductions_data or {}
        total = sum([float(v) for v in d.values() if str(v).replace('.','',1).isdigit()])
        return f"₹{total:,.0f}"
    get_total_deductions.short_description = 'Total Deductions'

    # --- ORGANIZED EDIT PAGE ---
    fieldsets = (
        ('Account & Strategy', {
            'fields': ('user', 'tax_regime'),
            'description': 'User account linked to this tax profile and their chosen regime.'
        }),
        ('Financial Data (JSON)', {
            'fields': ('income_data', 'deductions_data'),
            'classes': ('collapse',), # Makes this section collapsible
            'description': 'Detailed breakdown of income sources and 80C/80D deductions.'
        }),
        ('Official Filing Details', {
            'fields': ('filing_details',),
            'description': 'PAN, Aadhar, and Bank contact information.'
        }),
        ('System Metadata', {
            'fields': ('updated_at',),
        }),
    )
    
    readonly_fields = ('updated_at',)

    # Custom styling for the JSON fields in admin (Optional but helpful)
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # You can add custom placeholder/help text here if needed
        return form

# Optional: If you want to use a fancy JSON editor, 
# you can install 'django-json-widget' and register it here.