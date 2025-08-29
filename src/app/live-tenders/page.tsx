'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatTimeLeft } from '@/lib/utils'

interface Tender {
  id: string
  productName: string
  units: number
  paymentCondition: string
  status: string
  durationHours: number
  expiresAt: string
  createdAt: string
  _count: {
    bids: number
    invitations: number
  }
}

export default function LiveTendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTenders()
    const interval = setInterval(fetchTenders, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchTenders = async () => {
    try {
      const response = await fetch('/api/tenders')
      if (response.ok) {
        const data = await response.json()
        setTenders(data)
      } else {
        setError('Failed to fetch tenders')
      }
    } catch (error) {
      console.error('Error fetching tenders:', error)
      setError('Failed to fetch tenders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (tender: Tender) => {
    if (tender.status === 'active' && new Date(tender.expiresAt) > new Date()) {
      return 'bg-green-100 text-green-800'
    } else if (tender.status === 'expired' || new Date(tender.expiresAt) <= new Date()) {
      return 'bg-red-100 text-red-800'
    } else if (tender.status === 'closed') {
      return 'bg-gray-100 text-gray-800'
    }
    return 'bg-blue-100 text-blue-800'
  }

  const getStatusText = (tender: Tender) => {
    if (tender.status === 'active' && new Date(tender.expiresAt) > new Date()) {
      return 'Live'
    } else if (new Date(tender.expiresAt) <= new Date()) {
      return 'Expired'
    }
    return tender.status.charAt(0).toUpperCase() + tender.status.slice(1)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Tenders</h1>
          <p className="text-gray-600">Monitor all your active and completed tenders</p>
        </div>
        <Link
          href="/create-tender"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Tender
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {tenders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tenders yet</h3>
          <p className="text-gray-600 mb-6">Create your first live tender to get started</p>
          <Link
            href="/create-tender"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Live Tender
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {tenders.map((tender) => (
            <div key={tender.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 mr-3">
                      {tender.productName}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tender)}`}>
                      {getStatusText(tender)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div><strong>Units:</strong> {tender.units}</div>
                    <div><strong>Payment:</strong> {tender.paymentCondition}</div>
                    <div><strong>Duration:</strong> {tender.durationHours}h</div>
                    <div><strong>Created:</strong> {new Date(tender.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                
                {tender.status === 'active' && new Date(tender.expiresAt) > new Date() && (
                  <div className="text-right">
                    <div className="text-lg font-semibold text-red-600">
                      ⏰ {formatTimeLeft(new Date(tender.expiresAt))}
                    </div>
                    <div className="text-sm text-gray-500">Time Left</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{tender._count.invitations}</div>
                  <div className="text-sm text-blue-800">Suppliers Invited</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{tender._count.bids}</div>
                  <div className="text-sm text-green-800">Bids Received</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {tender._count.bids > 0 ? Math.round((tender._count.bids / tender._count.invitations) * 100) : 0}%
                  </div>
                  <div className="text-sm text-purple-800">Response Rate</div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href={`/tender/${tender.id}/monitor`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Monitor Results
                </Link>
                {tender.status === 'active' && new Date(tender.expiresAt) > new Date() && (
                  <button
                    onClick={async () => {
                      try {
                        await fetch(`/api/tenders/${tender.id}/close`, { method: 'POST' })
                        fetchTenders() // Refresh the list
                      } catch (error) {
                        console.error('Error closing tender:', error)
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Close Tender
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}