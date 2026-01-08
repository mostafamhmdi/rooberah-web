from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, CategoryViewSet, AccountViewSet, DailyLogViewSet, TaskViewSet, HabitViewSet, HabitLogViewSet

# روتر به صورت خودکار URLها را می‌سازد
router = DefaultRouter()
router.register(r'transactions', TransactionViewSet)
router.register(r'categories', CategoryViewSet) # جدید
router.register(r'accounts', AccountViewSet)  
router.register(r'daily-logs', DailyLogViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'habits', HabitViewSet)
router.register(r'habit-logs', HabitLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
