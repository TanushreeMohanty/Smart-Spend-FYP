# first check done
#checked 
# imports-------------------------
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Q, Count
from django.db.models.functions import TruncMonth, TruncDay, TruncHour
from django.utils import timezone
from .models import TaxDeclaration, Transaction, WealthItem, UserProfile
from .serializers import (
    TaxDeclarationSerializer, 
    TransactionSerializer, 
    WealthItemSerializer, 
    UserProfileSerializer
)
from .services import TaxEngine, WatchdogService
from datetime import datetime
from django_filters.rest_framework import DjangoFilterBackend
import csv
from django.http import HttpResponse
from rest_framework.views import APIView
# classes-----------------------------
class TaxDeclarationViewSet(viewsets.ModelViewSet):
    serializer_class = TaxDeclarationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TaxDeclaration.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        income = self.request.data.get('income', {})
        deductions = self.request.data.get('deductions', {})
        serializer.save(
        user=self.request.user,
        salary=income.get('salary', 0),
        business_income=income.get('businessIncome', 0),
        house_property=income.get('houseProperty', 0),
        capital_gains=income.get('capitalGains', 0),
        other_income=income.get('otherIncome', 0),
        # Deductions
        section_80c=deductions.get('section80C', 0),
        section_80d=deductions.get('section80D', 0),
        nps_80ccd=deductions.get('nps80CCD', 0)
    )
    
class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # --- Filtering & Search Config ---
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'date': ['gte', 'lte'],      # Matches startDate/endDate
        'amount': ['gte', 'lte'],    # Matches minAmount/maxAmount
        'category': ['exact', 'in'], # Matches category selection
        'type': ['exact', 'in'],     # Matches income/expense toggle
    }
    search_fields = ['description']
    ordering_fields = ['date', 'amount']
    ordering = ['-date'] # Default: Newest First

    def get_queryset(self):
        """Only show transactions belonging to the logged-in user."""
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically link new transactions to the current user."""
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        """Handles 'Save Changes' and Audit Logging for confidence changes."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Audit Check: Log if user lowers confidence to 0
        new_confidence = request.data.get('confidence')
        if instance.confidence > 0 and new_confidence is not None and int(new_confidence) == 0:
            print(f"Audit Warning: User manually changed verified transaction {instance.id}")
            
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    # --- Custom Actions ---

    @action(detail=False, methods=['post'], url_path='bulk-sync')
    def bulk_sync(self, request):
        """Matches 'handleSyncToCloud' from React. Expects a list of objects."""
        serializer = self.get_serializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({
                "message": f"Successfully synced {len(serializer.data)} items",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """Matches 'onBulkDelete' logic. Expects list of IDs."""
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
            
        deleted_count, _ = Transaction.objects.filter(user=request.user, id__in=ids).delete()
        return Response({"message": f"Deleted {deleted_count} items"}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='summary')
    def get_summary(self, request):
        """DASHBOARD DATA: Aggregates metrics for the HomePage."""
        user = request.user
        now = datetime.now()
        
        # Aggregations
        monthly_exp = Transaction.objects.filter(
            user=user, type='expense', date__month=now.month
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        total_income = Transaction.objects.filter(
            user=user, type='income'
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Net Worth (assuming WealthItem model exists)
        assets = WealthItem.objects.filter(user=user, type='asset').aggregate(Sum('amount'))['amount__sum'] or 0
        liabilities = WealthItem.objects.filter(user=user, type='liability').aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Tax Calculation (assuming TaxEngine utility exists)
        taxable = max(0, total_income - 75000) 
        est_tax = TaxEngine.calculate_new_regime_tax(taxable)

        return Response({
            "metrics": {
                "expense": float(monthly_exp),
                "netWorth": float(assets - liabilities),
                "estimatedTax": float(est_tax),
                "count": self.get_queryset().count()
            },
            "recent": self.get_serializer(self.get_queryset()[:6], many=True).data
        })

class UserProfileViewSet(viewsets.GenericViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    @action(detail=False, methods=['get'])
    def profile(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    @action(detail=False, methods=['patch'])
    def complete_onboarding(self, request):
        profile = request.user.profile
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(has_completed_onboarding=True)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class WealthItemViewSet(viewsets.ModelViewSet):
    serializer_class = WealthItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Scope items to the logged-in user only."""
        return WealthItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically link the new asset/liability to the user."""
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        """
        Overrides the default list view to include Net Worth calculation 
        and trend data for the frontend header cards.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Calculate Net Worth for the header dashboard
        assets = queryset.filter(type='asset').aggregate(total=Sum('amount'))['total'] or 0
        liabilities = queryset.filter(type='liability').aggregate(total=Sum('amount'))['total'] or 0
        net_worth = assets - liabilities

        return Response({
            "items": serializer.data,
            "total_net_worth": float(net_worth),
            # Mock historical data - ideally, you'd pull this from a WealthHistory model
            "history_data": [
                {"month": "Jan", "value": float(net_worth) * 0.9},
                {"month": "Feb", "value": float(net_worth)}
            ]
        })

class ITRViewSet(viewsets.ModelViewSet):
    serializer_class = TaxDeclarationSerializer

    def get_queryset(self):
        return TaxDeclaration.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def submit_return(self, request, pk=None):
        """Final submission logic"""
        declaration = self.get_object()
        
        # Backend re-calculation for security
        total_income = (
            declaration.salary + declaration.business_income + 
            declaration.house_property + declaration.capital_gains + 
            declaration.other_income + declaration.interest_income
        )
        
        # Calculate final tax based on chosen regime
        final_tax = TaxEngine.calculate_new_regime_tax(total_income)
        
        declaration.total_tax_payable = final_tax
        declaration.status = 'filed'
        declaration.filed_at = timezone.now()
        declaration.save()
        
        return Response({"message": "ITR Filed Successfully", "tax_due": float(final_tax)})
    
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, user):
        """Helper to get or create the profile for the authenticated user."""
        profile, created = UserProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        """Retrieve the user's financial profile."""
        profile = self.get_object(request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        """
        Update specific fields in the user's financial profile.
        Handles the transition from React's camelCase to Django's snake_case
        via the Serializer's to_internal_value method.
        """
        profile = self.get_object(request.user)
        
        # partial=True is critical: it allows us to update only 
        # the fields sent (like just monthly_income)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # If validation fails, return the errors so React can log them
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#functions-------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_audit_report(request):
    """
    Consolidated Audit & Tax Risk Report.
    Calculates Integrity Score, Tax Liability, and Risk Levels.
    """
    user = request.user
    profile = getattr(user, 'profile', None)
    
    # 1. Stats & Integrity (Verified vs Manual)
    stats = Transaction.objects.filter(user=user).aggregate(
        total_count=Count('id'),
        verified_count=Count('id', filter=Q(confidence__gt=0)),
        unverified_count=Count('id', filter=Q(confidence=0)),
        unverified_volume=Sum('amount', filter=Q(confidence=0)),
        high_risk_count=Count('id', filter=Q(confidence=0, amount__gt=50000))
    )

    # 2. Income Heads
    income_heads = Transaction.objects.filter(user=user, type='income').aggregate(
        salary=Sum('amount', filter=Q(category='salary')) or 0,
        business=Sum('amount', filter=Q(category='business')) or 0,
        other=Sum('amount', filter=Q(category__in=['interest', 'gifts', 'other'])) or 0
    )

    # 3. Logic Calculations
    total = stats['total_count'] or 1
    integrity_score = (stats['verified_count'] / total) * 100
    
    risk_level = "Low"
    if integrity_score < 50 or stats['high_risk_count'] > 0:
        risk_level = "High"
    elif integrity_score < 80:
        risk_level = "Medium"

    total_income = sum(income_heads.values())
    tax_recommended = TaxEngine.calculate_new_regime(total_income) if 'TaxEngine' in globals() else 0

    return Response({
        "fiscalYear": "2025-26",
        "integrity": {
            "score": round(integrity_score, 1),
            "status": "Audit Ready" if integrity_score > 80 else "Risk Detected",
            "risk_level": risk_level
        },
        "summary": {
            "unverified_count": stats['unverified_count'],
            "unverified_amount": float(stats['unverified_volume'] or 0),
            "high_value_warnings": stats['high_risk_count']
        },
        "income_heads": income_heads,
        "tax_estimate": float(tax_recommended),
        "recommendation": "High risk detected. Keep physical receipts." if risk_level == "High" else "Healthy audit trail."
    })

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """Handles fetching and updating user settings/profile."""
    user = request.user
    profile, created = UserProfile.objects.get_or_create(user=user)

    if request.method == 'PATCH':
        # Check for camelCase keys from React and map to snake_case
        data = request.data.copy()
        mapping = {
            'monthlyIncome': 'monthly_income',
            'monthlyBudget': 'monthly_budget',
            'dailyBudget': 'daily_budget'
        }
        for camel, snake in mapping.items():
            if camel in data:
                data[snake] = data.pop(camel)

        serializer = UserProfileSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analytics(request):
    user = request.user
    date_range = request.query_params.get('range', '6M')

    # 1. Category Breakdown
    breakdown = Transaction.objects.filter(user=user, type='expense') \
        .values('category') \
        .annotate(value=Sum('amount')) \
        .order_by('-value')

    # 2. Trend Analysis
    ranges = {'1D': TruncHour, '1W': TruncDay, '1M': TruncDay}
    trunc_func = ranges.get(date_range, TruncMonth)

    trends = Transaction.objects.filter(user=user) \
        .annotate(period=trunc_func('date')) \
        .values('period', 'type') \
        .annotate(total=Sum('amount')) \
        .order_by('period')

    chart_data = {}
    for entry in trends:
        # Formatting name based on range
        if date_range == '6M' or date_range == '1Y':
            label = entry['period'].strftime('%b %y') # e.g., "Jan 25"
        else:
            label = entry['period'].strftime('%d %b') # e.g., "15 Feb"
            
        key = entry['period'].strftime('%Y-%m-%d')
        if key not in chart_data:
            chart_data[key] = {"name": label, "income": 0, "expense": 0}

    return Response({
        "pieData": breakdown,
        "barData": sorted(chart_data.values(), key=lambda x: x['name']),
        "totalSpend": sum(item['value'] for item in breakdown)
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tax_risk_report(request):
    """
    Analyzes transaction confidence and amounts to assess tax audit risk.
    """
    user = request.user
    
    stats = Transaction.objects.filter(user=user).aggregate(
        total_count=Count('id'),
        unverified_count=Count('id', filter=Q(confidence=0)),
        unverified_volume=Sum('amount', filter=Q(confidence=0)),
        high_risk_count=Count('id', filter=Q(confidence=0, amount__gt=50000))
    )

    total = stats['total_count'] or 1
    risk_percent = (stats['unverified_count'] / total) * 100
    
    # Risk Level Logic
    if risk_percent > 50 or stats['high_risk_count'] > 0:
        risk_level = "High"
    elif risk_percent > 20:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return Response({
        "risk_score": round(risk_percent, 2),
        "risk_level": risk_level,
        "summary": {
            "unverified_transactions": stats['unverified_count'],
            "total_unverified_amount": float(stats['unverified_volume'] or 0),
            "high_value_warnings": stats['high_risk_count']
        },
        "recommendation": "High risk detected. Ensure you have physical receipts for manual entries." if risk_level == "High" else "Your audit trail looks healthy."
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_audit_summary(request):
    """
    Summarizes income heads and data integrity for tax filing preparation.
    """
    user = request.user
    
    # 1. Gather Income Heads
    income_stats = Transaction.objects.filter(user=user, type='income').aggregate(
        salary=Sum('amount', filter=Q(category='salary')),
        business=Sum('amount', filter=Q(category='business')),
        other=Sum('amount', filter=Q(category__in=['interest', 'gifts']))
    )

    # 2. Integrity Calculation
    total_tx = Transaction.objects.filter(user=user).count()
    verified_tx = Transaction.objects.filter(user=user, confidence__gt=0).count()
    integrity_score = (verified_tx / total_tx * 100) if total_tx > 0 else 100

    # 3. Profile Data (Safely handle if profile doesn't exist)
    profile = getattr(user, 'profile', None)
    deductions = {
        "rent": getattr(profile, 'annual_rent', 0),
        "epf": getattr(profile, 'annual_epf', 0),
        "is_business": getattr(profile, 'is_business', False)
    }

    return Response({
        "heads": income_stats,
        "integrity": {
            "score": round(integrity_score, 2),
            "total": total_tx,
            "verified": verified_tx
        },
        "profile_deductions": deductions
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_transactions_csv(request):
    """
    Generates a CSV file of all transactions for the user.
    Note: If this is inside a ViewSet, use @action. If standalone, use @api_view.
    """
    user = request.user
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="Spendsy_Report_{user.username}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Date', 'Description', 'Category', 'Type', 'Amount', 'Confidence (OCR)'])

    transactions = Transaction.objects.filter(user=user).order_by('-date')
    
    for tx in transactions:
        writer.writerow([tx.date, tx.description, tx.category, tx.type, tx.amount, tx.confidence])

    return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_ai_watchdog(request):
    """
    Triggers the AI Watchdog service to scan for anomalies.
    """
    # Assuming WatchdogService is imported and has a run_scan method
    insights = WatchdogService.run_scan(request.user)
    return Response(insights)

