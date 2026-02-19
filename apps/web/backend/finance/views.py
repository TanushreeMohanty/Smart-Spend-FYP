from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import viewsets, status

from .models import Transaction, WealthItem, Profile
from .serializers import TransactionSerializer, WealthItemSerializer

# --- AUTH ENDPOINTS ---

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password, email=email)
    return Response({"message": "User created successfully!", "id": user.id}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)

    if user is not None:
        return Response({
            "message": "Login successful", 
            "user_id": user.id, 
            "username": user.username
        }, status=status.HTTP_200_OK)
    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# --- DATA ENDPOINTS ---

@api_view(['POST'])
@permission_classes([AllowAny]) 
def add_transaction(request):
    try:
        user_id = request.data.get('user_id')
        user = User.objects.get(id=user_id)
        
        # Fixed: Changed 'note' to 'title' to match models.py
        # Added: type and category (required fields)
        Transaction.objects.create(
            user=user,
            title=request.data.get('title', 'No Title'),
            amount=request.data.get('amount'),
            type=request.data.get('type', 'expense'),
            category=request.data.get('category', 'other'),
            # Add this line to capture the boolean from React
            is_recurring=request.data.get('is_recurring', False) 
        )
        return Response({"message": f"Transaction saved for {user.username}"}, status=status.HTTP_201_CREATED)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def update_settings(request):
    try:
        user_id = request.data.get("user_id")
        user = User.objects.get(id=user_id)
        
        profile, created = Profile.objects.get_or_create(user=user)
        
        profile.monthly_income = request.data.get("monthly_income", profile.monthly_income)
        profile.monthly_budget = request.data.get("monthly_budget", profile.monthly_budget)
        profile.is_business = request.data.get("is_business", profile.is_business)
        profile.save()
        
        return Response({"message": "Settings updated successfully"}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"message": "Finance app is working :)"})

# --- VIEWSETS (If using Router) ---

class FinanceViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'], url_path='add-transaction')
    def add_transaction(self, request):
        serializer = TransactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='add-wealth')
    def add_wealth(self, request):
        serializer = WealthItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)