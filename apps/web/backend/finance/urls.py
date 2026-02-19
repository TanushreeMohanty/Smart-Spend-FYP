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
    path('update-settings/', views.update_settings, name='update_settings'),
]

