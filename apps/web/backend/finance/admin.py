from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, Transaction, WealthItem, TaxProfile

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