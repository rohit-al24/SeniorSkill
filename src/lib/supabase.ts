import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          year_of_study: number
          department: string
          role: 'student' | 'mentor' | 'admin'
          profile_picture?: string
          bio?: string
          linkedin_url?: string
          github_url?: string
          portfolio_url?: string
          experience_description?: string
          xp_points: number
          level_number: number
          is_verified: boolean
          total_earnings: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          year_of_study?: number
          department: string
          role?: 'student' | 'mentor' | 'admin'
          profile_picture?: string
          bio?: string
          linkedin_url?: string
          github_url?: string
          portfolio_url?: string
          experience_description?: string
          xp_points?: number
          level_number?: number
          is_verified?: boolean
          total_earnings?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          year_of_study?: number
          department?: string
          role?: 'student' | 'mentor' | 'admin'
          profile_picture?: string
          bio?: string
          linkedin_url?: string
          github_url?: string
          portfolio_url?: string
          experience_description?: string
          xp_points?: number
          level_number?: number
          is_verified?: boolean
          total_earnings?: number
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          mentor_id: string
          title: string
          description: string
          domain: string
          price: number
          duration_hours: number
          max_students?: number
          session_link?: string
          course_image?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mentor_id: string
          title: string
          description: string
          domain: string
          price?: number
          duration_hours: number
          max_students?: number
          session_link?: string
          course_image?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mentor_id?: string
          title?: string
          description?: string
          domain?: string
          price?: number
          duration_hours?: number
          max_students?: number
          session_link?: string
          course_image?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          enrolled_at: string
          completed_at?: string
          is_completed: boolean
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          enrolled_at?: string
          completed_at?: string
          is_completed?: boolean
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          enrolled_at?: string
          completed_at?: string
          is_completed?: boolean
        }
      }
      reviews: {
        Row: {
          id: string
          student_id: string
          course_id: string
          mentor_id: string
          rating: number
          review_text?: string
          is_helpful: boolean
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          mentor_id: string
          rating: number
          review_text?: string
          is_helpful?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          mentor_id?: string
          rating?: number
          review_text?: string
          is_helpful?: boolean
          created_at?: string
        }
      }
      certificates: {
        Row: {
          id: string
          student_id: string
          course_id: string
          mentor_id: string
          certificate_id: string
          issued_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          mentor_id: string
          certificate_id: string
          issued_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          mentor_id?: string
          certificate_id?: string
          issued_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          badge_type: 'learner' | 'mentor'
          criteria: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          badge_type: 'learner' | 'mentor'
          criteria: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          badge_type?: 'learner' | 'mentor'
          criteria?: string
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
      mentor_requests: {
        Row: {
          id: string
          student_id: string
          request_message?: string
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string
          reviewed_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          request_message?: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string
          reviewed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          request_message?: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string
          reviewed_at?: string
          created_at?: string
        }
      }
    }
  }
}