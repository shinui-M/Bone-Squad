'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task, TaskItem } from '@/lib/types';

interface TaskModalProps {
  date: Date;
  currentUser: string;
  onClose: () => void;
  onSave: () => void;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

export default function TaskModal({ date, currentUser, onClose, onSave }: TaskModalProps) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [myTask, setMyTask] = useState<Task | null>(null);
  const [rating, setRating] = useState(0);
  const [items, setItems] = useState<TaskItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dateStr = formatDate(date);

  useEffect(() => {
    fetchTasks();
  }, [date]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('date', dateStr)
      .order('name');

    if (error) {
      console.error('Error fetching tasks:', error);
    } else if (data) {
      setAllTasks(data as Task[]);
      const mine = data.find(t => t.name === currentUser) as Task | undefined;
      if (mine) {
        setMyTask(mine);
        setRating(mine.rating);
        setItems(mine.items || []);
      } else {
        setMyTask(null);
        setRating(0);
        setItems([]);
      }
    }
    setLoading(false);
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      setItems([...items, { text: newItem.trim(), completed: false }]);
      setNewItem('');
    }
  };

  const handleToggleItem = (index: number) => {
    const newItems = [...items];
    newItems[index].completed = !newItems[index].completed;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!currentUser) {
      alert('이름을 먼저 입력해주세요.');
      return;
    }

    setSaving(true);

    const taskData = {
      date: dateStr,
      name: currentUser,
      rating,
      items,
    };

    let error;
    if (myTask) {
      const result = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', myTask.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('tasks')
        .insert([taskData]);
      error = result.error;
    }

    if (error) {
      console.error('Error saving task:', error);
      alert('저장에 실패했습니다.');
    } else {
      onSave();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!myTask) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setSaving(true);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', myTask.id);

    if (error) {
      console.error('Error deleting task:', error);
      alert('삭제에 실패했습니다.');
    } else {
      onSave();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {formatDisplayDate(date)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="p-4">
            {/* My Task Section */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">내 성과 기록</h3>

              {/* Rating */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">오늘의 평점</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-colors ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  {rating > 0 && (
                    <button
                      onClick={() => setRating(0)}
                      className="text-sm text-gray-400 ml-2 hover:text-gray-600"
                    >
                      초기화
                    </button>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">오늘 한 일</label>

                {/* Add Item */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                    placeholder="할 일을 입력하세요"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddItem}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
                  >
                    추가
                  </button>
                </div>

                {/* Item List */}
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleItem(index)}
                        className="w-4 h-4 rounded"
                      />
                      <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save/Delete Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
                {myTask && (
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-4 py-2 text-red-500 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>

            {/* Other Members' Tasks */}
            {allTasks.filter(t => t.name !== currentUser).length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-700 mb-3">다른 멤버들의 성과</h3>
                <div className="space-y-3">
                  {allTasks
                    .filter(t => t.name !== currentUser)
                    .map((task) => (
                      <div key={task.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800">{task.name}</span>
                          <span className="text-yellow-500">
                            {'★'.repeat(Math.floor(task.rating))}
                            {task.rating % 1 !== 0 && '☆'}
                          </span>
                        </div>
                        {task.items && task.items.length > 0 && (
                          <ul className="text-sm text-gray-600 space-y-1">
                            {task.items.map((item: TaskItem, index: number) => (
                              <li key={index} className={item.completed ? 'line-through text-gray-400' : ''}>
                                • {item.text}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
