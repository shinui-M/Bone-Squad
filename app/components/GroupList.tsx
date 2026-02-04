'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Group, GroupMember } from '@/lib/types';
import GroupDetail from './GroupDetail';
import Loading from './Loading';

interface GroupListProps {
  currentUser: string;
}

const defaultGroups = [
  { name: '오픽 스터디', description: '오픽 시험 준비를 위한 스터디 그룹', icon: '📚' },
  { name: '다이어트 그룹', description: '함께 건강한 식단을 관리하는 그룹', icon: '🥗' },
];

export default function GroupList({ currentUser }: GroupListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<string[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    initializeGroups();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMyGroups();
    }
  }, [currentUser]);

  const initializeGroups = async () => {
    setLoading(true);

    // Check if default groups exist
    const { data: existingGroups } = await supabase
      .from('groups')
      .select('*')
      .order('created_at');

    if (!existingGroups || existingGroups.length === 0) {
      // Insert default groups
      for (const group of defaultGroups) {
        await supabase.from('groups').insert([group]);
      }
    }

    // Fetch all groups
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at');

    if (error) {
      console.error('Error fetching groups:', error);
    } else if (data) {
      setGroups(data as Group[]);

      // Fetch member counts
      const counts: Record<string, number> = {};
      for (const group of data) {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_name', group.name);
        counts[group.name] = count || 0;
      }
      setMemberCounts(counts);
    }
    setLoading(false);
  };

  const fetchMyGroups = async () => {
    const { data } = await supabase
      .from('group_members')
      .select('group_name')
      .eq('member_name', currentUser);

    if (data) {
      setMyGroups(data.map(d => d.group_name));
    }
  };

  const handleJoinGroup = async (groupName: string) => {
    if (!currentUser) {
      alert('이름을 먼저 입력해주세요.');
      return;
    }

    const { error } = await supabase
      .from('group_members')
      .insert([{
        group_name: groupName,
        member_name: currentUser,
      }]);

    if (error) {
      if (error.code === '23505') {
        alert('이미 가입된 그룹입니다.');
      } else {
        console.error('Error joining group:', error);
        alert('가입에 실패했습니다.');
      }
    } else {
      fetchMyGroups();
      setMemberCounts({
        ...memberCounts,
        [groupName]: (memberCounts[groupName] || 0) + 1,
      });
    }
  };

  const handleLeaveGroup = async (groupName: string) => {
    if (!confirm('정말 그룹을 탈퇴하시겠습니까?')) return;

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_name', groupName)
      .eq('member_name', currentUser);

    if (error) {
      console.error('Error leaving group:', error);
      alert('탈퇴에 실패했습니다.');
    } else {
      fetchMyGroups();
      setMemberCounts({
        ...memberCounts,
        [groupName]: Math.max(0, (memberCounts[groupName] || 0) - 1),
      });
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        currentUser={currentUser}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">그룹</h2>

      <div className="space-y-3">
        {groups.map((group) => {
          const isMember = myGroups.includes(group.name);

          return (
            <div
              key={group.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => isMember && setSelectedGroup(group)}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-2xl">
                    {group.icon || '👥'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{group.name}</h3>
                    <p className="text-sm text-gray-500">{group.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      멤버 {memberCounts[group.name] || 0}명
                    </p>
                  </div>
                </div>

                <div>
                  {isMember ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedGroup(group)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
                      >
                        입장
                      </button>
                      <button
                        onClick={() => handleLeaveGroup(group.name)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoinGroup(group.name)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600"
                    >
                      가입하기
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
