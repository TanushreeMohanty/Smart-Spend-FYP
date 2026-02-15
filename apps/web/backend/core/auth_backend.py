import os
from firebase_admin import auth
from django.contrib.auth.models import User
from rest_framework import authentication, exceptions
from django.conf import settings

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        """
        Authenticates the request based on the Firebase ID Token 
        passed in the Authorization header.
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        # Extract the token from 'Bearer <token>'
        id_token = auth_header.split(' ').pop()
        
        try:
            # verify_id_token uses the app initialized in settings.py
            decoded_token = auth.verify_id_token(id_token)
            uid = decoded_token.get('uid')
            email = decoded_token.get('email')
            
            # Map the Firebase UID to a Django User in your local SQL database
            user, created = User.objects.get_or_create(
                username=uid, 
                defaults={'email': email}
            )
            
            # Return the user object and None (DRF standard for auth backends)
            return (user, None)
            
        except Exception as e:
            # Catch expired tokens or invalid signatures
            raise exceptions.AuthenticationFailed(f'Invalid Firebase Token: {str(e)}')