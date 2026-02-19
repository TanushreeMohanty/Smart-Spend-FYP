from django.urls import path
from . import views

urlpatterns = [
    # 1. Health & Meta
    path('test/', views.health_check, name='health_check'),
    
    # 2. Auth (Added trailing slashes for consistency)
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    
    # 3. Profile & Settings
    path('profile/<int:user_id>/', views.profile_settings, name='profile_settings'),
    
    # 4. Transactions
    path('add-transaction/', views.add_transaction, name='add_transaction'),
    path('history/<int:user_id>/', views.get_transaction_history, name='transaction-history'),
    path('update-transaction/<int:pk>/', views.update_transaction, name='update_transaction'),
    path('delete-transaction/<int:pk>/', views.delete_transaction, name='delete_transaction'),
    
    # 5. Wealth Page
    # Handles GET (fetch all) and POST (add new)
    path('get-wealth/<int:user_id>/', views.wealth_list_create, name='wealth-list-create'),
    
    # Handles DELETE for a specific item
    path('delete-wealth/<int:item_id>/', views.delete_wealth_item, name='delete-wealth'),
    
    # Handles PUT/PATCH for editing an item
    path('update-wealth/<int:item_id>/', views.update_wealth_item, name='update-wealth'),
]