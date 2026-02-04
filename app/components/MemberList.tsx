'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Member } from '@/lib/types';
import Loading from './Loading';

interface MemberListProps {
  currentUser: string;
}

// DiceBear avatar styles
const avatarStyles = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'big-ears',
  'big-smile',
  'bottts',
  'croodles',
  'fun-emoji',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'micah',
  'miniavs',
  'open-peeps',
  'personas',
  'pixel-art',
  'thumbs',
];

function generateAvatarUrl(name: string, style: string = 'adventurer'): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(name)}`;
}

export default function MemberList({ currentUser }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [bio, setBio] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('adventurer');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching members:', error);
    } else if (data) {
      setMembers(data as Member[]);
    }
    setLoading(false);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setBio(member.bio || '');
    // Extract style from avatar URL or use default
    const styleMatch = member.avatar?.match(/\/7\.x\/([^/]+)\//);
    setSelectedStyle(styleMatch ? styleMatch[1] : 'adventurer');
  };

  const handleSave = async () => {
    if (!editingMember) return;

    setSaving(true);
    const avatarUrl = generateAvatarUrl(editingMember.name, selectedStyle);

    const { error } = await supabase
      .from('members')
      .update({
        bio: bio.trim() || null,
        avatar: avatarUrl,
      })
      .eq('id', editingMember.id);

    if (error) {
      console.error('Error saving member:', error);
      alert('저장에 실패했습니다.');
    } else {
      setEditingMember(null);
      fetchMembers();
    }
    setSaving(false);
  };

  const handleCreateProfile = async () => {
    if (!currentUser) {
      alert('이름을 먼저 입력해주세요.');
      return;
    }

    // Check if profile already exists
    const existing = members.find(m => m.name === currentUser);
    if (existing) {
      handleEdit(existing);
      return;
    }

    setSaving(true);
    const avatarUrl = generateAvatarUrl(currentUser, 'adventurer');

    const { error, data } = await supabase
      .from('members')
      .insert([{
        name: currentUser,
        avatar: avatarUrl,
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        alert('이미 프로필이 존재합니다.');
      } else {
        console.error('Error creating member:', error);
        alert('프로필 생성에 실패했습니다.');
      }
    } else if (data) {
      handleEdit(data as Member);
      fetchMembers();
    }
    setSaving(false);
  };

  const myProfile = members.find(m => m.name === currentUser);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-4">
      {/* Create/Edit Profile Button */}
      {!editingMember && (
        <button
          onClick={handleCreateProfile}
          disabled={saving}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium mb-4 flex items-center justify-center gap-2 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
        >
          <span>👤</span>
          {myProfile ? '내 프로필 수정하기' : '내 프로필 만들기'}
        </button>
      )}

      {/* Edit Modal */}
      {editingMember && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4">
          <h3 className="font-bold text-gray-800 mb-4">프로필 수정</h3>

          {/* Avatar Preview */}
          <div className="flex justify-center mb-4">
            <img
              src={generateAvatarUrl(editingMember.name, selectedStyle)}
              alt={editingMember.name}
              className="w-24 h-24 rounded-full bg-gray-100"
            />
          </div>

          {/* Avatar Style Selector */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-2 block">아바타 스타일</label>
            <div className="grid grid-cols-4 gap-2">
              {avatarStyles.slice(0, 8).map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-1 rounded-lg border-2 transition-colors ${
                    selectedStyle === style
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={generateAvatarUrl(editingMember.name, style)}
                    alt={style}
                    className="w-full aspect-square rounded"
                  />
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {avatarStyles.slice(8, 16).map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-1 rounded-lg border-2 transition-colors ${
                    selectedStyle === style
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={generateAvatarUrl(editingMember.name, style)}
                    alt={style}
                    className="w-full aspect-square rounded"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-1 block">자기소개</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="자기소개를 입력하세요"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={() => setEditingMember(null)}
              className="px-4 py-2 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Member List */}
      <h2 className="text-lg font-bold text-gray-800 mb-4">멤버 소개</h2>
      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            아직 등록된 멤버가 없습니다.
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className={`bg-white rounded-xl shadow-sm border p-4 ${
                member.name === currentUser ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <img
                  src={member.avatar || generateAvatarUrl(member.name)}
                  alt={member.name}
                  className="w-16 h-16 rounded-full bg-gray-100"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{member.name}</h3>
                    {member.name === currentUser && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                        나
                      </span>
                    )}
                  </div>
                  {member.bio ? (
                    <p className="text-sm text-gray-600 mt-1">{member.bio}</p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1 italic">자기소개가 없습니다.</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    가입일: {new Date(member.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                {member.name === currentUser && !editingMember && (
                  <button
                    onClick={() => handleEdit(member)}
                    className="text-purple-500 hover:text-purple-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
