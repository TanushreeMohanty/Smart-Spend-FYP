
# --------------------------------
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import viewsets, status
from django.db.models import Q

from .models import Transaction, WealthItem, UserProfile, TaxProfile, ITRData
from .serializers import TaxProfileSerializer
from django.views.decorators.csrf import csrf_exempt # Add this import
from django.http import JsonResponse
import json
from django.shortcuts import get_object_or_404
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
            "username": user.username,
            "email": user.email
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

@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny]) # Ensures the frontend can access without JWT tokens for now
def wealth_list_create(request, user_id):
    # --- 1. GET: Fetch all assets and liabilities ---
    if request.method == 'GET':
        try:
            items = WealthItem.objects.filter(user_id=user_id).order_by('-created_at')
            data = [{
                "id": item.id,
                "title": item.title,
                "amount": float(item.amount), # Ensure it's a number for Recharts
                "type": item.type,
                "category": item.category
            } for item in items]
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- 2. POST: Add a new item ---
    elif request.method == 'POST':
        data = request.data
        try:
            # Validate user exists first to prevent ForeignKey errors
            if not User.objects.filter(id=user_id).exists():
                return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)

            # Create the item with explicit type casting
            item = WealthItem.objects.create(
                user_id=user_id,
                title=data.get('title', 'Untitled'),
                amount=float(data.get('amount', 0)), # Cast to float to handle strings from JSON
                type=data.get('type', 'asset').lower(), # Ensure lowercase (asset/liability)
                category=data.get('category', 'General')
            )
            
            return Response({
                "message": "Item added successfully", 
                "id": item.id,
                "item": {
                    "title": item.title,
                    "amount": float(item.amount)
                }
            }, status=status.HTTP_201_CREATED)

        except (TypeError, ValueError):
            return Response({"error": "Invalid amount format"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
@csrf_exempt # Add this decorator
@api_view(['DELETE'])
def delete_wealth_item(request, item_id):
    try:
        item = WealthItem.objects.get(id=item_id)
        item.delete()
        return Response({"status": "deleted"}, status=status.HTTP_200_OK)
    except WealthItem.DoesNotExist:
        return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

@csrf_exempt # Add this decorator
@api_view(['PUT', 'PATCH'])
def update_wealth_item(request, item_id):
    try:
        item = WealthItem.objects.get(id=item_id)
        data = request.data

        # Update fields if they exist in the request
        item.title = data.get('title', item.title)
        item.amount = data.get('amount', item.amount)
        item.type = data.get('type', item.type)
        item.category = data.get('category', item.category)
        
        item.save()
        
        return Response({
            "message": "Updated successfully",
            "item": {
                "id": item.id,
                "title": item.title,
                "amount": float(item.amount)
            }
        })
    except WealthItem.DoesNotExist:
        return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def manage_tax_profile(request, user_id):
    try:
        # Check if the user exists first
        user = User.objects.get(id=user_id)
        
        # This is the key: if profile doesn't exist, it creates it 
        # instead of returning a 404.
        profile, created = TaxProfile.objects.get_or_create(user=user)

        if request.method == 'POST':
            # partial=True allows updating just a few fields if needed
            serializer = TaxProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # GET request logic
        serializer = TaxProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@csrf_exempt # Add this decorator
@api_view(['POST'])
@permission_classes([AllowAny]) # Ensures the frontend can access without JWT tokens for now
def save_tax_profile(request):
    # Assuming the user is authenticated
    user = request.user 
    
    # This finds the existing profile or prepares to create a new one
    profile, created = TaxProfile.objects.get_or_create(user=user)
    
    serializer = TaxProfileSerializer(profile, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def itr_data_handler(request, user_id):
    # This ensures a record exists, preventing the 404
    obj, created = ITRData.objects.get_or_create(user_id=user_id)

    if request.method == 'POST':
        # 1. Update with incoming data (keep existing if field is missing)
        obj.income_data = request.data.get('income_data', obj.income_data)
        obj.deductions_data = request.data.get('deductions_data', obj.deductions_data)
        obj.filing_details = request.data.get('filing_details', obj.filing_details)
        obj.tax_regime = request.data.get('tax_regime', obj.tax_regime)
        
        obj.save()
        return Response({
            "status": "success", 
            "message": "ITR Profile synchronized successfully"
        })

    # GET: Return the full profile
    return Response({
        "income_data": obj.income_data,
        "deductions_data": obj.deductions_data,
        "filing_details": obj.filing_details,
        "tax_regime": obj.tax_regime,
        "updated_at": obj.updated_at
    })
# Health Check Endpoint

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"message": "Finance app is working :)"})

