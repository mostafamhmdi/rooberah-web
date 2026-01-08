from django.contrib import admin
from .models import Transaction, DailyLog, Task, Habit, HabitLog, Category, Account

# 1. مدیریت دسته‌بندی‌ها (جدید)
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'cat_type', 'icon', 'user')
    list_filter = ('cat_type',)

# 2. مدیریت حساب‌ها (جدید)
@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('title', 'user')

# 3. مدیریت تراکنش‌ها (آپدیت شده)
@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    # فیلد 'card' به 'account' تغییر کرد
    list_display = ('amount', 'category', 'account', 'transaction_type', 'date', 'user') 
    list_filter = ('transaction_type', 'date', 'category', 'account')
    search_fields = ('description', 'amount')
    date_hierarchy = 'date'

# بقیه مدل‌ها بدون تغییر
@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ('date', 'sleep_hours', 'mood', 'performance_score', 'user')
    list_filter = ('mood',)
    ordering = ('-date',)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_done', 'due_date', 'user')
    list_editable = ('is_done',)
    list_filter = ('is_done', 'category')

@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'user')

@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ('habit', 'date', 'is_completed')
    list_filter = ('date', 'is_completed')