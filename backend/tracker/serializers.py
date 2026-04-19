from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Transaction, Task, Habit, HabitLog, DailyLog, DoingCategory
from .models import Transaction, Category, Account, TaskCategory, Goal, Task, Step, TimeLog


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['user']

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'
        read_only_fields = ['user']

class TransactionSerializer(serializers.ModelSerializer):
    # این فیلدها برای نمایش (Read) هستند تا جزئیات کامل را ببینیم
    category_details = CategorySerializer(source='category', read_only=True)
    account_details = AccountSerializer(source='account', read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['user']

class TaskCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskCategory
        fields = ['id', 'title', 'color']
        
class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = ['id', 'task', 'title', 'is_done', 'created_at', 'completed_at', 'duration_minutes']
        read_only_fields = ['created_at', 'completed_at']


class TaskSerializer(serializers.ModelSerializer):
    # این فیلد وضعیت بلاک بودن تسک را فقط برای خواندن به فرانت می‌فرستد
    is_blocked = serializers.ReadOnlyField()
    
    # برای اینکه وقتی یک تسک را می‌خوانیم، قدم‌هایش هم داخلش باشد (فقط خواندنی)
    steps = StepSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'goal', 'title', 'depends_on', 'energy_level','category', 
            'is_frog_today', 'is_done', 'is_blocked', 'created_at', 
            'completed_at', 'due_date', 'steps','duration_minutes','total_duration'
        ]
        read_only_fields = ['created_at', 'completed_at']


class GoalSerializer(serializers.ModelSerializer):
    # ارسال جمع دقایق انجام شده به فرانت‌اند
    total_duration = serializers.ReadOnlyField()
    
    # نمایش تسک‌های زیرمجموعه (اختیاری - اگر می‌خواهید کل درخت یکجا لود شود)
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Goal
        fields = [
            'id', 'title', 'category', 'is_done', 'created_at', 
            'completed_at', 'total_duration', 'tasks'
        ]
        read_only_fields = ['created_at', 'completed_at']


        
class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = ['date', 'is_completed']

class HabitSerializer(serializers.ModelSerializer):
    is_completed_today = serializers.SerializerMethodField()
    recent_logs = serializers.SerializerMethodField() # 🔴 اضافه شدن فیلد تاریخچه برای ماتریس فرانت‌اند
    longest_streak = serializers.SerializerMethodField()
    class Meta:
        model = Habit
        fields = '__all__'
        read_only_fields = ['user']

    def get_is_completed_today(self, obj):
        today = timezone.localdate()
        log = obj.logs.filter(date=today).first()
        return log.is_completed if log else False

    def get_recent_logs(self, obj):
        # 🔴 گرفتن لاگ‌های 30 روز گذشته برای رسم گراف در فرانت‌اند
        thirty_days_ago = timezone.localdate() - timedelta(days=30)
        logs = obj.logs.filter(date__gte=thirty_days_ago).order_by('date')
        return HabitLogSerializer(logs, many=True).data
    def get_longest_streak(self, obj):
        logs = obj.logs.filter(is_completed=True).order_by('date')
        if not logs.exists():
            return 0
        
        longest = 1
        current = 1
        for i in range(1, len(logs)):
            # اگر اختلاف تاریخ دقیقاً یک روز بود، استریک ادامه دارد
            if (logs[i].date - logs[i-1].date).days == 1:
                current += 1
                longest = max(longest, current)
            else:
                current = 1
        return longest
    
    
class DailyLogSerializer(serializers.ModelSerializer):
    mood_display = serializers.CharField(source='get_mood_display', read_only=True)

    class Meta:
        model = DailyLog
        # fields = [
        #     'id', 'date', 'pages_read', 'sleep_hours', 
        #     'performance_score', 'mood', 'mood_display', 
        #     'favorite_song', 'current_book'
        # ]
        fields = '__all__'
        # فیلد user را مستقیما از ریکوئست می‌گیریم تا کاربر نتواند برای دیگران لاگ ثبت کند
        read_only_fields = ['id', 'mood_display','user']
        
        
class DoingCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoingCategory
        fields = ['id', 'title', 'color']
        


class TimeLogSerializer(serializers.ModelSerializer):
    # این خط باعث می‌شود اطلاعات کامل دسته‌بندی برای فرانت ارسال شود (حل مشکل بدون دسته‌بندی)
    category_details = DoingCategorySerializer(source='category', read_only=True)
    
    # این فیلد برای دریافت ID دسته‌بندی هنگام ثبت فعالیت است
    category = serializers.PrimaryKeyRelatedField(
        queryset=DoingCategory.objects.all(), 
        allow_null=True, 
        required=False
    )

    class Meta:
        model = TimeLog
        fields = ['id', 'title', 'date', 'start_time', 'end_time', 'duration_minutes', 'category', 'category_details']