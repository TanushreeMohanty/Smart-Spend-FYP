from django.contrib import admin
from django.urls import path,include
from django.http import JsonResponse

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/finance/', include('finance.urls')), # This "consumes" the first part of the URL
]

# def temp_test_view(request):
#     return JsonResponse({"message": "Finance app is working :)"})

# urlpatterns = [
#     path('test/', temp_test_view),
# ]


# # first check done
# from django.contrib import admin
# from django.urls import path, include
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny
# from rest_framework.response import Response

# # CORRECTION: DRF-style health check 
# # This is the target for your React App's checkBackend() effect
# @api_view(['GET'])
# @permission_classes([AllowAny])
# def health_check(request):
#     return Response({
#         "status": "online",
#         "message": "Spendsy Finance API is connected!",
#         "version": "1.0.0"
#     })

# urlpatterns = [
#     # Main Admin Panel
#     path('admin/', admin.site.urls),

#     # Spendsy Finance API 
#     # This includes Transactions, Wealth, Tax, and Audit routes
#     path('api/finance/', include('finance.urls')), 

#     # Connection Test Endpoint
#     path('api/test/', health_check), 
# ]