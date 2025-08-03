import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Award, 
  Users, 
  TrendingUp, 
  Star,
  Calendar,
  DollarSign,
  Target,
  Clock,
  Trophy
} from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface DashboardStats {
  totalCourses: number
  completedCourses: number
  totalStudents: number
  averageRating: number
  totalEarnings: number
  totalBadges: number
}

export function Dashboard() {
  const { profile } = useAuthContext()
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedCourses: 0,
    totalStudents: 0,
    averageRating: 0,
    totalEarnings: 0,
    totalBadges: 0,
  })
  const [recentCourses, setRecentCourses] = useState([])
  const [recentBadges, setRecentBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchDashboardData()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      if (profile?.role === 'mentor') {
        // Fetch mentor stats
        const [coursesRes, studentsRes, reviewsRes, badgesRes] = await Promise.all([
          supabase.from('courses').select('*').eq('mentor_id', profile.id),
          supabase.from('enrollments').select('*').eq('mentor_id', profile.id),
          supabase.from('reviews').select('rating').eq('mentor_id', profile.id),
          supabase.from('user_badges').select('*, badges(*)').eq('user_id', profile.id)
        ])

        const totalCourses = coursesRes.data?.length || 0
        const totalStudents = studentsRes.data?.length || 0
        const ratings = reviewsRes.data?.map(r => r.rating) || []
        const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        
        setStats({
          totalCourses,
          completedCourses: 0,
          totalStudents,
          averageRating,
          totalEarnings: profile.total_earnings,
          totalBadges: badgesRes.data?.length || 0,
        })
      } else {
        // Fetch student stats
        const [enrollmentsRes, badgesRes] = await Promise.all([
          supabase.from('enrollments').select('*, courses(*)').eq('student_id', profile.id),
          supabase.from('user_badges').select('*, badges(*)').eq('user_id', profile.id)
        ])

        const enrollments = enrollmentsRes.data || []
        const completedCourses = enrollments.filter(e => e.is_completed).length

        setStats({
          totalCourses: enrollments.length,
          completedCourses,
          totalStudents: 0,
          averageRating: 0,
          totalEarnings: 0,
          totalBadges: badgesRes.data?.length || 0,
        })

        setRecentCourses(enrollments.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return null

  const levelProgress = ((profile.xp_points % 100) / 100) * 100
  const nextLevelXP = (profile.level_number * 100) - profile.xp_points

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile.full_name}!</h1>
            <p className="text-purple-100 mt-2">
              {profile.role === 'mentor' 
                ? "Ready to inspire and mentor today?" 
                : "Ready to learn something new today?"
              }
            </p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-sm opacity-80">Current Level</p>
              <p className="text-2xl font-bold">{profile.level_number}</p>
              <p className="text-xs opacity-80">{profile.xp_points} XP</p>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress to Level {profile.level_number + 1}</span>
            <span>{nextLevelXP} XP to go</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div 
              className="bg-white rounded-full h-3 transition-all duration-700"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {profile.role === 'mentor' ? (
          <>
            <StatCard
              title="Total Courses"
              value={stats.totalCourses}
              icon={BookOpen}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={Users}
              color="bg-green-500"
            />
            <StatCard
              title="Average Rating"
              value={stats.averageRating.toFixed(1)}
              icon={Star}
              color="bg-yellow-500"
              subtitle="out of 5.0"
            />
            <StatCard
              title="Total Earnings"
              value={`₹${stats.totalEarnings}`}
              icon={DollarSign}
              color="bg-purple-500"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Enrolled Courses"
              value={stats.totalCourses}
              icon={BookOpen}
              color="bg-blue-500"
            />
            <StatCard
              title="Completed"
              value={stats.completedCourses}
              icon={Target}
              color="bg-green-500"
            />
            <StatCard
              title="XP Points"
              value={profile.xp_points}
              icon={TrendingUp}
              color="bg-purple-500"
            />
            <StatCard
              title="Badges Earned"
              value={stats.totalBadges}
              icon={Trophy}
              color="bg-yellow-500"
            />
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Courses */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-500" />
            {profile.role === 'mentor' ? 'Recent Courses Created' : 'Recent Enrollments'}
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-200 rounded-lg h-16 animate-pulse" />
              ))}
            </div>
          ) : recentCourses.length > 0 ? (
            <div className="space-y-3">
              {recentCourses.map((course: any, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{course.courses?.title || course.title}</p>
                    <p className="text-sm text-gray-600">{course.courses?.domain || course.domain}</p>
                  </div>
                  {course.is_completed && (
                    <div className="text-green-600">
                      <Award className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              {profile.role === 'mentor' 
                ? 'No courses created yet. Create your first course!' 
                : 'No courses enrolled yet. Explore available courses!'}
            </p>
          )}
        </div>

        {/* Recent Achievements */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Recent Achievements
          </h3>
          
          {stats.totalBadges > 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl">🏆</div>
                  <div>
                    <p className="font-medium text-gray-900">Achievement Unlocked!</p>
                    <p className="text-sm text-gray-600">Keep up the great work</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No achievements yet</p>
              <p className="text-sm text-gray-400">Complete courses to earn your first badge!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}