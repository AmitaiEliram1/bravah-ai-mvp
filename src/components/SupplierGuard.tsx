'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SupplierGuardProps {
  children: React.ReactNode
  requiredToken?: boolean
}

export default function SupplierGuard({ children, requiredToken = true }: SupplierGuardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = searchParams.get('token')
    
    // Check if token is required and present
    if (requiredToken && !token) {
      router.replace('/access-denied')
      return
    }

    // Additional security checks
    const currentPath = window.location.pathname
    const adminPaths = ['/', '/suppliers', '/live-tenders', '/create-tender', '/profile']
    
    // Check if trying to access admin pages with supplier token
    if (token && adminPaths.some(path => currentPath === path || currentPath.startsWith(path))) {
      router.replace('/access-denied')
      return
    }

    // Enhanced URL monitoring (simplified)
    const monitorUrl = () => {
      const url = window.location.pathname
      if (token && adminPaths.some(path => url === path || url.startsWith(path))) {
        window.location.href = '/access-denied'
      }
    }

    // Monitor URL changes less frequently to avoid performance issues
    const interval = setInterval(monitorUrl, 1000)

    // Block keyboard shortcuts (simplified)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (token) {
        // Block common developer/navigation shortcuts
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C')) {
          e.preventDefault()
          return false
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, { passive: false })

    setIsAuthorized(true)
    setIsLoading(false)

    return () => {
      clearInterval(interval)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [requiredToken, router, searchParams])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect to access denied
  }

  return <>{children}</>
}