from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Transaction, Task, Habit, HabitLog, DailyLog, Goal, Task, Step
from .serializers import (
    TransactionSerializer, 
    TaskSerializer, HabitSerializer, DailyLogSerializer
)
from .models import Transaction, Category, Account,TaskCategory,TimeLog, DoingCategory
from .serializers import TransactionSerializer, CategorySerializer, AccountSerializer, TaskCategorySerializer,GoalSerializer, TaskSerializer, StepSerializer, TimeLogSerializer, DoingCategorySerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils.dateparse import parse_date




class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    
    def perform_create(self, serializer):
        user = User.objects.first()
        serializer.save(user=user)

class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer

    def perform_create(self, serializer):
        user = User.objects.first()
        serializer.save(user=user)

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by('-date')
    serializer_class = TransactionSerializer

    def perform_create(self, serializer):
        user = User.objects.first()
        serializer.save(user=user)


class TaskCategoryViewSet(viewsets.ModelViewSet):
    queryset = TaskCategory.objects.all()
    serializer_class = TaskCategorySerializer

    def perform_create(self, serializer):
        user = User.objects.first()
        serializer.save(user=user)


class GoalViewSet(viewsets.ModelViewSet):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer

    def perform_create(self, serializer):
        user = User.objects.first()
        serializer.save(user=user)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def perform_create(self, serializer):
        user = User.objects.first()
        serializer.save(user=user)

    # -------------------------------------------------------------
    # اکشن‌های سفارشی برای پیاده‌سازی فیچرهای روانشناسانه
    # -------------------------------------------------------------

    @action(detail=False, methods=['get'])
    def actionable(self, request):
        """
        تسک‌های قابل اقدام: تسک‌هایی که انجام نشده‌اند و بلاک هم نیستند.
        این برای کاهش بار شناختی (Cognitive Load) است.
        """
        # تسک‌هایی که وابسته به چیزی نیستند یا والدشان انجام شده است
        tasks = Task.objects.filter(is_done=False).exclude(
            depends_on__isnull=False, depends_on__is_done=False
        )
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def frogs(self, request):
        """
        قورباغه‌ها: دریافت تسک‌هایی که کاربر برای امروز به عنوان قورباغه مشخص کرده و هنوز انجام نداده
        """
        frogs = Task.objects.filter(is_frog_today=True, is_done=False)
        serializer = self.get_serializer(frogs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def tada_list(self, request):
        """
        لیست Ta-Da (ضد تو-دو): کارهایی که دقیقا امروز تکمیل شده‌اند.
        """
        today = timezone.now().date()
        # فیلتر کردن تسک‌هایی که تاریخ تکمیل آن‌ها امروز است
        tada_tasks = Task.objects.filter(
            is_done=True, 
            completed_at__date=today
        )
        serializer = self.get_serializer(tada_tasks, many=True)
        return Response(serializer.data)


class StepViewSet(viewsets.ModelViewSet):
    queryset = Step.objects.all()
    serializer_class = StepSerializer



class HabitViewSet(viewsets.ModelViewSet):
    queryset = Habit.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = HabitSerializer

    def perform_create(self, serializer):
        user = User.objects.first()
        serializer.save(user=user)

    @action(detail=True, methods=['post'])
    def toggle_today(self, request, pk=None):
        habit = self.get_object()
        today = timezone.localdate()
        
        log, created = HabitLog.objects.get_or_create(
            habit=habit,
            date=today,
            defaults={'is_completed': True}
        )
        
        if not created:
            log.is_completed = not log.is_completed
            log.save()
            
        return Response({
            'status': 'success', 
            'is_completed_today': log.is_completed
        })
    @action(detail=True, methods=['post'])
    def toggle_date(self, request, pk=None):
        habit = self.get_object()
        date_str = request.data.get('date')
        
        if not date_str:
            return Response({'error': 'Date is required'}, status=400)
            
        # تبدیل رشته تاریخ به آبجکت تاریخ جنگو
        target_date = parse_date(date_str)
        
        if not target_date:
            return Response({'error': 'Invalid date format'}, status=400)
            
        log, created = HabitLog.objects.get_or_create(
            habit=habit,
            date=target_date,
            defaults={'is_completed': True}
        )
        
        if not created:
            log.is_completed = not log.is_completed
            log.save()
            
        return Response({
            'status': 'success', 
            'date': date_str, 
            'is_completed': log.is_completed
        })
        
    

class DailyLogViewSet(viewsets.ModelViewSet):
    serializer_class = DailyLogSerializer
    permission_classes = [AllowAny]

    # def get_queryset(self):
    #     # کاربر فقط لاگ‌های خودش را ببیند
    #     return DailyLog.objects.filter(user=self.request.user).order_by('-date')
    def get_queryset(self):
        # 🔴 خطای شما از اینجا بود. کد قبلی را پاک کنید و خط زیر را جایگزین کنید:
        # تمام لاگ‌ها را به ترتیب تاریخ (جدیدترین به قدیمی‌ترین) برمی‌گرداند
        return DailyLog.objects.all().order_by('date')

    def perform_create(self, serializer):
        # اختصاص خودکار کاربر جاری به لاگ روزانه هنگام ذخیره (بسیار مهم)
        default_user = User.objects.first() 
        serializer.save(user=default_user)


class DoingCategoryViewSet(viewsets.ModelViewSet):
    queryset = DoingCategory.objects.all()
    serializer_class = DoingCategorySerializer

    def perform_create(self, serializer):
        user = User.objects.first()
        serializer.save(user=user)

class TimeLogViewSet(viewsets.ModelViewSet):
    serializer_class = TimeLogSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # هر کاربر فقط لاگ‌های زمانی خودش را می‌بیند
        return TimeLog.objects.all().order_by('date')

    def perform_create(self, serializer):
        # هنگام ساخت لاگ جدید، کاربر لاگین‌شده به صورت خودکار ثبت می‌شود
        default_user = User.objects.first() 
        serializer.save(user=default_user)