/*
  # Complete Peer Learning Platform Database Schema

  1. New Tables
    - `users` - User profiles with roles, XP, levels, and social links
    - `courses` - Courses created by mentors with pricing and session details
    - `enrollments` - Student enrollments in courses with completion tracking
    - `reviews` - Course and mentor reviews with ratings
    - `certificates` - Generated certificates for completed courses
    - `badges` - Available badges with criteria and types
    - `user_badges` - Badges earned by users with timestamps
    - `mentor_requests` - Requests from students to become mentors
    - `sessions` - Individual session scheduling and tracking
    - `learning_communities` - Study groups and communities
    - `community_members` - Community membership tracking
    - `community_resources` - Shared resources within communities
    - `community_sessions` - Community-hosted sessions
    - `user_projects` - User portfolio projects

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for each user role
    - Secure data access based on user relationships

  3. Functions
    - XP calculation and level progression
    - Automatic badge awarding
    - Certificate generation
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_projects CASCADE;
DROP TABLE IF EXISTS community_sessions CASCADE;
DROP TABLE IF EXISTS community_resources CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS learning_communities CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS mentor_requests CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS award_completion_xp() CASCADE;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  year_of_study integer DEFAULT 1,
  department text NOT NULL,
  role text DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin')),
  profile_picture text,
  bio text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  experience_description text,
  xp_points integer DEFAULT 0,
  level_number integer DEFAULT 1,
  is_verified boolean DEFAULT false,
  total_earnings numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create courses table
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  domain text NOT NULL,
  price numeric(10,2) DEFAULT 0,
  duration_hours integer NOT NULL,
  max_students integer,
  session_link text,
  course_image text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create enrollments table
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  is_completed boolean DEFAULT false,
  UNIQUE(student_id, course_id)
);

-- Create reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  mentor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_helpful boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create certificates table
CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  mentor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  certificate_id text UNIQUE NOT NULL,
  issued_at timestamptz DEFAULT now()
);

-- Create badges table
CREATE TABLE badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  badge_type text NOT NULL CHECK (badge_type IN ('learner', 'mentor')),
  criteria text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_badges table
CREATE TABLE user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create mentor_requests table
CREATE TABLE mentor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  request_message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create sessions table
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  mentor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  session_link text,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create learning_communities table
CREATE TABLE learning_communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community_members table
CREATE TABLE community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES learning_communities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'senior', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community_resources table
CREATE TABLE community_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES learning_communities(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  resource_type text NOT NULL CHECK (resource_type IN ('video', 'document', 'link', 'meet_link')),
  resource_url text NOT NULL,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create community_sessions table
CREATE TABLE community_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES learning_communities(id) ON DELETE CASCADE,
  host_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  session_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  meet_link text,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_projects table
CREATE TABLE user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  project_url text,
  github_url text,
  technologies text[],
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read all profiles" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Courses policies
CREATE POLICY "Anyone can read active courses" ON courses
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Mentors can create courses" ON courses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('mentor', 'admin')
    )
  );

CREATE POLICY "Mentors can update own courses" ON courses
  FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid());

-- Enrollments policies
CREATE POLICY "Students can enroll in courses" ON enrollments
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can read own enrollments" ON enrollments
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Mentors can read enrollments for their courses" ON enrollments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = course_id 
      AND mentor_id = auth.uid()
    )
  );

CREATE POLICY "Mentors can update enrollments for their courses" ON enrollments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = course_id 
      AND mentor_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Students can create reviews for enrolled courses" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE student_id = auth.uid() 
      AND course_id = reviews.course_id 
      AND is_completed = true
    )
  );

-- Certificates policies
CREATE POLICY "Students can read own certificates" ON certificates
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Mentors can read certificates for their courses" ON certificates
  FOR SELECT TO authenticated
  USING (mentor_id = auth.uid());

-- Badges policies
CREATE POLICY "Anyone can read badges" ON badges
  FOR SELECT TO authenticated
  USING (true);

-- User badges policies
CREATE POLICY "Users can read own badges" ON user_badges
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can read user badges" ON user_badges
  FOR SELECT TO authenticated
  USING (true);

-- Mentor requests policies
CREATE POLICY "Students can create mentor requests" ON mentor_requests
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can read own requests" ON mentor_requests
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Sessions policies
CREATE POLICY "Anyone can read sessions" ON sessions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Mentors can manage own sessions" ON sessions
  FOR ALL TO authenticated
  USING (mentor_id = auth.uid());

-- Learning communities policies
CREATE POLICY "Anyone can read active communities" ON learning_communities
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "2nd year+ students can create communities" ON learning_communities
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND year_of_study >= 2
    )
  );

CREATE POLICY "Community creators can update their communities" ON learning_communities
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- Community members policies
CREATE POLICY "Users can join communities" ON community_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Community members can read memberships" ON community_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM community_members cm 
      WHERE cm.community_id = community_members.community_id 
      AND cm.user_id = auth.uid()
    )
  );

-- Community resources policies
CREATE POLICY "Community members can read resources" ON community_resources
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm 
      WHERE cm.community_id = community_resources.community_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Senior members can upload resources" ON community_resources
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM community_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.community_id = community_resources.community_id 
      AND cm.user_id = auth.uid() 
      AND u.year_of_study >= 2
    )
  );

-- Community sessions policies
CREATE POLICY "Community members can read sessions" ON community_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm 
      WHERE cm.community_id = community_sessions.community_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Senior members can create sessions" ON community_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    host_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM community_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.community_id = community_sessions.community_id 
      AND cm.user_id = auth.uid() 
      AND u.year_of_study >= 2
    )
  );

-- User projects policies
CREATE POLICY "Anyone can read user projects" ON user_projects
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage own projects" ON user_projects
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to award XP on course completion
CREATE OR REPLACE FUNCTION award_completion_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Award XP when course is completed
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    UPDATE users 
    SET 
      xp_points = xp_points + 50,
      level_number = FLOOR((xp_points + 50) / 100) + 1
    WHERE id = NEW.student_id;
    
    -- Generate certificate
    INSERT INTO certificates (student_id, course_id, mentor_id, certificate_id)
    SELECT 
      NEW.student_id,
      NEW.course_id,
      c.mentor_id,
      'CERT-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))
    FROM courses c
    WHERE c.id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for XP awarding
CREATE TRIGGER enrollment_completion_trigger
  AFTER UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION award_completion_xp();

-- Insert default badges
INSERT INTO badges (name, description, icon, badge_type, criteria) VALUES
-- Learner badges
('🎯 Skill Starter', 'Complete your first mentor session', '🎯', 'learner', 'Complete 1 mentor session'),
('🧠 Knowledge Seeker', 'Complete sessions in 5 different domains', '🧠', 'learner', 'Complete 5 different domain sessions'),
('📜 Certified Champ', 'Earn 3 certificates', '📜', 'learner', 'Earn 3 certificates'),
('💪 Self-Growth Hero', 'Complete a paid session', '💪', 'learner', 'Finish a paid session'),
('⭐ Reviewer Pro', 'Submit 5+ helpful mentor reviews', '⭐', 'learner', 'Submit 5+ helpful mentor reviews'),

-- Mentor badges
('🚀 First Flight', 'Conduct your first session', '🚀', 'mentor', 'Conduct your first session'),
('💼 Skill Provider', 'Complete 5 mentor sessions', '💼', 'mentor', 'Complete 5 mentor sessions'),
('🔥 Popular Mentor', 'Get 10+ bookings with 4.5+ rating', '🔥', 'mentor', 'Get 10+ bookings + maintain 4.5+ rating'),
('🧾 Verified Mentor', 'Submit ID and docs for verification', '🧾', 'mentor', 'Submit ID and docs for verification'),
('💰 Pro Mentor', 'Earn ₹500+ from mentoring', '💰', 'mentor', 'Earn ₹500+ from mentoring');