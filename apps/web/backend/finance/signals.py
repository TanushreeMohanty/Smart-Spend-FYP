#first check done
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile

@receiver(post_save, sender=User)
def manage_user_profile(sender, instance, created, **kwargs):
    """
    Handles both creation and updates. 
    Using a single function is cleaner for debugging.
    """
    if created:
        # Create the profile only if it's a new user
        UserProfile.objects.get_or_create(user=instance)
    else:
        # For existing users, ensure the profile exists before saving
        if hasattr(instance, 'profile'):
            instance.profile.save()

from django.apps import AppConfig

class FinanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finance'

    def ready(self):
        # This is the "on-switch" for your signals
        import finance.signals            
