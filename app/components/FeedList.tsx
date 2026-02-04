'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Feed, Comment } from '@/lib/types';
import Loading from './Loading';
import Image from 'next/image';

interface FeedListProps {
  currentUser: string;
}

export default function FeedList({ currentUser }: FeedListProps) {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedFeed, setExpandedFeed] = useState<string | null>(null);
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feeds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feeds:', error);
    } else if (data) {
      setFeeds(data as Feed[]);
      const feedIds = data.map(f => f.id);
      if (feedIds.length > 0) {
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .in('feed_id', feedIds)
          .order('created_at', { ascending: true });

        if (commentsData) {
          const grouped: Record<string, Comment[]> = {};
          commentsData.forEach((comment) => {
            if (!grouped[comment.feed_id]) {
              grouped[comment.feed_id] = [];
            }
            grouped[comment.feed_id].push(comment as Comment);
          });
          setComments(grouped);
        }
      }
    }
    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `feeds/${fileName}`;

    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handlePost = async () => {
    if (!currentUser) {
      alert('이름을 먼저 입력해주세요.');
      return;
    }
    if (!newContent.trim() && !selectedImage) {
      alert('내용이나 이미지를 추가해주세요.');
      return;
    }

    setPosting(true);

    let imageUrl = null;
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
    }

    const { error } = await supabase
      .from('feeds')
      .insert([{
        name: currentUser,
        content: newContent.trim(),
        image_url: imageUrl,
      }]);

    if (error) {
      console.error('Error posting feed:', error);
      alert('게시에 실패했습니다.');
    } else {
      setNewContent('');
      removeImage();
      fetchFeeds();
    }
    setPosting(false);
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('feeds')
      .delete()
      .eq('id', feedId);

    if (error) {
      console.error('Error deleting feed:', error);
      alert('삭제에 실패했습니다.');
    } else {
      fetchFeeds();
    }
  };

  const handleComment = async (feedId: string) => {
    const commentText = newComments[feedId]?.trim();
    if (!currentUser) {
      alert('이름을 먼저 입력해주세요.');
      return;
    }
    if (!commentText) return;

    const { error } = await supabase
      .from('comments')
      .insert([{
        feed_id: feedId,
        name: currentUser,
        content: commentText,
      }]);

    if (error) {
      console.error('Error posting comment:', error);
      alert('댓글 작성에 실패했습니다.');
    } else {
      setNewComments({ ...newComments, [feedId]: '' });
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('feed_id', feedId)
        .order('created_at', { ascending: true });

      if (data) {
        setComments({ ...comments, [feedId]: data as Comment[] });
      }
    }
  };

  const handleDeleteComment = async (commentId: string, feedId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
    } else {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('feed_id', feedId)
        .order('created_at', { ascending: true });

      if (data) {
        setComments({ ...comments, [feedId]: data as Comment[] });
      }
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
    <div className="p-4">
      {/* New Post */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            {currentUser ? currentUser[0].toUpperCase() : '?'}
          </div>
          <div className="flex-1">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="무슨 생각을 하고 계신가요?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 rounded-lg object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              {/* Image Upload Button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  사진
                </button>
              </div>

              <button
                onClick={handlePost}
                disabled={posting || (!newContent.trim() && !selectedImage)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {posting ? '게시 중...' : '게시하기'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {feeds.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            아직 게시글이 없습니다. 첫 번째 게시글을 작성해보세요!
          </div>
        ) : (
          feeds.map((feed) => (
            <div key={feed.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Feed Header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      {feed.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{feed.name}</div>
                      <div className="text-xs text-gray-500">{formatTime(feed.created_at)}</div>
                    </div>
                  </div>
                  {feed.name === currentUser && (
                    <button
                      onClick={() => handleDeleteFeed(feed.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                {feed.content && (
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">{feed.content}</p>
                )}
                {/* Feed Image */}
                {feed.image_url && (
                  <div className="relative w-full rounded-lg overflow-hidden">
                    <img
                      src={feed.image_url}
                      alt="Feed image"
                      className="w-full max-h-96 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-100 px-4 py-3">
                <button
                  onClick={() => setExpandedFeed(expandedFeed === feed.id ? null : feed.id)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  댓글 {comments[feed.id]?.length || 0}개
                </button>

                {expandedFeed === feed.id && (
                  <div className="mt-3 space-y-3">
                    {/* Comment List */}
                    {comments[feed.id]?.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {comment.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{comment.name}</span>
                            {comment.name === currentUser && (
                              <button
                                onClick={() => handleDeleteComment(comment.id, feed.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{comment.content}</p>
                          <span className="text-xs text-gray-400">{formatTime(comment.created_at)}</span>
                        </div>
                      </div>
                    ))}

                    {/* New Comment Input */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {currentUser ? currentUser[0].toUpperCase() : '?'}
                      </div>
                      <input
                        type="text"
                        value={newComments[feed.id] || ''}
                        onChange={(e) => setNewComments({ ...newComments, [feed.id]: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && handleComment(feed.id)}
                        placeholder="댓글을 입력하세요..."
                        className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleComment(feed.id)}
                        className="text-blue-500 hover:text-blue-600 font-medium text-sm"
                      >
                        게시
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
