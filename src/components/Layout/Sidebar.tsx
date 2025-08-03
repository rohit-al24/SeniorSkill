import React from 'react'
import { 
  Home, 
  BookOpen, 
  User, 
  Award, 
  Star, 
  PlusCircle, 
  Users,
  Settings,
  BarChart3,
  Crown
} from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { profile } = useAuthContext()

  if (!profile) return null

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-600' },
    { id: 'courses', label: 'Explore Courses', icon: BookOpen, color: 'text-green-600' },
    { id: 'my-courses', label: 'My Courses', icon: User, color: 'text-purple-600' },
    { id: 'achievements', label: 'Achievements', icon: Award, color: 'text-yellow-600' },
    { id: 'reviews', label: 'Reviews', icon: Star, color: 'text-orange-600' },
  ]

  // Add mentor-specific items
  if (profile.role === 'mentor' || profile.role === 'admin') {
    menuItems.splice(3, 0, 
      { id: 'create-course', label: 'Create Course', icon: PlusCircle, color: 'text-indigo-600' },
      { id: 'my-students', label: 'My Students', icon: Users, color: 'text-teal-600' }
    )
  }

  // Add admin-specific items
  if (profile.role === 'admin') {
    menuItems.push(
      { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-pink-600' },
      { id: 'mentor-requests', label: 'Mentor Requests', icon: Crown, color: 'text-red-600' }
    )
  }

  menuItems.push({ id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600' })

  return (
    <aside className="w-64 bg-white/10 backdrop-blur-lg border-r border-white/20 h-screen sticky top-16">
      <div className="p-6">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/20 shadow-lg transform scale-[1.02]' 
                    : 'hover:bg-white/10 hover:transform hover:scale-[1.01]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : item.color}`} />
                <span className={`font-medium ${isActive ? 'text-purple-700' : 'text-gray-700'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* User Role Badge */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-4 text-white">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium capitalize">{profile.role}</p>
              <p className="text-xs opacity-80">{profile.department}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}