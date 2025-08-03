/*
  # Fix user authentication and RLS policies

  1. Security Updates
    - Add policy for users to insert their own profile during signup
    - Update existing policies to handle edge cases
    
  2. Changes
    - Allow authenticated users to create their own profile
    - Ensure proper RLS policies for user operations
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to read all profiles (for mentor discovery, etc.)
CREATE POLICY "Users can read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);