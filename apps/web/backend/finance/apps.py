# makes this run perfectly 'python test_firebase.py'
from django.apps import AppConfig

class FinanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finance'

    def ready(self):
        # This imports the signals when the app starts
        import finance.signals
        
# #first check done
# from django.apps import AppConfig

# class FinanceConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = 'finance'
#     verbose_name = 'Spendsy Finance Management'

#     def ready(self):
#         # This import is what actually activates the @receiver decorators
#         import finance.signals