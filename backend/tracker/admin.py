from django.contrib import admin
# from .models import Transaction, Task, Habit, HabitLog, Category, Account,TaskCategory  
from .models import (
    Transaction, Task, Habit, HabitLog, 
    Category, Account, TaskCategory, Goal, Step,TimeLog, DailyLog, DoingCategory
)

class StepInline(admin.TabularInline):
    model = Step
    extra = 1 # تعداد ردیف‌های خالی برای اضافه کردن سریع

class TaskInline(admin.TabularInline):
    model = Task
    extra = 1
    fields = ('title', 'energy_level', 'is_done')

# --- مدیریت مدل‌های مربوط به مالی و عادت‌ها ---

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'cat_type', 'icon', 'user')
    list_filter = ('cat_type',)

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('title', 'user')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('amount', 'category', 'account', 'transaction_type', 'date', 'user') 
    list_filter = ('transaction_type', 'date', 'category', 'account')
    search_fields = ('description', 'amount')
    date_hierarchy = 'date'

@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'user')

@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ('habit', 'date', 'is_completed')
    list_filter = ('date', 'is_completed')
    
# --- مدیریت مدل‌های جدید مدیریت وظایف (روانشناسانه) ---

@admin.register(TaskCategory)
class TaskCategoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'color', 'user')
    
@admin.register(DoingCategory)
class DoingCategoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'color', 'user')

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_done', 'total_duration', 'user')
    list_filter = ('is_done', 'category')
    inlines = [TaskInline] # نمایش تسک‌ها داخل صفحه هدف

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    # اینجا category را حذف و goal را جایگزین کردیم تا خطا رفع شود
    list_display = ('title', 'get_goal_title', 'energy_level', 'is_frog_today', 'is_done', 'is_blocked', 'user')
    list_editable = ('is_done', 'is_frog_today', 'energy_level')
    list_filter = ('is_done', 'is_frog_today', 'energy_level', 'goal')
    search_fields = ('title',)
    inlines = [StepInline] # نمایش قدم‌ها داخل صفحه تسک

    # متد کمکی برای نمایش نام هدف در لیست ادمین
    def get_goal_title(self, obj):
        return obj.goal.title if obj.goal else "--- کار مستقل ---"
    get_goal_title.short_description = 'هدف والد'

@admin.register(Step)
class StepAdmin(admin.ModelAdmin):
    list_display = ('title', 'task', 'is_done', 'duration_minutes')
    list_filter = ('is_done',)
    
    
@admin.register(TimeLog)
class TimeLogAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'duration_minutes', 'date', 'user')
    list_filter = ('date', 'category')
    search_fields = ('title',)
    date_hierarchy = 'date'