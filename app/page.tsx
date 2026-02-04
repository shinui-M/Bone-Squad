'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { TabType } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const displayName = session.user.user_metadata?.full_name ||
                           session.user.user_metadata?.name ||
                           session.user.email?.split('@')[0] || '';
        setCurrentUser(displayName);
        localStorage.setItem(LOCAL_STORAGE_KEY, displayName);
      } else {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          setCurrentUser(saved);
        }
      }
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const displayName = session.user.user_metadata?.full_name ||
                           session.user.user_metadata?.name ||
                           session.user.email?.split('@')[0] || '';
        setCurrentUser(displayName);
        localStorage.setItem(LOCAL_STORAGE_KEY, displayName);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserChange = (name: string) => {
    setCurrentUser(name);
    localStorage.setItem(LOCAL_STORAGE_KEY, name);
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('Error logging in:', error);
      alert('로그인에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      setUser(null);
      setCurrentUser('');
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggedIn={!!user}
      />
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
            Google 로그인 또는 상단에서 이름을 입력하면 성과를 기록하고 게시글을 작성할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
