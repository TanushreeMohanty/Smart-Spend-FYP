from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from .models import Profile
import json

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

# FIX: Added permission_classes here to stop the 403 error
@api_view(['POST'])
@permission_classes([AllowAny]) 
def add_transaction(request):
    try:
        user_id = request.data.get('user_id')
        user = User.objects.get(id=user_id)
        
        Transaction.objects.create(
            user=user,
            amount=request.data.get('amount'),
            note=request.data.get('note')
        )
        return Response({"message": f"Transaction saved for {user.username}"}, status=status.HTTP_201_CREATED)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"message": "Finance app is working :)"})

@csrf_exempt
def update_settings(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            
            # Find the user
            user = User.objects.get(id=user_id)
            
            # Get or Create the profile for this user
            profile, created = Profile.objects.get_or_create(user=user)
            
            # Update fields from Wizard
            profile.monthly_income = data.get("monthly_income", 0)
            profile.monthly_budget = data.get("monthly_budget", 0)
            profile.is_business = data.get("is_business", False)
            profile.save()
            
            return JsonResponse({"message": "Settings updated successfully"}, status=200)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
            
    return JsonResponse({"error": "Invalid method"}, status=405)

