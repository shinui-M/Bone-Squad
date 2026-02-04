'use client';

import { useState, useEffect } from 'react';
import type { TabType } from '@/lib/types';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import WeeklyCalendar from './components/WeeklyCalendar';
import FeedList from './components/FeedList';
import GroupList from './components/GroupList';
import MemberList from './components/MemberList';

const LOCAL_STORAGE_KEY = 'bigstepper_user';

export default function Home() {
  const [currentUser, setCurrentUser] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('weekly');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setCurrentUser(saved);
    }
  }, []);

  const handleUserChange = (name: string) => {
    setCurrentUser(name);
    localStorage.setItem(LOCAL_STORAGE_KEY, name);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentUser={currentUser} onUserChange={handleUserChange} />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-2xl mx-auto">
        {activeTab === 'weekly' && <WeeklyCalendar currentUser={currentUser} />}
        {activeTab === 'feed' && <FeedList currentUser={currentUser} />}
        {activeTab === 'groups' && <GroupList currentUser={currentUser} />}
        {activeTab === 'members' && <MemberList currentUser={currentUser} />}
      </main>

      {/* User prompt when no name */}
      {!currentUser && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-50 border-t border-yellow-200 p-4 text-center">
          <p className="text-yellow-800 text-sm">
            상단에서 이름을 입력하면 성과를 기록하고 게시글을 작성할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
