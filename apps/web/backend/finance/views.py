from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import viewsets, status

from .models import Transaction, WealthItem, Profile
from .serializers import TransactionSerializer, WealthItemSerializer


from django.db.models import Q
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
    

@api_view(['GET'])
@permission_classes([AllowAny]) # Add this temporarily to test!
def get_transaction_history(request, user_id):
    # Start with all transactions for this user
    queryset = Transaction.objects.filter(user_id=user_id)

    # 1. Text Search (Matches React: t.title or t.amount)
    search = request.query_params.get('search')
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) | Q(amount__icontains=search)
        )

    # 2. Date Range
    start_date = request.query_params.get('startDate')
    end_date = request.query_params.get('endDate')
    if start_date:
        queryset = queryset.filter(date__gte=start_date)
    if end_date:
        queryset = queryset.filter(date__lte=end_date)

    # 3. Amount Range
    min_amt = request.query_params.get('minAmount')
    max_amt = request.query_params.get('maxAmount')
    if min_amt:
        queryset = queryset.filter(amount__gte=min_amt)
    if max_amt:
        queryset = queryset.filter(amount__lte=max_amt)

    # 4. Categories & Types (Handle multiple values)
    categories = request.query_params.getlist('categories[]')
    if categories:
        queryset = queryset.filter(category__in=categories)
        
    types = request.query_params.getlist('types[]')
    if types:
        queryset = queryset.filter(type__in=types)

    # 5. Sorting (Matches React: sortBy)
    sort_by = request.query_params.get('sortBy', 'date-desc')
    sort_mapping = {
        'date-asc': 'date',
        'date-desc': '-date',
        'amount-asc': 'amount',
        'amount-desc': '-amount'
    }
    queryset = queryset.order_by(sort_mapping.get(sort_by, '-date'))

    # Format data for React
    data = [{
        "id": t.id,
        "title": t.title,
        "amount": float(t.amount),
        "type": t.type,
        "category": t.category,
        "date": t.date.isoformat(),
        "is_recurring": t.is_recurring
    } for t in queryset]

    return Response(data)
    
@api_view(['DELETE'])
@permission_classes([AllowAny]) # Keep this for testing
def delete_transaction(request, pk):
    try:
        transaction = Transaction.objects.get(pk=pk)
        transaction.delete()
        return Response({"message": "Deleted successfully"}, status=204)
    except Transaction.DoesNotExist:
        # If the ID exists in React but not in the DB, this triggers
        return Response({"error": "Transaction not found"}, status=404)
    
    
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