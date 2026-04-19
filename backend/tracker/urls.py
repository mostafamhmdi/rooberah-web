from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransactionViewSet, CategoryViewSet, AccountViewSet, 
    TaskViewSet, HabitViewSet, TaskCategoryViewSet, 
    GoalViewSet, StepViewSet,DailyLogViewSet, TimeLogViewSet,
    DoingCategoryViewSet
)

router = DefaultRouter()

# بخش مالی
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'task-categories', TaskCategoryViewSet, basename='task-category')
router.register(r'doing-categories', DoingCategoryViewSet, basename='doing-category')
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'steps', StepViewSet, basename='step')
router.register(r'daily-logs', DailyLogViewSet, basename='daily-log')
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'time-logs', TimeLogViewSet, basename='time-log')

urlpatterns = [
    path('', include(router.urls)),
]
