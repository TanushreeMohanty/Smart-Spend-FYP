from django.urls import path
from . import views

urlpatterns = [
    # 1. Health & Meta
    path('test/', views.health_check, name='health_check'),
    
    # 2. Auth
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    
    # 3. Profile & Settings (Wizard + Profile Page both use this)
    path('profile/<int:user_id>/', views.profile_settings, name='profile_settings'),
    
    # 4. Transactions
    path('add-transaction/', views.add_transaction, name='add_transaction'),
    path('history/<int:user_id>/', views.get_transaction_history, name='transaction-history'),
    path('update-transaction/<int:pk>/', views.update_transaction, name='update_transaction'),
    path('delete-transaction/<int:pk>/', views.delete_transaction, name='delete_transaction'),
    
    # 5. Wealth Page (NEW)
    path('wealth/<int:user_id>/', views.wealth_list, name='wealth_list'),
    path('wealth-delete/<int:pk>/', views.delete_wealth_item, name='delete_wealth'),
]