from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# 1. مدل برای ثبت خرج و مخارج (تصویر سوم)
class Transaction(models.Model):
    CATEGORY_CHOICES = [
        ('food', 'خوراک'),
        ('transport', 'حمل و نقل'),
        ('shopping', 'خرید'),

        ('other', 'سایر'),
    ]
    
    CARD_CHOICES = [
        ('mellat', 'کارت ملت'),
        ('melli', 'کارت رفاه'),
        ('cash', 'نقد'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE) # برای اینکه بدونی مال کیه
    amount = models.BigIntegerField(verbose_name="مبلغ (تومان)")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    description = models.CharField(max_length=255, blank=True, verbose_name="شرح")
    card = models.CharField(max_length=20, choices=CARD_CHOICES, default='mellat')
    date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.amount} - {self.category}"

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
        ('work', 'کوئرا'),
        ('learning', 'یادگیری'),
        ('learning', 'کار'),
        
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