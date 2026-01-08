from rest_framework import viewsets
from django.contrib.auth.models import User # این خط را حتما اضافه کن
from .models import Transaction, DailyLog, Task, Habit, HabitLog
from .serializers import (
    TransactionSerializer, DailyLogSerializer, 
    TaskSerializer, HabitSerializer, HabitLogSerializer
)
from .models import Transaction, Category, Account
from .serializers import TransactionSerializer, CategorySerializer, AccountSerializer

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

# ... (بقیه کلاس‌ها دست نخورند)
class DailyLogViewSet(viewsets.ModelViewSet):
    queryset = DailyLog.objects.all().order_by('-date')
    serializer_class = DailyLogSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer

class HabitViewSet(viewsets.ModelViewSet):
    queryset = Habit.objects.all()
    serializer_class = HabitSerializer

class HabitLogViewSet(viewsets.ModelViewSet):
    queryset = HabitLog.objects.all()
    serializer_class = HabitLogSerializer