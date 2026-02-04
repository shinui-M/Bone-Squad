'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { DietLog } from '@/lib/types';

interface DietModalProps {
  groupName: string;
  currentUser: string;
  onClose: () => void;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function DietModal({ groupName, currentUser, onClose }: DietModalProps) {
  const [date, setDate] = useState(formatDate(new Date()));
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [snack, setSnack] = useState('');
  const [exercise, setExercise] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingLog, setExistingLog] = useState<DietLog | null>(null);
  const [allLogs, setAllLogs] = useState<DietLog[]>([]);

  useEffect(() => {
    fetchDietLogs();
  }, [date]);

  const fetchDietLogs = async () => {
    setLoading(true);

    // Fetch my log for the selected date
    const { data: myLog } = await supabase
      .from('diet_logs')
      .select('*')
      .eq('date', date)
      .eq('group_name', groupName)
      .eq('name', currentUser)
      .single();

    if (myLog) {
      const log = myLog as DietLog;
      setExistingLog(log);
      setBreakfast(log.breakfast || '');
      setLunch(log.lunch || '');
      setDinner(log.dinner || '');
      setSnack(log.snack || '');
      setExercise(log.exercise || '');
    } else {
      setExistingLog(null);
      setBreakfast('');
      setLunch('');
      setDinner('');
      setSnack('');
      setExercise('');
    }

    // Fetch all logs for the date
    const { data: logs } = await supabase
      .from('diet_logs')
      .select('*')
      .eq('date', date)
      .eq('group_name', groupName)
      .order('name');

    if (logs) {
      setAllLogs(logs as DietLog[]);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!currentUser) {
      alert('이름을 먼저 입력해주세요.');
      return;
    }

    setSaving(true);

    const logData = {
      date,
      group_name: groupName,
      name: currentUser,
      breakfast: breakfast.trim() || null,
      lunch: lunch.trim() || null,
      dinner: dinner.trim() || null,
      snack: snack.trim() || null,
      exercise: exercise.trim() || null,
    };

    let error;
    if (existingLog) {
      const result = await supabase
        .from('diet_logs')
        .update(logData)
        .eq('id', existingLog.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('diet_logs')
        .insert([logData]);
      error = result.error;
    }

    if (error) {
      console.error('Error saving diet log:', error);
      alert('저장에 실패했습니다.');
    } else {
      fetchDietLogs();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!existingLog) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setSaving(true);
    const { error } = await supabase
      .from('diet_logs')
      .delete()
      .eq('id', existingLog.id);

    if (error) {
      console.error('Error deleting diet log:', error);
      alert('삭제에 실패했습니다.');
    } else {
      fetchDietLogs();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">식단 기록</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* Date Selector */}
          <div className="mb-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* My Diet Log Form */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-700">내 식단</h3>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">🌅 아침</label>
                  <input
                    type="text"
                    value={breakfast}
                    onChange={(e) => setBreakfast(e.target.value)}
                    placeholder="아침 식사를 입력하세요"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">☀️ 점심</label>
                  <input
                    type="text"
                    value={lunch}
                    onChange={(e) => setLunch(e.target.value)}
                    placeholder="점심 식사를 입력하세요"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">🌙 저녁</label>
                  <input
                    type="text"
                    value={dinner}
                    onChange={(e) => setDinner(e.target.value)}
                    placeholder="저녁 식사를 입력하세요"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">🍪 간식</label>
                  <input
                    type="text"
                    value={snack}
                    onChange={(e) => setSnack(e.target.value)}
                    placeholder="간식을 입력하세요"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">🏃 운동</label>
                  <input
                    type="text"
                    value={exercise}
                    onChange={(e) => setExercise(e.target.value)}
                    placeholder="오늘 한 운동을 입력하세요"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                  {existingLog && (
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

              {/* Other Members' Logs */}
              {allLogs.filter(log => log.name !== currentUser).length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3">다른 멤버들의 식단</h3>
                  <div className="space-y-3">
                    {allLogs
                      .filter(log => log.name !== currentUser)
                      .map((log) => (
                        <div key={log.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-gray-800 mb-2">{log.name}</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {log.breakfast && <div>🌅 아침: {log.breakfast}</div>}
                            {log.lunch && <div>☀️ 점심: {log.lunch}</div>}
                            {log.dinner && <div>🌙 저녁: {log.dinner}</div>}
                            {log.snack && <div>🍪 간식: {log.snack}</div>}
                            {log.exercise && <div>🏃 운동: {log.exercise}</div>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
