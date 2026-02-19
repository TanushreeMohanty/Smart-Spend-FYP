from django.contrib import admin
from .models import Profile, Transaction

class TransactionAdmin(admin.ModelAdmin):
    # This list defines the columns in your Django Admin table
    list_display = ('user', 'amount', 'note', 'created_at')
    
    # Optional: Adds a sidebar filter for users and dates
    list_filter = ('user', 'created_at')
    
    # Optional: Adds a search bar for the notes
    search_fields = ('note',)

# Register the model with the customized admin class
admin.site.register(Transaction, TransactionAdmin)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'monthly_income', 'monthly_budget', 'is_business')