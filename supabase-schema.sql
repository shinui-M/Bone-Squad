-- Supabase Database Schema for 뼈갈단 V2
-- Run this SQL in your Supabase SQL Editor

-- 1. members (멤버)
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. tasks (주간 성과)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, name)
);

-- 3. feeds (뼈이스북 게시글)
CREATE TABLE IF NOT EXISTS feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. comments (댓글)
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id UUID REFERENCES feeds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. groups (그룹 정의)
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. group_members (그룹 멤버)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL,
  member_name TEXT NOT NULL,
  avatar TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_name, member_name)
);

-- 7. group_posts (그룹 게시글)
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. diet_logs (다이어트 기록)
CREATE TABLE IF NOT EXISTS diet_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  group_name TEXT NOT NULL,
  name TEXT NOT NULL,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  snack TEXT,
  exercise TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, group_name, name)
);

-- Enable Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all operations for anonymous users (no authentication required)
-- members
CREATE POLICY "Allow all access to members" ON members FOR ALL USING (true);

-- tasks
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true);

-- feeds
CREATE POLICY "Allow all access to feeds" ON feeds FOR ALL USING (true);

-- comments
CREATE POLICY "Allow all access to comments" ON comments FOR ALL USING (true);

-- groups
CREATE POLICY "Allow all access to groups" ON groups FOR ALL USING (true);

-- group_members
CREATE POLICY "Allow all access to group_members" ON group_members FOR ALL USING (true);

-- group_posts
CREATE POLICY "Allow all access to group_posts" ON group_posts FOR ALL USING (true);

-- diet_logs
CREATE POLICY "Allow all access to diet_logs" ON diet_logs FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_name ON tasks(name);
CREATE INDEX IF NOT EXISTS idx_feeds_created_at ON feeds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_feed_id ON comments(feed_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_name);
CREATE INDEX IF NOT EXISTS idx_group_posts_group ON group_posts(group_name);
CREATE INDEX IF NOT EXISTS idx_diet_logs_date ON diet_logs(date);
CREATE INDEX IF NOT EXISTS idx_diet_logs_group ON diet_logs(group_name);
