from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# 1. مدل دسته‌بندی (کاملاً داینامیک)
class Category(models.Model):
    TYPE_CHOICES = [
        ('expense', 'هزینه'),
        ('income', 'درآمد'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=50, verbose_name="عنوان")
    cat_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='expense')
    icon = models.CharField(max_length=10, default='⚪', verbose_name="آیکون (ایموجی)")

    def __str__(self):
        return f"{self.icon} {self.title} ({self.get_cat_type_display()})"

# 2. مدل حساب‌ها (کارت‌ها)
class Account(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=50, verbose_name="نام حساب")
    # balance = models.BigIntegerField(default=0) # بعداً می‌توانیم موجودی اولیه هم بگذاریم

    def __str__(self):
        return self.title

# 3. مدل تراکنش (آپدیت شده)
class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=10, choices=Category.TYPE_CHOICES, default='expense')
    
    # ارتباط با جداول جدید (به جای متن ساده)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, verbose_name="دسته‌بندی")
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, verbose_name="حساب/کارت")
    
    amount = models.BigIntegerField(verbose_name="مبلغ (تومان)")
    description = models.CharField(max_length=255, blank=True, verbose_name="شرح")
    date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.amount} - {self.description}"

# 2. مدل گزارش روزانه (تصویر دوم)
class DailyLog(models.Model):
    MOOD_CHOICES = [
        ('awful', 'افتضاح'),
        ('bad', 'بد'),
        ('neutral', 'معمولی'),
        ('good', 'خوب'),
        ('excellent', 'عالی'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now, unique=True) # هر روز فقط یک گزارش
    
    # داده‌های ورودی
    pages_read = models.IntegerField(default=0, verbose_name="تعداد صفحات کتاب")
    sleep_hours = models.FloatField(default=0, verbose_name="ساعت خواب")
    performance_score = models.IntegerField(default=50, verbose_name="امتیاز عملکرد (0-100)")
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES, default='neutral')
    
    # داده‌های متنی
    song_of_day = models.CharField(max_length=100, blank=True, verbose_name="آهنگ امروز")
    current_book = models.CharField(max_length=100, blank=True, verbose_name="کتاب در حال مطالعه")
    
    note = models.TextField(blank=True, verbose_name="یادداشت روزانه")

    def __str__(self):
        return f"گزارش {self.date}"

# 3. مدل تسک‌ها (تصویر اول)
class Task(models.Model):
    CATEGORY_CHOICES = [
        ('personal', 'شخصی'),
        ('university', 'دانشگاه'),
        ('quera', 'کوئرا'),
        ('learning', 'یادگیری'),
        ('work', 'کار'),
        
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

# 4. مدل عادت‌ها (تصویر چهارم)
# این مدل تعریف عادت است (مثلا: "کتاب خواندن")
class Habit(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

# این مدل تیک زدن عادت در یک روز خاص است
class HabitLog(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    is_completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('habit', 'date') 