import os
import django
import firebase_admin
from firebase_admin import auth

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def verify_setup():
    try:
        # Try to list users (just to check connectivity)
        # This will fail if your private_key or project_id is wrong
        page = auth.list_users()
        print("✅ Success! Django is successfully connected to Firebase.")
        print(f"Found {len(list(page.users))} users in your Firebase Project.")
    except Exception as e:
        print("❌ Firebase Connection Failed!")
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_setup()