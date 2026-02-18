from django.urls import path
from . import views

urlpatterns = [
    # Health check for testing connection
    path('test/', views.health_check, name='health_check'),
    
    # Auth endpoints
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    
    # Data endpoints
    path('add-transaction/', views.add_transaction, name='add_transaction'),
    
    # ADD THIS: To stop the 404 in your DataContext.jsx
    # path('transactions/', views.get_transactions, name='get_transactions'),
]


# # first check done
# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import (
#     TransactionViewSet,
#     WealthItemViewSet,
#     UserProfileViewSet,
#     TaxDeclarationViewSet,
#     ITRViewSet,
#     tax_risk_report,
#     get_audit_report,
#     export_transactions_csv,
#     user_profile_view, # Correction: Ensure name matches views.py
#     get_analytics,
#     run_ai_watchdog,
#     ProfileView,
# )


# router = DefaultRouter()
# router.register(r'transactions', TransactionViewSet, basename='transaction')
# router.register(r'wealth-items', WealthItemViewSet, basename='wealth-item')
# router.register(r'user-profile', UserProfileViewSet, basename='user-profile')
# router.register(r'tax-declarations', TaxDeclarationViewSet, basename='tax-declaration')
# router.register(r'itr-wizard', ITRViewSet, basename='itr-wizard')

# urlpatterns = [
#     # CORRECTION: Custom paths with shared prefixes MUST come before router.urls
#     path('transactions/export-csv/', export_transactions_csv, name='export-csv'),
    
#     # Standard ViewSet Routes
#     path('', include(router.urls)),
    
#     # Functional API Endpoints
#     path('audit-report/', get_audit_report, name='audit-report'),
#     path('tax-risk/', tax_risk_report, name='tax-risk-report'),
#     path('settings/', user_profile_view, name='manage-settings'), # Use the correct view function
#     path('analytics/', get_analytics, name='analytics'),
#     path('watchdog/', run_ai_watchdog, name='run-watchdog'),
#     path('profile/', ProfileView.as_view(), name='profile'),
#     path('transactions/', TransactionViewSet.as_view({'get': 'list', 'post': 'create'}), name='transactions'),
# ]