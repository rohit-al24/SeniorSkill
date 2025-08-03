import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  DollarSign,
  Search,
  Filter,
  Heart,
  Play
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'

interface Course {
  id: string
  title: string
  description: string
  domain: string
  price: number
  duration_hours: number
  max_students?: number
  course_image?: string
  mentor_id: string
  mentor?: {
    full_name: string
    profile_picture?: string
    is_verified: boolean
  }
  enrollments?: { count: number }[]
  reviews?: { rating: number }[]
  is_enrolled?: boolean
}

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('')
  const [priceFilter, setPriceFilter] = useState('')
  const { profile } = useAuthContext()

  const domains = [
    'Python', 'JavaScript', 'React', 'UI/UX Design', 'Data Science', 
    'Machine Learning', 'Web Development', 'Mobile Development', 
    'DevOps', 'Cybersecurity', 'Resume Building', 'Interview Prep'
  ]

  useEffect(() => {
    fetchCourses()
  }, [profile])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      
      // Fetch courses with mentor info and enrollment count
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`
          *,
          users!courses_mentor_id_fkey (
            full_name,
            profile_picture,
            is_verified
          ),
          enrollments (count),
          reviews (rating)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Check enrollment status for current user
      if (profile && coursesData) {
        const courseIds = coursesData.map(c => c.id)
        const { data: enrollmentData } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', profile.id)
          .in('course_id', courseIds)

        const enrolledCourseIds = new Set(enrollmentData?.map(e => e.course_id) || [])

        const coursesWithEnrollment = coursesData.map(course => ({
          ...course,
          mentor: course.users,
          is_enrolled: enrolledCourseIds.has(course.id)
        }))

        setCourses(coursesWithEnrollment)
      } else {
        setCourses(coursesData?.map(course => ({
          ...course,
          mentor: course.users,
          is_enrolled: false
        })) || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: profile.id,
          course_id: courseId
        })

      if (error) throw error

      // Refresh courses to update enrollment status
      fetchCourses()
    } catch (error) {
      console.error('Error enrolling in course:', error)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.domain.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDomain = !selectedDomain || course.domain === selectedDomain
    
    const matchesPrice = !priceFilter || 
                        (priceFilter === 'free' && course.price === 0) ||
                        (priceFilter === 'paid' && course.price > 0)

    return matchesSearch && matchesDomain && matchesPrice
  })

  const CourseCard = ({ course }: { course: Course }) => {
    const averageRating = course.reviews?.length 
      ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length 
      : 0
    
    const enrollmentCount = course.enrollments?.[0]?.count || 0

    return (
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:shadow-xl transition-all duration-300 group">
        {/* Course Image */}
        <div className="relative h-48 bg-gradient-to-r from-purple-500 to-blue-500">
          {course.course_image ? (
            <img 
              src={course.course_image} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          )}
          
          {/* Price Badge */}
          <div className="absolute top-4 right-4">
            <div className="bg-black/20 backdrop-blur-lg rounded-full px-3 py-1 text-white text-sm font-medium">
              {course.price === 0 ? 'Free' : `₹${course.price}`}
            </div>
          </div>

          {/* Domain Tag */}
          <div className="absolute top-4 left-4">
            <div className="bg-white/20 backdrop-blur-lg rounded-full px-3 py-1 text-white text-xs font-medium">
              {course.domain}
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
            {course.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {course.description}
          </p>

          {/* Mentor Info */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              {course.mentor?.profile_picture ? (
                <img 
                  src={course.mentor.profile_picture} 
                  alt={course.mentor.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <Users className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 flex items-center">
                {course.mentor?.full_name}
                {course.mentor?.is_verified && (
                  <span className="ml-1 text-blue-500">✓</span>
                )}
              </p>
            </div>
          </div>

          {/* Course Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{course.duration_hours}h</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{enrollmentCount}</span>
              </div>
              {averageRating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex space-x-2">
            {course.is_enrolled ? (
              <button className="flex-1 bg-green-500 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-green-600 transition-colors">
                <Play className="w-4 h-4" />
                <span>Continue Learning</span>
              </button>
            ) : (
              <button 
                onClick={() => handleEnroll(course.id)}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all"
              >
                Enroll Now
              </button>
            )}
            
            <button className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Courses</h1>
        <p className="text-gray-600">Discover amazing courses from talented mentors</p>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Domain Filter */}
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Domains</option>
            {domains.map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>

          {/* Price Filter */}
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>

          {/* Filter Button */}
          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-gray-200 rounded-2xl h-96 animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  )
}