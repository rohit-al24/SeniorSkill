import React, { useState } from 'react'
import { Upload, BookOpen, DollarSign, Clock, Users, Link } from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export function CreateCourse() {
  const { profile } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '',
    price: 0,
    duration_hours: 1,
    max_students: '',
    session_link: '',
    course_image: '',
  })

  const domains = [
    'Python', 'JavaScript', 'React', 'UI/UX Design', 'Data Science', 
    'Machine Learning', 'Web Development', 'Mobile Development', 
    'DevOps', 'Cybersecurity', 'Resume Building', 'Interview Prep'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          mentor_id: profile.id,
          title: formData.title,
          description: formData.description,
          domain: formData.domain,
          price: formData.price,
          duration_hours: formData.duration_hours,
          max_students: formData.max_students ? parseInt(formData.max_students) : null,
          session_link: formData.session_link,
          course_image: formData.course_image || null,
        })

      if (error) throw error

      // Reset form
      setFormData({
        title: '',
        description: '',
        domain: '',
        price: 0,
        duration_hours: 1,
        max_students: '',
        session_link: '',
        course_image: '',
      })

      alert('Course created successfully!')
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Error creating course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (profile?.role !== 'mentor' && profile?.role !== 'admin') {
    // Allow 2nd year+ students to create courses
    if (profile?.year_of_study < 2) {
      return (
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <BookOpen className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">2nd Year+ Required</h3>
            <p className="text-gray-600 mb-4">
              You need to be in 2nd year or above to create courses and mentor juniors.
            </p>
            <button className="bg-purple-500 text-white px-6 py-2 rounded-xl hover:bg-purple-600 transition-colors">
              Request Early Access
            </button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Course</h1>
        <p className="text-gray-600">Share your knowledge and help others learn</p>
      </div>

      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Complete Python for Beginners"
            />
          </div>

          {/* Course Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe what students will learn in this course..."
            />
          </div>

          {/* Domain and Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain *
              </label>
              <select
                required
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a domain</option>
                {domains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0 for free course"
                />
              </div>
            </div>
          </div>

          {/* Duration and Max Students Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (hours) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 1 })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Duration in hours"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Students (optional)
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  min="1"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>
          </div>

          {/* Session Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Link (Google Meet, Zoom, etc.)
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="url"
                value={formData.session_link}
                onChange={(e) => setFormData({ ...formData, session_link: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://meet.google.com/..."
              />
            </div>
          </div>

          {/* Course Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Image URL (optional)
            </label>
            <div className="relative">
              <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="url"
                value={formData.course_image}
                onChange={(e) => setFormData({ ...formData, course_image: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {formData.course_image && (
              <div className="mt-2">
                <img 
                  src={formData.course_image} 
                  alt="Course preview"
                  className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Course...' : 'Create Course'}
            </button>
            
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Save as Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}