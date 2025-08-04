import React, { useState } from 'react'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import { AuthForm } from './components/Auth/AuthForm'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { Dashboard } from './components/Dashboard/Dashboard'
import { CourseList } from './components/Courses/CourseList'
import { CreateCourse } from './components/Courses/CreateCourse'
import { UserProfile } from './components/Profile/UserProfile'
import { LearningCommunity } from './components/Community/LearningCommunity'

function AppContent() {
  const { user, profile, loading, error } = useAuthContext()
  const [activeView, setActiveView] = useState('dashboard')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <div className="w-8 h-8 bg-white rounded-lg" />
          </div>
          <p className="text-gray-600 mb-4">Loading your account...</p>
          <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 bg-white rounded-lg" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-500 text-white px-6 py-2 rounded-xl hover:bg-purple-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <AuthForm />
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />
      case 'courses':
        return <CourseList />
      case 'create-course':
        return <CreateCourse />
      case 'profile':
        return <UserProfile />
      case 'community':
        return <LearningCommunity />
      case 'my-courses':
        return <div className="p-6">My Courses (Coming Soon)</div>
      case 'achievements':
        return <div className="p-6">Achievements (Coming Soon)</div>
      case 'reviews':
        return <div className="p-6">Reviews (Coming Soon)</div>
      case 'my-students':
        return <div className="p-6">My Students (Coming Soon)</div>
      case 'analytics':
        return <div className="p-6">Analytics (Coming Soon)</div>
      case 'mentor-requests':
        return <div className="p-6">Mentor Requests (Coming Soon)</div>
      case 'settings':
        return <div className="p-6">Settings (Coming Soon)</div>
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
      <Header />
      <div className="flex">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App