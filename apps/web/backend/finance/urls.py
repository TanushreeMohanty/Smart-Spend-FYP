from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Using a router for ViewSets (cleaner for CRUD operations)
router = DefaultRouter()
# If you used a ViewSet for transactions, you'd register it here:
# router.register(r'transactions', views.TransactionViewSet, basename='transaction')

urlpatterns = [
    # 1. Health & Meta
    path('test/', views.health_check, name='health_check'),
    
    # 2. Auth Endpoints
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    
    # 3. Data Endpoints (Matches your React AddPage fetch calls)
    path('add-transaction/', views.add_transaction, name='add_transaction'),
    path('update-settings/', views.update_settings, name='update_settings'),
    
    # 4. Future Expansion (Optional: for History/Dashboard)
    # path('summary/', views.get_finance_summary, name='finance_summary'),
]