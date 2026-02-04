'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeaderProps {
  currentUser: string;
  onUserChange: (name: string) => void;
  onLogin?: () => void;
  onLogout?: () => void;
  isLoggedIn?: boolean;
}

export default function Header({ currentUser, onUserChange, onLogin, onLogout, isLoggedIn }: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputName, setInputName] = useState(currentUser);

  useEffect(() => {
    setInputName(currentUser);
  }, [currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      onUserChange(inputName.trim());
      setIsEditing(false);
    }
  };

  return (
    <header className="relative w-full">
      {/* Banner */}
      <div className="relative h-40 w-full overflow-hidden">
        <Image
          src="/banner.jpg"
          alt="뼈갈단 배너"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            뼈갈단 V2
          </h1>
        </div>
      </div>

      {/* User Info Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {currentUser ? currentUser[0].toUpperCase() : '?'}
          </div>

          {/* Name */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="이름을 입력하세요"
                autoFocus
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                확인
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputName(currentUser);
                  setIsEditing(false);
                }}
                className="text-gray-500 px-2 py-1 text-sm hover:text-gray-700"
              >
                취소
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">
                {currentUser || '이름을 입력하세요'}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Login/Logout Button */}
        <div>
          {isLoggedIn ? (
            <button
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
