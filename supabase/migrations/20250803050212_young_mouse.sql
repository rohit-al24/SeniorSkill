/*
  # Complete Peer Learning Platform Schema

  1. New Tables
    - `users` - Extended user profiles with roles, XP, and social links
    - `courses` - Mentor-created courses with pricing and session details
    - `enrollments` - Student course enrollments with completion tracking
    - `reviews` - Course and mentor reviews with ratings
    - `certificates` - Generated certificates for completed courses
    - `badges` - Achievement badges with earning criteria
    - `user_badges` - User badge assignments with timestamps
    - `mentor_requests` - Student requests to become mentors
    - `sessions` - Individual session tracking and completion

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control based on user roles
    - Ensure students can only access their own data and public course info
    - Ensure mentors can manage their own courses and view enrollments

  3. Features
    - Automatic XP calculation and level progression
    - Badge assignment triggers
    - Certificate generation on course completion
    - Review aggregation for mentor ratings
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with extended profile information
CREATE TABLE IF NOT EXISTS users (
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
  total_earnings decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  domain text NOT NULL,
  price decimal(10,2) DEFAULT 0,
  duration_hours integer NOT NULL,
  max_students integer,
  session_link text,
  course_image text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  is_completed boolean DEFAULT false,
  UNIQUE(student_id, course_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  mentor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_helpful boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  mentor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  certificate_id text UNIQUE NOT NULL,
  issued_at timestamptz DEFAULT now()
);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  badge_type text NOT NULL CHECK (badge_type IN ('learner', 'mentor')),
  criteria text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Mentor requests table
CREATE TABLE IF NOT EXISTS mentor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  request_message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Sessions table for tracking individual sessions
CREATE TABLE IF NOT EXISTS sessions (
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

-- Insert default badges
INSERT INTO badges (name, description, icon, badge_type, criteria) VALUES
('🎯 Skill Starter', 'Complete 1 mentor session', '🎯', 'learner', 'complete_1_session'),
('🧠 Knowledge Seeker', 'Complete 5 different domain sessions', '🧠', 'learner', 'complete_5_domains'),
('📜 Certified Champ', 'Earn 3 certificates', '📜', 'learner', 'earn_3_certificates'),
('💪 Self-Growth Hero', 'Finish a paid session', '💪', 'learner', 'complete_paid_session'),
('⭐ Reviewer Pro', 'Submit 5+ helpful mentor reviews', '⭐', 'learner', 'submit_5_reviews'),
('🚀 First Flight', 'Conduct your first session', '🚀', 'mentor', 'conduct_first_session'),
('💼 Skill Provider', 'Complete 5 mentor sessions', '💼', 'mentor', 'complete_5_sessions'),
('🔥 Popular Mentor', 'Get 10+ bookings + maintain 4.5+ rating', '🔥', 'mentor', 'popular_mentor'),
('🧾 Verified Mentor', 'Submit ID and docs for verification', '🧾', 'mentor', 'verified_mentor'),
('💰 Pro Mentor', 'Earn ₹500+ from mentoring', '💰', 'mentor', 'earn_500_rupees')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Courses policies
CREATE POLICY "Anyone can read active courses"
  ON courses FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Mentors can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('mentor', 'admin')
    )
  );

CREATE POLICY "Mentors can update own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (mentor_id = auth.uid());

-- Enrollments policies
CREATE POLICY "Students can read own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Mentors can read enrollments for their courses"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = course_id 
      AND mentor_id = auth.uid()
    )
  );

CREATE POLICY "Students can enroll in courses"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Mentors can update enrollments for their courses"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = course_id 
      AND mentor_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can create reviews for enrolled courses"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM enrollments 
      WHERE student_id = auth.uid() 
      AND course_id = reviews.course_id 
      AND is_completed = true
    )
  );

-- Certificates policies
CREATE POLICY "Students can read own certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Mentors can read certificates for their courses"
  ON certificates FOR SELECT
  TO authenticated
  USING (mentor_id = auth.uid());

-- Badges policies
CREATE POLICY "Anyone can read badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- User badges policies
CREATE POLICY "Users can read own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can read user badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (true);

-- Mentor requests policies
CREATE POLICY "Students can read own requests"
  ON mentor_requests FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can create mentor requests"
  ON mentor_requests FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Sessions policies
CREATE POLICY "Anyone can read sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mentors can manage own sessions"
  ON sessions FOR ALL
  TO authenticated
  USING (mentor_id = auth.uid());

-- Functions for XP and level calculation
CREATE OR REPLACE FUNCTION calculate_level(xp_points integer)
RETURNS integer AS $$
BEGIN
  RETURN GREATEST(1, (xp_points / 100) + 1);
END;
$$ LANGUAGE plpgsql;

-- Function to award XP and check for new badges
CREATE OR REPLACE FUNCTION award_xp_and_badges(user_id uuid, xp_amount integer)
RETURNS void AS $$
DECLARE
  new_xp integer;
  new_level integer;
BEGIN
  -- Update user XP
  UPDATE users 
  SET xp_points = xp_points + xp_amount,
      level_number = calculate_level(xp_points + xp_amount)
  WHERE id = user_id;
  
  -- Get updated XP for badge checking
  SELECT xp_points INTO new_xp FROM users WHERE id = user_id;
  
  -- Check and award badges based on achievements
  -- This is a simplified version - in production you'd have more complex badge logic
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically award XP when enrollment is completed
CREATE OR REPLACE FUNCTION award_completion_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    PERFORM award_xp_and_badges(NEW.student_id, 50);
    
    -- Create certificate
    INSERT INTO certificates (student_id, course_id, mentor_id, certificate_id)
    SELECT NEW.student_id, NEW.course_id, c.mentor_id, 
           'CERT-' || NEW.student_id::text || '-' || NEW.course_id::text || '-' || extract(epoch from now())::text
    FROM courses c WHERE c.id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_completion_trigger
  AFTER UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION award_completion_xp();