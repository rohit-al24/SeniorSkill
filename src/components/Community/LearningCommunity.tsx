import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Video, 
  FileText, 
  Link as LinkIcon, 
  Calendar,
  Plus,
  Search,
  Filter,
  Play,
  Download,
  ExternalLink
} from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface Community {
  id: string
  name: string
  description: string
  category: string
  created_by: string
  course_id: string
  is_active: boolean
  created_at: string
  creator?: {
    full_name: string
    year_of_study: number
  }
  course?: {
    title: string
    domain: string
  }
  member_count?: number
  is_member?: boolean
}

interface Resource {
  id: string
  title: string
  description: string
  resource_type: 'video' | 'document' | 'link' | 'meet_link'
  resource_url: string
  is_featured: boolean
  created_at: string
  uploader?: {
    full_name: string
    year_of_study: number
  }
}

export function LearningCommunity() {
  const { profile } = useAuthContext()
  const [communities, setCommunities] = useState<Community[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showCreateCommunity, setShowCreateCommunity] = useState(false)
  const [showAddResource, setShowAddResource] = useState(false)

  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: '',
    course_id: '',
  })

  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    resource_type: 'video' as const,
    resource_url: '',
    is_featured: false,
  })

  const categories = [
    'Python', 'JavaScript', 'React', 'UI/UX Design', 'Data Science', 
    'Machine Learning', 'Web Development', 'Mobile Development', 
    'DevOps', 'Cybersecurity', 'Resume Building', 'Interview Prep'
  ]

  useEffect(() => {
    fetchCommunities()
  }, [profile])

  useEffect(() => {
    if (selectedCommunity) {
      fetchResources(selectedCommunity.id)
    }
  }, [selectedCommunity])

  const fetchCommunities = async () => {
    try {
      setLoading(true)
      
      const { data: communitiesData, error } = await supabase
        .from('learning_communities')
        .select(`
          *,
          users!learning_communities_created_by_fkey (
            full_name,
            year_of_study
          ),
          courses (
            title,
            domain
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get member counts and check membership
      if (communitiesData && profile) {
        const communityIds = communitiesData.map(c => c.id)
        
        const [memberCountsRes, membershipsRes] = await Promise.all([
          supabase
            .from('community_members')
            .select('community_id')
            .in('community_id', communityIds),
          supabase
            .from('community_members')
            .select('community_id')
            .eq('user_id', profile.id)
            .in('community_id', communityIds)
        ])

        const memberCounts = memberCountsRes.data?.reduce((acc, member) => {
          acc[member.community_id] = (acc[member.community_id] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        const userMemberships = new Set(membershipsRes.data?.map(m => m.community_id) || [])

        const enrichedCommunities = communitiesData.map(community => ({
          ...community,
          creator: community.users,
          course: community.courses,
          member_count: memberCounts[community.id] || 0,
          is_member: userMemberships.has(community.id)
        }))

        setCommunities(enrichedCommunities)
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchResources = async (communityId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_resources')
        .select(`
          *,
          users!community_resources_uploaded_by_fkey (
            full_name,
            year_of_study
          )
        `)
        .eq('community_id', communityId)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setResources(data?.map(resource => ({
        ...resource,
        uploader: resource.users
      })) || [])
    } catch (error) {
      console.error('Error fetching resources:', error)
    }
  }

  const handleJoinCommunity = async (communityId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: profile.id,
          role: profile.year_of_study >= 2 ? 'senior' : 'member'
        })

      if (error) throw error
      fetchCommunities()
    } catch (error) {
      console.error('Error joining community:', error)
    }
  }

  const handleCreateCommunity = async () => {
    if (!profile || !newCommunity.name || !newCommunity.category) return

    try {
      const { data, error } = await supabase
        .from('learning_communities')
        .insert({
          ...newCommunity,
          created_by: profile.id,
        })
        .select()
        .single()

      if (error) throw error

      // Auto-join the creator
      await supabase
        .from('community_members')
        .insert({
          community_id: data.id,
          user_id: profile.id,
          role: 'admin'
        })

      setNewCommunity({
        name: '',
        description: '',
        category: '',
        course_id: '',
      })
      setShowCreateCommunity(false)
      fetchCommunities()
    } catch (error) {
      console.error('Error creating community:', error)
    }
  }

  const handleAddResource = async () => {
    if (!profile || !selectedCommunity || !newResource.title || !newResource.resource_url) return

    try {
      const { error } = await supabase
        .from('community_resources')
        .insert({
          community_id: selectedCommunity.id,
          uploaded_by: profile.id,
          ...newResource,
        })

      if (error) throw error

      setNewResource({
        title: '',
        description: '',
        resource_type: 'video',
        resource_url: '',
        is_featured: false,
      })
      setShowAddResource(false)
      fetchResources(selectedCommunity.id)
    } catch (error) {
      console.error('Error adding resource:', error)
    }
  }

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || community.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return Video
      case 'document': return FileText
      case 'link': return LinkIcon
      case 'meet_link': return Calendar
      default: return FileText
    }
  }

  if (selectedCommunity) {
    return (
      <div className="p-6 space-y-6">
        {/* Community Header */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedCommunity(null)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Communities
            </button>
            
            {profile?.year_of_study >= 2 && selectedCommunity.is_member && (
              <button
                onClick={() => setShowAddResource(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Resource</span>
              </button>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedCommunity.name}</h1>
          <p className="text-gray-600 mb-4">{selectedCommunity.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
              {selectedCommunity.category}
            </span>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{selectedCommunity.member_count} members</span>
            </div>
          </div>
        </div>

        {/* Add Resource Form */}
        {showAddResource && (
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Resource</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Resource Title"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                
                <select
                  value={newResource.resource_type}
                  onChange={(e) => setNewResource({ ...newResource, resource_type: e.target.value as any })}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                  <option value="link">Link</option>
                  <option value="meet_link">Meet Link</option>
                </select>
              </div>
              
              <textarea
                placeholder="Description"
                rows={3}
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <input
                type="url"
                placeholder="Resource URL"
                value={newResource.resource_url}
                onChange={(e) => setNewResource({ ...newResource, resource_url: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured-resource"
                  checked={newResource.is_featured}
                  onChange={(e) => setNewResource({ ...newResource, is_featured: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="featured-resource" className="text-sm text-gray-700">
                  Feature this resource
                </label>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleAddResource}
                  className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                >
                  Add Resource
                </button>
                
                <button
                  onClick={() => setShowAddResource(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => {
            const IconComponent = getResourceIcon(resource.resource_type)
            
            return (
              <div key={resource.id} className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">{resource.resource_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  {resource.is_featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    By {resource.uploader?.full_name} (Year {resource.uploader?.year_of_study})
                  </div>
                  
                  <a
                    href={resource.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    {resource.resource_type === 'video' ? <Play className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    <span>{resource.resource_type === 'video' ? 'Watch' : 'Open'}</span>
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        {resources.length === 0 && (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources yet</h3>
            <p className="text-gray-600">Senior members can add videos, documents, and meet links</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Communities</h1>
        <p className="text-gray-600">Join communities created by seniors and learn together</p>
      </div>

      {/* Filters and Create Button */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {profile?.year_of_study >= 2 && (
            <button
              onClick={() => setShowCreateCommunity(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Community</span>
            </button>
          )}
        </div>
      </div>

      {/* Create Community Form */}
      {showCreateCommunity && (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Community</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Community Name"
                value={newCommunity.name}
                onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <select
                value={newCommunity.category}
                onChange={(e) => setNewCommunity({ ...newCommunity, category: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <textarea
              placeholder="Community Description"
              rows={3}
              value={newCommunity.description}
              onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            
            <div className="flex space-x-4">
              <button
                onClick={handleCreateCommunity}
                className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              >
                Create Community
              </button>
              
              <button
                onClick={() => setShowCreateCommunity(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-gray-200 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map(community => (
            <div key={community.id} className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:shadow-lg transition-all cursor-pointer">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{community.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{community.description}</p>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  {community.category}
                </span>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{community.member_count}</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mb-4">
                Created by {community.creator?.full_name} (Year {community.creator?.year_of_study})
              </div>
              
              <div className="flex space-x-2">
                {community.is_member ? (
                  <button
                    onClick={() => setSelectedCommunity(community)}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-600 transition-colors"
                  >
                    Enter Community
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleJoinCommunity(community.id)}
                      className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-600 transition-colors"
                    >
                      Join Community
                    </button>
                    <button
                      onClick={() => setSelectedCommunity(community)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Preview
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No communities found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or create the first community!</p>
        </div>
      )}
    </div>
  )
}