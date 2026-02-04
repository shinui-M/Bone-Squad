'use client';

import { useState, useEffect } from 'react';

interface HeaderProps {
  currentUser: string;
  onUserChange: (name: string) => void;
}

export default function Header({ currentUser, onUserChange }: HeaderProps) {
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
      <div className="h-32 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 flex items-center justify-center">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          뼈갈단 V2
        </h1>
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
      </div>
    </header>
  );
}
