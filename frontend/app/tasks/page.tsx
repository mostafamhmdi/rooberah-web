"use client";

import { Step, Task, Goal } from '@/types';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, CalendarClock, Trash2, Edit2, ChevronDown, Folder, Tag } from 'lucide-react';
import AddTaskModal from '@/components/AddTaskModal';

const API_BASE = 'http://127.0.0.1:8000/api';
const energyMap = { 'high': '⚡️', 'medium': '🔋', 'low': '🪫' };

// --- Helper Functions ---
const isOverdue = (dateString?: string) => {
  if (!dateString) return false;
  const now = new Date();
  const dueDate = new Date(dateString);
  return dueDate < now;
};

const formatJalali = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// ==========================================
// کامپوننت‌های فرزند
// ==========================================

const TaskItem = ({ 
  task, 
  showGoalName = false, 
  activeTab, 
  categories,
  onToggleTask, 
  onToggleStep,
  onAddStep,
  onDelete,
  onEdit
}: { 
  task: Task & { total_duration?: number, duration_minutes?: number }, 
  showGoalName?: boolean, 
  activeTab: string,
  categories: any[],
  onToggleTask: (id: number, current: boolean, time?: number) => void,
  onToggleStep: (id: number, current: boolean, time?: number) => void,
  onAddStep: (taskId: number, stepTitle: string) => void,
  onDelete: (type: 'task' | 'step', id: number) => void,
  onEdit: (type: 'task' | 'step', id: number, currentTitle: string) => void
}) => {
  const isLocked = task.is_blocked && activeTab !== 'tada';
  const [newStepTitle, setNewStepTitle] = useState('');
  const isLate = isOverdue(task.due_date) && !task.is_done;
  
  const categoryId = typeof task.category === 'object' ? task.category?.id : task.category;
  const taskCategory = categories.find(c => c.id === categoryId);

  // محاسبه مجموع زمان (تسک اصلی + قدم‌های آن)
  const getTotalTime = () => {
    if (task.total_duration !== undefined) return task.total_duration;
    
    // محاسبه پشتیبان (فرانت‌اند) در صورت نبود فیلد از سمت سرور
    let total = Number(task.duration_minutes) || 0;
    task.steps?.forEach(step => {
      if (step.is_done) total += (Number(step.duration_minutes) || 0);
    });
    return total;
  };

  const totalSpentTime = getTotalTime();
  const directTaskTime = Number(task.duration_minutes) || 0;

  const handleTaskClick = () => {
    if (isLocked) return;
    if (!task.is_done) {
      const time = window.prompt('⏳ انجام این کار چقدر زمان برد؟ (به دقیقه)', '30');
      if (time !== null) onToggleTask(task.id, task.is_done, parseInt(time) || 0);
    } else {
      onToggleTask(task.id, task.is_done, 0);
    }
  };

  const handleStepToggle = (step: Step) => {
    if (!step.is_done) {
      const time = window.prompt(`⏳ قدم "${step.title}" چقدر زمان برد؟ (دقیقه)`, '15');
      if (time !== null) onToggleStep(step.id, step.is_done, parseInt(time) || 0);
    } else {
      onToggleStep(step.id, step.is_done, 0);
    }
  };

  const submitNewStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;
    onAddStep(task.id, newStepTitle);
    setNewStepTitle('');
  };

  return (
    <div className={`p-4 bg-white border rounded-xl shadow-sm transition-all group relative overflow-hidden
      ${isLocked ? 'border-gray-200 bg-gray-50 opacity-60' : 'hover:shadow-md'}
      ${isLate && activeTab !== 'tada' ? 'border-red-300 bg-red-50/40 shadow-red-100/50' : 'border-gray-200'}
      ${activeTab === 'tada' ? 'border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-50 to-white' : ''}
    `}>
      {isLate && activeTab !== 'tada' && (
        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-red-500 rounded-r-xl animate-pulse"></div>
      )}

      <div className="flex items-start gap-3 flex-wrap pl-2">
        <button 
          onClick={handleTaskClick}
          disabled={isLocked}
          className={`mt-1 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md border-2 transition-all duration-200
            ${task.is_done ? 'bg-green-500 border-green-500 text-white scale-105' : 'border-gray-300 hover:border-blue-500'}
            ${isLate && !task.is_done ? 'border-red-400 bg-red-100/50 hover:bg-red-200 hover:border-red-500' : ''}
            ${isLocked ? 'cursor-not-allowed bg-gray-200 border-gray-300' : 'cursor-pointer'}
          `}
        >
          {task.is_done && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          {isLocked && <span className="text-xs">🔒</span>}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-base md:text-lg transition-colors
              ${task.is_done ? 'line-through text-gray-400' : isLate ? 'text-red-800' : 'text-gray-800'}`}>
              {task.title}
            </span>
            
            {/* نمایش زمانی که منحصراً برای خود تسک (غیر از قدم ها) صرف شده */}
            {activeTab === 'tada' && task.is_done && directTaskTime > 0 && (
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                زمان تسک: {directTaskTime} دقیقه
              </span>
            )}

            <div className="hidden group-hover:flex gap-1 mr-auto pl-2">
              <button onClick={() => onEdit('task', task.id, task.title)} className="text-gray-400 hover:text-blue-600 p-1 transition-colors"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => onDelete('task', task.id)} className="text-gray-400 hover:text-red-600 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.due_date && !task.is_done && (
              <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md border
                ${isLate ? 'bg-red-100 text-red-700 border-red-300 font-medium' : 'bg-gray-50 text-gray-500 border-gray-200'}
              `}>
                <CalendarClock className="w-3.5 h-3.5" />
                {isLate ? 'مهلت گذشته:' : 'تا:'} {formatJalali(task.due_date)}
              </span>
            )}
            
            {showGoalName && task.goal_title && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full truncate border border-indigo-100">
                🎯 {task.goal_title}
              </span>
            )}

            {!task.goal && taskCategory && (
              <span className="text-xs flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: taskCategory.color || '#9ca3af' }}></span>
                {taskCategory.title}
              </span>
            )}
          </div>
        </div>

        {/* نمایش مجموع زمان (تسک + قدم‌ها) */}
        {activeTab === 'tada' && totalSpentTime > 0 && (
          <div className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-green-200 shadow-sm flex items-center gap-1">
            ⏱ مجموع زمان: {totalSpentTime}
          </div>
        )}

        <div className="flex gap-2 text-lg items-center">
          {task.is_frog_today && !task.is_done && <span className="animate-bounce" title="قورباغه روز!">🐸</span>}
          <span className="bg-gray-50 px-1.5 rounded" title={`سطح انرژی: ${task.energy_level}`}>{energyMap[task.energy_level as keyof typeof energyMap]}</span>
        </div>
      </div>

      {!isLocked && (
        <div className="mt-4 ml-8 space-y-2 border-r-2 border-gray-100 pr-3 right-to-left-border">
          {task.steps?.map(step => (
            <div key={step.id} className="flex items-center gap-2 text-sm group/step">
              <input 
                type="checkbox" 
                checked={step.is_done} 
                onChange={() => handleStepToggle(step)}
                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer" 
              />
              <span className={`flex-1 transition-colors ${step.is_done ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                {step.title}
              </span>
              {step.is_done && (Number(step.duration_minutes) || 0) > 0 && activeTab === 'tada' && (
                <span className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                  زمان قدم: {step.duration_minutes} دقیقه
                </span>
              )}
              <div className="hidden group-hover/step:flex gap-1 mr-2 opacity-0 group-hover/step:opacity-100 transition-opacity">
                <button onClick={() => onEdit('step', step.id, step.title)} className="text-gray-400 hover:text-blue-600 p-0.5"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete('step', step.id)} className="text-gray-400 hover:text-red-600 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}

          <form onSubmit={submitNewStep} className="flex items-center gap-2 mt-3 opacity-60 hover:opacity-100 transition-opacity focus-within:opacity-100">
            <Plus className="w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              placeholder="افزودن قدم بعدی..."
              className="text-sm bg-transparent border-none focus:ring-0 outline-none w-full text-gray-700 placeholder-gray-400 py-1"
            />
            {newStepTitle && (
              <button type="submit" className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors">ثبت</button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

const GoalCard = ({ 
  goal, 
  activeTab, 
  categories,
  onToggleTask, 
  onToggleStep,
  onAddStep,
  onDelete,
  onEdit
}: { 
  goal: Goal & { total_duration?: number }, 
  activeTab: string, 
  categories: any[],
  onToggleTask: any, 
  onToggleStep: any,
  onAddStep: any,
  onDelete: any,
  onEdit: any
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalTasks = goal.tasks?.length || 0;
  const completedTasks = goal.tasks?.filter(t => t.is_done).length || 0;
  const progressPercent = totalTasks === 0 ? (goal.is_done ? 100 : 0) : Math.round((completedTasks / totalTasks) * 100);
  
  const isLate = isOverdue(goal.due_date) && progressPercent < 100;
  
  const categoryId = typeof goal.category === 'object' ? goal.category?.id : goal.category;
  const goalCategory = categories.find(c => c.id === categoryId);

  // محاسبه مجموع کل زمان هدف در صورتی که بک‌اند نفرستاده باشد
  const getGoalTotalTime = () => {
    if (goal.total_duration !== undefined) return goal.total_duration;
    let total = 0;
    goal.tasks?.forEach((t: any) => {
      if (t.is_done) total += (Number(t.duration_minutes) || 0);
      t.steps?.forEach((s: any) => {
        if (s.is_done) total += (Number(s.duration_minutes) || 0);
      });
    });
    return total;
  };

  const goalTotalTime = getGoalTotalTime();

  return (
    <div className={`bg-white rounded-2xl shadow-sm border mb-6 overflow-hidden group/goal relative
      transition-all duration-300
      ${isLate ? 'border-red-300 shadow-red-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}>
      
      <div className={`absolute right-0 top-0 bottom-0 w-2 transition-colors 
        ${progressPercent === 100 ? 'bg-green-500' : isLate ? 'bg-red-500' : 'bg-blue-500'}`}>
      </div>

      <div 
        className={`p-4 pl-6 pr-6 cursor-pointer flex justify-between items-center transition-colors
          ${isLate ? 'hover:bg-red-50/30 bg-red-50/10' : 'hover:bg-gray-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className={`text-lg md:text-xl font-bold transition-colors ${isLate ? 'text-red-800' : 'text-gray-800'}`}>
              🎯 {goal.title}
            </h3>
            
            <div className="flex gap-2 items-center">
              {goal.due_date && progressPercent < 100 && (
                <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border
                  ${isLate ? 'bg-red-100 text-red-700 border-red-300 font-semibold animate-pulse' : 'bg-gray-100 text-gray-500 border-gray-200'}
                `}>
                  <CalendarClock className="w-3.5 h-3.5" />
                  {isLate ? 'مهلت گذشته:' : 'تا:'} {formatJalali(goal.due_date)}
                </span>
              )}

              {goalCategory && (
                <span className="text-xs flex items-center gap-1.5 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: goalCategory.color || '#9ca3af' }}></span>
                  {goalCategory.title}
                </span>
              )}
            </div>

            {/* نمایش زمان کل هدف در تب Tada */}
            {activeTab === 'tada' && goalTotalTime > 0 && (
              <div className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-green-200 shadow-sm flex items-center gap-1">
                ⏱ مجموع کل هدف: {goalTotalTime} دقیقه
              </div>
            )}

            <div className="hidden group-hover/goal:flex gap-1 mr-auto ml-4" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onEdit('goal', goal.id, goal.title)} className="text-gray-400 hover:text-blue-600 p-1 transition-colors"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => onDelete('goal', goal.id)} className="text-gray-400 hover:text-red-600 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out
                  ${progressPercent === 100 ? 'bg-green-500' : isLate ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className={`text-xs font-bold ${progressPercent === 100 ? 'text-green-600' : isLate ? 'text-red-600' : 'text-gray-500'}`}>
              {progressPercent}%
            </span>
          </div>
        </div>

        <div className={`text-gray-400 bg-white shadow-sm border p-2 rounded-full transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180 bg-gray-50' : ''}`}>
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      <div 
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="p-4 md:p-5 bg-gray-50/80 border-t border-gray-100 space-y-3">
            {!goal.tasks || goal.tasks.length === 0 ? (
              <div className="text-center py-6 text-gray-400 flex flex-col items-center">
                <Folder className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">هیچ اقدامی برای این هدف ثبت نشده است.</p>
              </div>
            ) : (
              goal.tasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  activeTab={activeTab}
                  categories={categories}
                  onToggleTask={onToggleTask} 
                  onToggleStep={onToggleStep}
                  onAddStep={onAddStep}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// کامپوننت اصلی صفحه
// ==========================================

export default function TasksPage() {
  const router = useRouter(); 
  const [activeTab, setActiveTab] = useState<'all' | 'frogs' | 'tada'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [flatTasks, setFlatTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catsRes = await fetch(`${API_BASE}/task-categories/`);
      if (catsRes.ok) setCategories(await catsRes.json());

      if (activeTab === 'all') {
        const goalsRes = await fetch(`${API_BASE}/goals/`);
        const goalsData = await goalsRes.json();
        setGoals(goalsData);

        const orphanRes = await fetch(`${API_BASE}/tasks/?goal__isnull=True`);
        const orphanData = await orphanRes.json();
        setFlatTasks(orphanData.filter((t: Task) => t.goal === null || t.goal === undefined));
      } 
      else if (activeTab === 'frogs') {
        const res = await fetch(`${API_BASE}/tasks/frogs/`);
        if(res.ok) setFlatTasks(await res.json());
      }
      else if (activeTab === 'tada') {
        const [tasksRes, goalsRes] = await Promise.all([
          fetch(`${API_BASE}/tasks/tada_list/`),
          fetch(`${API_BASE}/goals/`).catch(() => null)
        ]);
        
        let tadaTasksData = [];
        if (tasksRes.ok) tadaTasksData = await tasksRes.json();
        
        if (goalsRes && goalsRes.ok) {
          const allGoals = await goalsRes.json();
          
          // ۱. استخراج اهداف تکمیل شده (رسیده به ۱۰۰٪)
          const completedGoals = allGoals.filter((g: any) => 
            g.is_done || (g.tasks && g.tasks.length > 0 && g.tasks.every((t: any) => t.is_done))
          );
          setGoals(completedGoals);
          
          // آیدی اهداف تکمیل شده برای جلوگیری از تکرار تسک‌ها
          const completedGoalIds = completedGoals.map((g: any) => g.id);

          // ۲. فیلتر کردن تسک‌های آزاد: 
          // فقط تسک‌هایی را نشان بده که یا هدف ندارند، یا هدفشان هنوز کامل نشده (در completedGoalIds نیست)
          const standaloneTadaTasks = tadaTasksData.filter((t: any) => {
             const tGoalId = typeof t.goal === 'object' ? t.goal?.id : t.goal;
             if (!tGoalId) return true; // اگر هدف ندارد، نشان بده
             return !completedGoalIds.includes(tGoalId); // اگر هدفش کامل نشده، نشان بده
          });
          
          setFlatTasks(standaloneTadaTasks);
        } else {
          setFlatTasks(tadaTasksData);
        }
      }
    } catch (error) {
      console.error("خطا در دریافت اطلاعات از سرور:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const filteredGoals = useMemo(() => {
    if (selectedCategoryId === 'all') return goals;
    return goals.filter(g => {
      const gCatId = typeof g.category === 'object' ? g.category?.id : g.category;
      return gCatId === selectedCategoryId;
    });
  }, [goals, selectedCategoryId]);

  const filteredTasks = useMemo(() => {
    if (selectedCategoryId === 'all') return flatTasks;
    return flatTasks.filter(t => {
      const tCatId = typeof t.category === 'object' ? t.category?.id : t.category;
      return tCatId === selectedCategoryId;
    });
  }, [flatTasks, selectedCategoryId]);

  const toggleTask = async (taskId: number, currentStatus: boolean, durationMinutes: number = 0) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_done: !currentStatus, duration_minutes: durationMinutes })
      });
      fetchData();
    } catch (error) { console.error(error); }
  };

  const toggleStep = async (stepId: number, currentStatus: boolean, durationMinutes: number = 0) => {
    try {
      await fetch(`${API_BASE}/steps/${stepId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_done: !currentStatus, duration_minutes: durationMinutes })
      });
      fetchData();
    } catch (error) { console.error(error); }
  };

  const addStep = async (taskId: number, stepTitle: string) => {
    try {
      await fetch(`${API_BASE}/steps/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: stepTitle, task: taskId })
      });
      fetchData(); 
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (type: 'goal' | 'task' | 'step', id: number) => {
    if (!window.confirm(`آیا از حذف این ${type} اطمینان دارید؟`)) return;
    try {
      await fetch(`${API_BASE}/${type}s/${id}/`, { method: 'DELETE' });
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleEdit = async (type: 'goal' | 'task' | 'step', id: number, currentTitle: string) => {
    const newTitle = window.prompt(`ویرایش عنوان (${type}):`, currentTitle);
    if (!newTitle || newTitle.trim() === currentTitle) return;
    try {
      await fetch(`${API_BASE}/${type}s/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      });
      fetchData();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen text-gray-800" dir="rtl">
      
  <button 
    onClick={() => router.back()} 
    className="flex items-center gap-2 p-3 bg-white rounded-2xl shadow-sm hover:bg-gray-50 transition border border-gray-100 text-gray-500 hover:text-gray-900 mb-6 text-sm font-semibold w-fit"
  >
    <ArrowRight className="w-5 h-5 text-gray-600" />
    {/* در صورت نیاز می‌توانید متنی مثل "بازگشت" هم اینجا اضافه کنید */}
  </button>

  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
    <div>
      <h1 className="text-3xl font-black text-gray-900">برای انجام</h1>
      <p className="text-gray-500 mt-1">چه کاری رو قراره امروز تموم کنی؟</p>
    </div>
    <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-blue-200 transition-transform active:scale-95 flex items-center gap-2">
      <Plus className="w-5 h-5" />
      کار جدید
    </button>
  </div>

      <div className="flex flex-wrap gap-2 mb-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
        {[
          { id: 'all', icon: '📋', label: 'همه موارد' },
          { id: 'frogs', icon: '🐸', label: 'قورباغه‌ها' },
          { id: 'tada', icon: '🎉', label: 'لیست Ta-Da' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSelectedCategoryId('all'); }}
            className={`flex-1 py-2.5 px-3 text-sm md:text-base font-bold rounded-xl transition-all flex items-center justify-center gap-2
              ${activeTab === tab.id ? 'bg-blue-100 text-blue-800 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {categories.length > 0 && activeTab !== 'tada' && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 hide-scrollbar items-center">
          <Tag className="w-4 h-4 text-gray-400 ml-1 flex-shrink-0" />
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${selectedCategoryId === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            همه دسته‌ها
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                ${selectedCategoryId === cat.id ? 'bg-gray-100 border-gray-300 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50 opacity-80'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
              <span style={{ color: selectedCategoryId === cat.id ? '#1f2937' : '#4b5563' }}>{cat.title}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 space-y-4">
           <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
           <p className="text-gray-400 font-medium animate-pulse">در حال دریافت اطلاعات...</p>
        </div>
      ) : (
        <div className="space-y-5">
          
          {activeTab === 'all' && (
            <>
              {filteredGoals.map(goal => (
                <GoalCard 
                  key={`goal-${goal.id}`} 
                  goal={goal} 
                  activeTab={activeTab} 
                  categories={categories}
                  onToggleTask={toggleTask} 
                  onToggleStep={toggleStep}
                  onAddStep={addStep}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
              
              {filteredTasks.map(task => (
                <TaskItem 
                  key={`orphan-${task.id}`} 
                  task={task} 
                  activeTab={activeTab}
                  categories={categories}
                  onToggleTask={toggleTask} 
                  onToggleStep={toggleStep}
                  onAddStep={addStep}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}

              {filteredGoals.length === 0 && filteredTasks.length === 0 && (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
                  <span className="text-5xl mb-4 block opacity-60">🪹</span>
                  <h3 className="text-lg font-bold text-gray-700">چیزی اینجا نیست!</h3>
                  <p className="text-gray-500 mt-2">هیچ موردی با فیلترهای فعلی شما مطابقت ندارد.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'frogs' && (
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-b from-green-50 to-white rounded-3xl border border-dashed border-green-200">
                  <span className="text-5xl mb-4 block drop-shadow-md">😎</span>
                  <h3 className="text-xl font-black text-green-800">ایول!</h3>
                  <p className="text-green-600 mt-2">همه قورباغه‌ها رو قورت دادی یا اصلا قورباغه‌ای نداری!</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    showGoalName={true} 
                    activeTab={activeTab}
                    categories={categories}
                    onToggleTask={toggleTask} 
                    onToggleStep={toggleStep}
                    onAddStep={addStep}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'tada' && (
            <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 p-6 md:p-8 rounded-[2rem] border border-yellow-200 shadow-inner">
              <div className="text-center mb-8">
                <span className="text-6xl drop-shadow-lg">🏆</span>
                <h2 className="text-3xl font-black text-yellow-800 mt-4 tracking-tight">کارهای انجام شده‌ی امروز</h2>
                <p className="text-yellow-700 mt-1 font-medium">به خودت افتخار کن، عالی بودی!</p>
              </div>
              <div className="space-y-4">
                {flatTasks.length === 0 && goals.length === 0 ? (
                  <div className="bg-white/60 p-6 rounded-2xl text-center border border-white">
                    <p className="text-yellow-800 font-semibold">هنوز کاری انجام ندادی...</p>
                    <p className="text-sm text-yellow-600 mt-1">بپر یه قورباغه رو قورت بده!</p>
                  </div>
                ) : (
                  <>
                    {/* رندر کردن اهداف کاملاً انجام شده */}
                    {goals.map(goal => (
                      <GoalCard 
                        key={`goal-tada-${goal.id}`} 
                        goal={goal} 
                        activeTab={activeTab} 
                        categories={categories}
                        onToggleTask={toggleTask} 
                        onToggleStep={toggleStep}
                        onAddStep={addStep}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                      />
                    ))}

                    {/* رندر کردن تسک‌های یتیم یا تسک‌های اهدافِ نیمه‌کاره */}
                    {flatTasks.map(task => (
                      <TaskItem 
                        key={`task-tada-${task.id}`} 
                        task={task} 
                        showGoalName={true} 
                        activeTab={activeTab}
                        categories={categories}
                        onToggleTask={toggleTask} 
                        onToggleStep={toggleStep}
                        onAddStep={addStep}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchData();
        }} 
      />
    </div>
  );
}
