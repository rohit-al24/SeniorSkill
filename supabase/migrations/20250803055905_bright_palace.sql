/*
  # Add Learning Community Features

  1. New Tables
    - `learning_communities` - Communities created when seniors and juniors connect
    - `community_members` - Track members in each learning community
    - `community_resources` - Videos, meet links, and course materials uploaded by seniors
    - `community_sessions` - Scheduled sessions within communities

  2. Updates
    - Allow 2nd year students to create courses
    - Add course categories
    - Enhanced user profiles with social links and projects

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for community access
*/

-- Learning Communities table
CREATE TABLE IF NOT EXISTS learning_communities (
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

-- Community Members table
CREATE TABLE IF NOT EXISTS community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES learning_communities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'senior', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Community Resources table
CREATE TABLE IF NOT EXISTS community_resources (
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

-- Community Sessions table
CREATE TABLE IF NOT EXISTS community_sessions (
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

-- Add projects table for user profiles
CREATE TABLE IF NOT EXISTS user_projects (
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

-- Enable RLS on new tables
ALTER TABLE learning_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Learning Communities
CREATE POLICY "Anyone can read active communities"
  ON learning_communities FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "2nd year+ students can create communities"
  ON learning_communities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND year_of_study >= 2
    )
  );

CREATE POLICY "Community creators can update their communities"
  ON learning_communities FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for Community Members
CREATE POLICY "Community members can read memberships"
  ON community_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Community Resources
CREATE POLICY "Community members can read resources"
  ON community_resources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_resources.community_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Senior members can upload resources"
  ON community_resources FOR INSERT
  TO authenticated
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

-- RLS Policies for Community Sessions
CREATE POLICY "Community members can read sessions"
  ON community_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_sessions.community_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Senior members can create sessions"
  ON community_sessions FOR INSERT
  TO authenticated
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

-- RLS Policies for User Projects
CREATE POLICY "Anyone can read user projects"
  ON user_projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own projects"
  ON user_projects FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());