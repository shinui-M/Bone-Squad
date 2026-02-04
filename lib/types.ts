// Database Types for Supabase

export interface Member {
  id: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  date: string;
  name: string;
  rating: number;
  items: TaskItem[];
  created_at: string;
}

export interface TaskItem {
  text: string;
  completed: boolean;
}

export interface Feed {
  id: string;
  name: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  feed_id: string;
  name: string;
  content: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_name: string;
  member_name: string;
  avatar: string | null;
  joined_at: string;
}

export interface GroupPost {
  id: string;
  group_name: string;
  name: string;
  content: string;
  created_at: string;
}

export interface DietLog {
  id: string;
  date: string;
  group_name: string;
  name: string;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  snack: string | null;
  exercise: string | null;
  created_at: string;
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member;
        Insert: Omit<Member, 'id' | 'created_at'>;
        Update: Partial<Omit<Member, 'id' | 'created_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at'>>;
      };
      feeds: {
        Row: Feed;
        Insert: Omit<Feed, 'id' | 'created_at'>;
        Update: Partial<Omit<Feed, 'id' | 'created_at'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at'>;
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at'>;
        Update: Partial<Omit<Group, 'id' | 'created_at'>>;
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<GroupMember, 'id' | 'joined_at'>>;
      };
      group_posts: {
        Row: GroupPost;
        Insert: Omit<GroupPost, 'id' | 'created_at'>;
        Update: Partial<Omit<GroupPost, 'id' | 'created_at'>>;
      };
      diet_logs: {
        Row: DietLog;
        Insert: Omit<DietLog, 'id' | 'created_at'>;
        Update: Partial<Omit<DietLog, 'id' | 'created_at'>>;
      };
    };
  };
}

// Tab types
export type TabType = 'weekly' | 'feed' | 'groups' | 'members';

// Group types
export type GroupType = 'opic' | 'diet';
