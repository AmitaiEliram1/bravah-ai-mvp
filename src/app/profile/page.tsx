'use client'

import { useState, useEffect } from 'react'

interface UserProfile {
  id: string
  name: string
  email: string
  language: string
}

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    id: 'default-user-id',
    name: '',
    email: '',
    language: 'en'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [devToolsVisible, setDevToolsVisible] = useState(false)

  useEffect(() => {
    fetchProfile()
    // Check if React DevTools are available
    setDevToolsVisible(!!window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      } else {
        // If no profile exists, create default values
        setProfile({
          id: 'default-user-id',
          name: 'Administrator',
          email: 'admin@bravah.com',
          language: 'en'
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const toggleDevTools = () => {
    const devToolsOverlay = document.querySelector('[data-react-devtools-portal-root]') as HTMLElement
    if (devToolsOverlay) {
      if (devToolsOverlay.style.display === 'none') {
        devToolsOverlay.style.display = 'block'
      } else {
        devToolsOverlay.style.display = 'none'
      }
    }
    
    // Try alternative React DevTools detection
    const devToolsRoot = document.querySelector('#react-devtools-container') as HTMLElement
    if (devToolsRoot) {
      if (devToolsRoot.style.display === 'none') {
        devToolsRoot.style.display = 'block'
      } else {
        devToolsRoot.style.display = 'none'
      }
    }

    // If no existing overlay found, try to trigger React DevTools
    if (!devToolsOverlay && !devToolsRoot && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      // Create a temporary element to show DevTools info
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'fixed'
      tempDiv.style.top = '10px'
      tempDiv.style.right = '10px'
      tempDiv.style.backgroundColor = '#333'
      tempDiv.style.color = 'white'
      tempDiv.style.padding = '10px'
      tempDiv.style.borderRadius = '5px'
      tempDiv.style.zIndex = '9999'
      tempDiv.innerHTML = `
        <div>React DevTools Available</div>
        <div style="font-size: 12px; margin-top: 5px;">
          Open browser DevTools (F12) and look for "Components" and "Profiler" tabs
        </div>
        <button onclick="this.parentElement.remove()" style="margin-top: 5px; padding: 2px 6px; cursor: pointer;">Close</button>
      `
      document.body.appendChild(tempDiv)
      
      setTimeout(() => {
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv)
        }
      }, 5000)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={profile.email}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language / שפה
            </label>
            <select
              value={profile.language}
              onChange={(e) => setProfile(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="he">עברית (Hebrew)</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Choose your preferred language for the interface
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">✅ Profile updated successfully!</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">System Information</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div><strong>Version:</strong> Bravah MVP v1.0</div>
          <div><strong>Current Language:</strong> {profile.language === 'en' ? 'English' : 'עברית'}</div>
          <div><strong>Time Zone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
        </div>
      </div>

      {/* Developer Tools Section */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🛠️ Developer Tools</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">React DevTools</div>
              <div className="text-sm text-gray-600">
                {devToolsVisible ? 
                  'React DevTools are available in your browser' : 
                  'React DevTools not detected'
                }
              </div>
            </div>
            <button
              onClick={toggleDevTools}
              disabled={!devToolsVisible}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                devToolsVisible
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {devToolsVisible ? 'Toggle DevTools' : 'Not Available'}
            </button>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => console.clear()}
                className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Clear Console</div>
                <div className="text-sm text-gray-600">Clear browser console logs</div>
              </button>
              <button
                onClick={() => {
                  console.log('🎯 Bravah App Debug Info:', {
                    profile,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                  })
                }}
                className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Log Debug Info</div>
                <div className="text-sm text-gray-600">Print debug info to console</div>
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-100 rounded p-3">
            <strong>Note:</strong> Developer tools are available in development mode. 
            Press F12 to open browser DevTools and look for "Components" and "Profiler" tabs if React DevTools are installed.
          </div>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">📧 Email Configuration Required</h4>
        <p className="text-yellow-700 text-sm">
          To send tender invitations to suppliers, configure your email settings in the system environment variables:
          SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.
        </p>
      </div>
    </div>
  )
}