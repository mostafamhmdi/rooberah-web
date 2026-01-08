from django.contrib import admin
from .models import Transaction, DailyLog, Task, Habit, HabitLog

# تنظیمات نمایش تراکنش‌ها
@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('amount', 'category', 'card', 'date', 'user') # ستون‌هایی که در لیست می‌بینی
    list_filter = ('category', 'card', 'date') # فیلترهای سمت راست صفحه
    search_fields = ('description', 'amount') # باکس جستجو
    date_hierarchy = 'date' # نوار پیمایش تاریخ در بالای صفحه

# تنظیمات نمایش لاگ‌های روزانه
@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ('date', 'sleep_hours', 'mood', 'performance_score', 'user')
    list_filter = ('mood',)
    ordering = ('-date',) # مرتب‌سازی نزولی (جدیدترین اول)

# تنظیمات نمایش تسک‌ها
@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_done', 'due_date', 'user')
    list_editable = ('is_done',) # امکان تیک زدن مستقیم از توی لیست!
    list_filter = ('is_done', 'category')

# تنظیمات عادت‌ها
@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'user')

@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ('habit', 'date', 'is_completed')
    list_filter = ('date', 'is_completed')