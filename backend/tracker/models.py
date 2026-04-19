from django.db import models
from django.contrib import admin
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date, datetime, timedelta
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Sum

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


class TaskCategory(models.Model):
    COLOR_CHOICES = [
        ('purple', 'بنفش'),
        ('blue', 'آبی'),
        ('green', 'سبز'),
        ('yellow', 'زرد'),
        ('orange', 'نارنجی'),
        ('red', 'قرمز'),
        ('gray', 'خاکستری'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_categories')
    title = models.CharField(max_length=50, verbose_name="عنوان")
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='gray', verbose_name="رنگ")
    
    def __str__(self):
        return self.title


class Goal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=255, verbose_name="خروجی مطلوب / هدف")
    category = models.ForeignKey(TaskCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='goals')
    
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان تکمیل")
    due_date = models.DateTimeField(null=True, blank=True)
    def save(self, *args, **kwargs):
        # ثبت خودکار زمان تکمیل برای Ta-Da List
        if self.is_done and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_done:
            self.completed_at = None
        super().save(*args, **kwargs)

    @property
    def total_duration(self):
        """
        محاسبه کل زمان صرف شده برای این هدف (بر حسب دقیقه)
        شامل: زمان‌های ثبت شده روی تسک‌ها + زمان‌های ثبت شده روی قدم‌ها (Steps)
        """
        # ۱. جمع زمان‌های وارد شده مستقیماً روی تسک‌های این هدف
        tasks_time = self.tasks.aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        # ۲. جمع زمان‌های وارد شده روی قدم‌های متعلق به تسک‌های این هدف
        steps_time = Step.objects.filter(task__goal=self).aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        return tasks_time + steps_time


    def __str__(self):
        return self.title


# 2. سطح دوم: وظیفه اصلی (Task) - حفظ نام قبلی
class Task(models.Model):
    ENERGY_CHOICES = [
        ('high', 'انرژی بالا'),
        ('medium', 'انرژی متوسط'),
        ('low', 'انرژی پایین'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    
    # حالت Orphan (بدون والد): اگر null باشد یعنی تسک مستقل است (مثل خرید شیر)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, null=True, blank=True, related_name='tasks', verbose_name="هدف والد")
    
    title = models.CharField(max_length=255, verbose_name="وظیفه")
    
    # وابستگی خطی (Sequential Dependency): تسک A باید قبل از این تسک انجام شود
    depends_on = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='blocks', verbose_name="وابسته به")
    
    # برچسب انرژی
    energy_level = models.CharField(max_length=10, choices=ENERGY_CHOICES, default='medium', verbose_name="سطح انرژی")
    
    # قورباغه روز (Eat the Frog)
    is_frog_today = models.BooleanField(default=False, verbose_name="قورباغه امروز")
    
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان تکمیل") # برای Ta-Da List
    due_date = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0, verbose_name="مدت زمان وارد شده تسک (دقیقه)")
    category = models.ForeignKey(TaskCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    def save(self, *args, **kwargs):
        if self.is_done and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_done:
            self.completed_at = None
        super().save(*args, **kwargs)


    @property
    def total_duration(self):
        """
        محاسبه کل زمان صرف شده برای این تسک (بر حسب دقیقه)
        شامل: زمان وارد شده برای خود تسک + جمع زمان‌های قدم‌های (Steps) آن
        """
        # جمع زمان‌های وارد شده برای قدم‌های این تسک
        steps_time = self.steps.aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        # زمان کل = زمان خود تسک + زمان قدم‌هایش
        return self.duration_minutes + steps_time
    
    @property
    def is_blocked(self):
        # آیا این تسک توسط تسک دیگری مسدود شده است؟ (برای نمایش ندادن در لیست)
        if self.depends_on and not self.depends_on.is_done:
            return True
        return False

    def __str__(self):
        return self.title


# 3. سطح سوم: اولین قدم فیزیکی (Step)
class Step(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='steps')
    title = models.CharField(max_length=255, verbose_name="قدم کوچک")
    
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # مدت زمانی که این قدم طول کشیده (به دقیقه)
    duration_minutes = models.PositiveIntegerField(default=0, verbose_name="مدت زمان (دقیقه)")

    def save(self, *args, **kwargs):
        if self.is_done and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_done:
            self.completed_at = None
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
    


class Habit(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class HabitLog(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField(default=timezone.localdate)
    is_completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('habit', 'date')
    

class DailyLog(models.Model):
    MOOD_CHOICES = [
        ('excellent', 'عالی 🤩'),
        ('good', 'خوب 😀'),
        ('normal', 'معمولی 😐'),
        ('bad', 'بد 😞'),
        ('awful', 'خیلی بد 😭'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_logs')
    date = models.DateField(default=timezone.now, verbose_name="تاریخ ثبت")
    
    # فیلدهای مربوط به فرم
    pages_read = models.PositiveIntegerField(default=0, verbose_name="تعداد صفحات کتاب")
    sleep_hours = models.FloatField(default=0.0, verbose_name="ساعت خواب")
    sport_hours = models.FloatField(default=0.0, verbose_name="ساعت ورزش")
    performance_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=50,
        verbose_name="امتیاز عملکرد (۰ تا ۱۰۰)"
    )
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES, default='good', verbose_name="حس و حال")
    favorite_song = models.CharField(max_length=255, blank=True, null=True, verbose_name="آهنگ مورد علاقه امروز")
    current_book = models.CharField(max_length=255, blank=True, null=True, verbose_name="کتابی که می‌خوانی")

    class Meta:
        # جلوگیری از ثبت دو گزارش برای یک روز توسط یک کاربر
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"گزارش {self.user.username} در تاریخ {self.date}"

admin.site.register(DailyLog)


class DoingCategory(models.Model):
    COLOR_CHOICES = [
    ('red', 'قرمز'),
    ('orange', 'نارنجی'),
    ('amber', 'کهربایی'),
    ('yellow', 'زرد'),
    ('lime', 'لیمویی'),
    ('green', 'سبز'),
    ('emerald', 'زمردی'),
    ('teal', 'کله‌غازی'),
    ('cyan', 'فیروزه‌ای'),
    ('blue', 'آبی'),
    ('indigo', 'نیلی'),
    ('purple', 'بنفش'),
    ('pink', 'صورتی'),
    ('rose', 'رز'),
    ('gray', 'خاکستری'),
]

    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doing_categories')
    title = models.CharField(max_length=50, verbose_name="عنوان")
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='gray', verbose_name="رنگ")
    
    def __str__(self):
        return self.title


class TimeLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    
    # استفاده از timezone.now برای حل خطای NameError: name 'date' is not defined
    date = models.DateField(default=timezone.now) 
    
    # اضافه کردن default='00:00' برای حل خطای اضافه کردن فیلد به دیتابیس
    start_time = models.TimeField(default='00:00')
    end_time = models.TimeField(default='00:00')
    
    duration_minutes = models.PositiveIntegerField(blank=True, null=True)
    category = models.ForeignKey('DoingCategory', on_delete=models.SET_NULL, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.start_time and self.end_time:
            # تبدیل به datetime برای محاسبه اختلاف
            start = datetime.combine(self.date, self.start_time)
            end = datetime.combine(self.date, self.end_time)
            
            if end < start:
                end += timedelta(days=1)
                
            diff = end - start
            self.duration_minutes = int(diff.total_seconds() / 60)
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.date}"
    
    
import pandas as pd
import os
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings

# مسیر ذخیره سازی: پوشه 'backups' در کنار فایل manage.py
EXPORT_PATH = os.path.join(settings.BASE_DIR, 'my_life_backup.xlsx')

def export_all_to_excel():
    """ استخراج تمام جداول دیتابیس در یک فایل اکسل با شیت‌های مجزا """
    try:
        # ایجاد یک Excel Writer
        with pd.ExcelWriter(EXPORT_PATH, engine='openpyxl') as writer:
            
            # ۱. لیست مدل‌هایی که می‌خواهیم خروجی بگیریم
            models_to_export = [
                (Category, 'Categories'),
                (Account, 'Accounts'),
                (Transaction, 'Transactions'),
                (TaskCategory, 'TaskCategories'), # اضافه شد
                (Goal, 'Goals'),                  # اضافه شد
                (Task, 'Tasks'),
                (Step, 'Steps'),                  # اضافه شد
                (Habit, 'Habits'),
                (HabitLog, 'HabitLogs'),
                (DailyLog, 'DailyLogs'),
                (TimeLog, 'TimeLogs'),
            ]

            for model, sheet_name in models_to_export:
                data = list(model.objects.all().values())
                if data:
                    df = pd.DataFrame(data)
                    
                    # حذف اطلاعات منطقه زمانی (Timezone) برای سازگاری با اکسل
                    for col in df.columns:
                        if df[col].dtype == 'datetime64[ns, UTC]' or hasattr(df[col], 'dt'):
                            try:
                                df[col] = pd.to_datetime(df[col]).dt.tz_localize(None)
                            except:
                                pass
                    
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
                else:
                    # اگر دیتایی نبود یک شیت خالی بساز
                    pd.DataFrame().to_excel(writer, sheet_name=sheet_name)
        
        print(f"✅ Database exported successfully to: {EXPORT_PATH}")
    except Exception as e:
        print(f"❌ Error exporting to excel: {e}")
# ۳. تعریف سیگنال برای تمام مدل‌ها
# این تابع باعث می‌شود هر تغییری در هر جدولی، فایل اکسل را بروز کند
@receiver(post_save, sender=Category)
@receiver(post_save, sender=Account)
@receiver(post_save, sender=Transaction)
@receiver(post_save, sender=TaskCategory)
@receiver(post_save, sender=Goal)
@receiver(post_save, sender=Task)
@receiver(post_save, sender=Step)
@receiver(post_save, sender=Habit)
@receiver(post_save, sender=HabitLog)
@receiver(post_save, sender=DailyLog)
@receiver(post_save, sender=TimeLog)
@receiver(post_delete, sender=Category)
@receiver(post_delete, sender=Account)
@receiver(post_delete, sender=Transaction)
@receiver(post_delete, sender=TaskCategory)
@receiver(post_delete, sender=Goal)
@receiver(post_delete, sender=Task)
@receiver(post_delete, sender=Step)
@receiver(post_delete, sender=Habit)
@receiver(post_delete, sender=HabitLog)
@receiver(post_delete, sender=DailyLog)
@receiver(post_delete, sender=TimeLog)
def auto_export_signal(sender, instance, **kwargs):
    export_all_to_excel()
