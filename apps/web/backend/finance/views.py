
# --------------------------------
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import viewsets, status
from django.db.models import Q

from .models import Transaction, WealthItem, UserProfile
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
    # Ensure a profile is created upon registration if signals aren't used
    UserProfile.objects.get_or_create(user=user)
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

# --- PROFILE & SETTINGS ---

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def profile_settings(request, user_id):
    """
    Handles both Welcome Wizard and Profile Page updates.
    Uses camelCase to match React state keys.
    """
    try:
        user = User.objects.get(id=user_id)
        profile, created = UserProfile.objects.get_or_create(user=user)

        if request.method == 'POST':
            # Mapping frontend camelCase to backend model fields
            profile.monthlyIncome = request.data.get('monthlyIncome', profile.monthlyIncome)
            profile.monthlyBudget = request.data.get('monthlyBudget', profile.monthlyBudget)
            profile.dailyBudget = request.data.get('dailyBudget', profile.dailyBudget)
            profile.is_business = request.data.get('is_business', profile.is_business)
            profile.save()
            
            return Response({
                "message": "Settings updated!",
                "settings": {
                    "monthlyIncome": float(profile.monthlyIncome),
                    "monthlyBudget": float(profile.monthlyBudget),
                    "dailyBudget": float(profile.dailyBudget),
                    "is_business": profile.is_business
                }
            }, status=status.HTTP_200_OK)

        return Response({
            "monthlyIncome": float(profile.monthlyIncome),
            "monthlyBudget": float(profile.monthlyBudget),
            "dailyBudget": float(profile.dailyBudget),
            "is_business": profile.is_business
        })

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- TRANSACTION ENDPOINTS ---

@api_view(['POST'])
@permission_classes([AllowAny]) 
def add_transaction(request):
    try:
        user_id = request.data.get('user_id')
        user = User.objects.get(id=user_id)
        
        Transaction.objects.create(
            user=user,
            title=request.data.get('title', 'No Title'),
            amount=request.data.get('amount'),
            type=request.data.get('type', 'expense'),
            category=request.data.get('category', 'other'),
            is_recurring=request.data.get('is_recurring', False) 
        )
        return Response({"message": "Transaction saved"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_transaction_history(request, user_id):
    queryset = Transaction.objects.filter(user_id=user_id)

    # Search, Date, Amount filters...
    search = request.query_params.get('search')
    if search:
        queryset = queryset.filter(Q(title__icontains=search) | Q(amount__icontains=search))

    # Formatting for React
    data = [{
        "id": t.id,
        "title": t.title,
        "amount": float(t.amount),
        "type": t.type,
        "category": t.category,
        "date": t.date.isoformat(),
        "is_recurring": t.is_recurring
    } for t in queryset.order_by('-date')]

    return Response(data)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_transaction(request, pk):
    try:
        Transaction.objects.get(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Transaction.DoesNotExist:
        return Response({"error": "Not found"}, status=404)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny]) # Keep this consistent with your history view for now
def update_transaction(request, pk):
    try:
        transaction = Transaction.objects.get(pk=pk)
        
        # 1. Map 'description' from the React Modal to 'title' in Django
        if 'description' in request.data:
            transaction.title = request.data.get('description')
        elif 'title' in request.data:
            transaction.title = request.data.get('title')

        # 2. Update Numerical and Choice fields
        if 'amount' in request.data:
            transaction.amount = request.data.get('amount')
            
        if 'type' in request.data:
            # Ensure 'Income'/'Expense' becomes 'income'/'expense'
            transaction.type = request.data.get('type').lower()
            
        if 'category' in request.data:
            transaction.category = request.data.get('category').lower()
            
        if 'date' in request.data:
            transaction.date = request.data.get('date')

        # 3. Save and Return updated data
        transaction.save()
        
        return Response({
            "message": "Updated successfully",
            "id": transaction.id,
            "title": transaction.title
        }, status=200)

    except Transaction.DoesNotExist:
        return Response({"error": "Transaction not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=400)
    
# --- WEALTH ENDPOINTS ---

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def wealth_list(request, user_id):
    if request.method == 'GET':
        items = WealthItem.objects.filter(user_id=user_id)
        serializer = WealthItemSerializer(items, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = WealthItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user_id=user_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_wealth_item(request, pk):
    try:
        WealthItem.objects.get(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except WealthItem.DoesNotExist:
        return Response({"error": "Item not found"}, status=404)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"message": "Finance app is working :)"})