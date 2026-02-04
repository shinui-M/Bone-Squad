'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/lib/types';
import TaskModal from './TaskModal';
import Loading from './Loading';

interface WeeklyCalendarProps {
  currentUser: string;
}

function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(date);
  monday.setDate(diff);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
}

export default function WeeklyCalendar({ currentUser }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setWeekDates(getWeekDates(currentDate));
  }, [currentDate]);

  useEffect(() => {
    if (weekDates.length > 0) {
      fetchTasks();
    }
  }, [weekDates]);

  const fetchTasks = async () => {
    if (weekDates.length === 0) return;

    setLoading(true);
    const startDate = formatDate(weekDates[0]);
    const endDate = formatDate(weekDates[6]);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('name');

    if (error) {
      console.error('Error fetching tasks:', error);
    } else if (data) {
      const grouped: Record<string, Task[]> = {};
      data.forEach((task) => {
        if (!grouped[task.date]) {
          grouped[task.date] = [];
        }
        grouped[task.date].push(task as Task);
      });
      setTasks(grouped);
    }
    setLoading(false);
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  const handleTaskSave = () => {
    fetchTasks();
    handleModalClose();
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4) return 'bg-green-100 border-green-300';
    if (rating >= 3) return 'bg-yellow-100 border-yellow-300';
    if (rating >= 2) return 'bg-orange-100 border-orange-300';
    if (rating > 0) return 'bg-red-100 border-red-300';
    return 'bg-gray-50 border-gray-200';
  };

  const getWeekLabel = (): string => {
    if (weekDates.length === 0) return '';
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
  };

  if (loading && weekDates.length === 0) {
    return <Loading />;
  }

  return (
    <div className="p-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousWeek}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{getWeekLabel()}</span>
          <button
            onClick={goToToday}
            className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
          >
            오늘
          </button>
        </div>

        <button
          onClick={goToNextWeek}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const dayTasks = tasks[dateStr] || [];
            const isToday = formatDate(new Date()) === dateStr;
            const myTask = dayTasks.find(t => t.name === currentUser);

            return (
              <div
                key={dateStr}
                onClick={() => handleDateClick(date)}
                className={`min-h-[120px] p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  isToday ? 'ring-2 ring-blue-500' : ''
                } ${myTask ? getRatingColor(myTask.rating) : 'bg-white border-gray-200'}`}
              >
                <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {formatDisplayDate(date)}
                </div>

                {/* Task Summary */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="text-xs truncate flex items-center gap-1"
                    >
                      <span className="font-medium text-gray-700">{task.name}</span>
                      <span className="text-yellow-500">{'★'.repeat(Math.floor(task.rating))}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500">+{dayTasks.length - 3}명</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      {showModal && selectedDate && (
        <TaskModal
          date={selectedDate}
          currentUser={currentUser}
          onClose={handleModalClose}
          onSave={handleTaskSave}
        />
      )}
    </div>
  );
}
