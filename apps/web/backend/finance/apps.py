from django.apps import AppConfig

class FinanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finance'

    def ready(self):
        # We still keep this if you have local Django signals
        # (e.g., auto-creating a Profile for every new User)
        try:
            import finance.signals
        except ImportError:
            pass