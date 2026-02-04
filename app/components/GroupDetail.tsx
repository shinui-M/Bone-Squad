'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Group, GroupMember, GroupPost } from '@/lib/types';
import DietModal from './DietModal';
import Loading from './Loading';

interface GroupDetailProps {
  group: Group;
  currentUser: string;
  onBack: () => void;
}

export default function GroupDetail({ group, currentUser, onBack }: GroupDetailProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [showDietModal, setShowDietModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'members'>('posts');

  const isDietGroup = group.name === '다이어트 그룹';

  useEffect(() => {
    fetchGroupData();
  }, [group.name]);

  const fetchGroupData = async () => {
    setLoading(true);

    // Fetch members
    const { data: membersData } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_name', group.name)
      .order('joined_at', { ascending: false });

    if (membersData) {
      setMembers(membersData as GroupMember[]);
    }

    // Fetch posts
    const { data: postsData } = await supabase
      .from('group_posts')
      .select('*')
      .eq('group_name', group.name)
      .order('created_at', { ascending: false });

    if (postsData) {
      setPosts(postsData as GroupPost[]);
    }

    setLoading(false);
  };

  const handlePost = async () => {
    if (!currentUser) {
      alert('이름을 먼저 입력해주세요.');
      return;
    }
    if (!newPost.trim()) return;

    setPosting(true);
    const { error } = await supabase
      .from('group_posts')
      .insert([{
        group_name: group.name,
        name: currentUser,
        content: newPost.trim(),
      }]);

    if (error) {
      console.error('Error posting:', error);
      alert('게시에 실패했습니다.');
    } else {
      setNewPost('');
      fetchGroupData();
    }
    setPosting(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('group_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
    } else {
      fetchGroupData();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{group.icon || '👥'}</span>
            <h1 className="text-lg font-bold text-gray-800">{group.name}</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mt-3 -mb-3">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-2 text-center text-sm font-medium border-b-2 ${
              activeTab === 'posts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            게시판
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2 text-center text-sm font-medium border-b-2 ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            멤버 ({members.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'posts' ? (
          <>
            {/* Diet Group - Record Button */}
            {isDietGroup && (
              <button
                onClick={() => setShowDietModal(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-medium mb-4 flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-600"
              >
                <span>🍽️</span>
                오늘의 식단 기록하기
              </button>
            )}

            {/* New Post */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={isDietGroup ? "오늘의 다이어트 팁을 공유해보세요!" : "그룹에 게시글을 작성해보세요!"}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handlePost}
                  disabled={posting || !newPost.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                  {posting ? '게시 중...' : '게시하기'}
                </button>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  아직 게시글이 없습니다.
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                          {post.name[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">{post.name}</span>
                          <span className="text-xs text-gray-400 ml-2">{formatTime(post.created_at)}</span>
                        </div>
                      </div>
                      {post.name === currentUser && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Members Tab */
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {member.member_name[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{member.member_name}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(member.joined_at).toLocaleDateString('ko-KR')} 가입
                  </div>
                </div>
                {member.member_name === currentUser && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">나</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diet Modal */}
      {showDietModal && (
        <DietModal
          groupName={group.name}
          currentUser={currentUser}
          onClose={() => setShowDietModal(false)}
        />
      )}
    </div>
  );
}
