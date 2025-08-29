'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { formatTimeLeft } from '@/lib/utils'
import { rankBidsByValue } from '@/lib/scoring'

interface Tender {
  id: string
  productName: string
  units: number
  paymentCondition: string
  status: string
  expiresAt: string
  createdAt: string
  preferences?: string
  winningBidId?: string
}

interface Bid {
  id: string
  price: number
  paymentCondition: string
  units: number
  notes?: string
  deliveryDays?: number | null
  warrantyMonths?: number | null
  qualityScore?: number | null
  createdAt: string
  supplier: {
    name: string
    email: string
  }
  supplierId: string
}

interface TenderStats {
  totalBids: number
  averagePrice: number
  lowestBid: number
  participatingSuppliers: number
}

export default function TenderMonitorPage() {
  const params = useParams()
  const tenderId = params.id as string
  
  const [tender, setTender] = useState<Tender | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [stats, setStats] = useState<TenderStats>({
    totalBids: 0,
    averagePrice: 0,
    lowestBid: 0,
    participatingSuppliers: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [lockingBid, setLockingBid] = useState(false)

  useEffect(() => {
    fetchTenderData()
    const interval = setInterval(fetchTenderData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [tenderId])

  useEffect(() => {
    if (tender) {
      const interval = setInterval(() => {
        setTimeLeft(formatTimeLeft(new Date(tender.expiresAt)))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [tender])

  const fetchTenderData = async () => {
    try {
      const [tenderResponse, bidsResponse] = await Promise.all([
        fetch(`/api/tenders/${tenderId}`),
        fetch(`/api/tenders/${tenderId}/bids`)
      ])

      if (tenderResponse.ok && bidsResponse.ok) {
        const tenderData = await tenderResponse.json()
        const bidsData = await bidsResponse.json()
        
        setTender(tenderData)
        setBids(bidsData)
        
        // Calculate stats
        if (bidsData.length > 0) {
          const prices = bidsData.map((bid: Bid) => bid.price)
          const uniqueSuppliers = new Set(bidsData.map((bid: Bid) => bid.supplier.email)).size
          
          setStats({
            totalBids: bidsData.length,
            averagePrice: prices.reduce((a: number, b: number) => a + b, 0) / prices.length,
            lowestBid: Math.min(...prices),
            participatingSuppliers: uniqueSuppliers
          })
        }
      } else {
        setError('Failed to fetch tender data')
      }
    } catch (error) {
      console.error('Error fetching tender data:', error)
      setError('Failed to fetch tender data')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseTender = async () => {
    try {
      const response = await fetch(`/api/tenders/${tenderId}/close`, {
        method: 'POST'
      })
      
      if (response.ok) {
        fetchTenderData()
      }
    } catch (error) {
      console.error('Error closing tender:', error)
    }
  }

  const handleLockBid = async (bidId: string) => {
    const selectedBid = rankedBids.find(bid => bid.id === bidId)
    if (!selectedBid) return
    
    const confirmLock = window.confirm(
      `Are you sure you want to award this tender to ${selectedBid.supplier.name} for $${selectedBid.price.toFixed(2)}? This will close the tender and notify the winner.`
    )
    
    if (!confirmLock) return

    setLockingBid(true)
    try {
      const response = await fetch(`/api/tenders/${tenderId}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId })
      })
      
      if (response.ok) {
        setTender(prev => prev ? { ...prev, status: 'awarded', winningBidId: bidId } : null)
        await fetchTenderData() // Refresh data
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to award tender')
      }
    } catch (error) {
      console.error('Error awarding tender:', error)
      setError('Failed to award tender')
    } finally {
      setLockingBid(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !tender) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Tender</h2>
          <p className="text-gray-600">{error || 'Tender not found'}</p>
        </div>
      </div>
    )
  }

  // Use value-based ranking
  const defaultPreferences = {
    deliveryPriority: 3,
    warrantyPriority: 3,
    qualityPriority: 3,
    pricePriority: 4
  }

  let preferences = defaultPreferences
  if (tender?.preferences) {
    try {
      preferences = JSON.parse(tender.preferences)
    } catch (e) {
      console.warn('Failed to parse tender preferences, using defaults')
    }
  }

  const rankedBids = bids.length > 0 ? rankBidsByValue(bids, preferences) : []
  const bestBid = rankedBids[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{tender.productName}</h1>
            <p className="text-gray-600">Live Tender Monitor</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Status: <span className={`font-medium ${
                  tender.status === 'active' ? 'text-green-600' : 
                  tender.status === 'expired' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                </span>
              </div>
              {tender.status === 'active' && (
                <div className="text-lg font-semibold text-blue-600">
                  ⏰ {timeLeft}
                </div>
              )}
            </div>
            {tender.status === 'active' && (
              <button
                onClick={handleCloseTender}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Close Tender
              </button>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><strong>Units:</strong> {tender.units}</div>
            <div><strong>Payment:</strong> {tender.paymentCondition}</div>
            <div><strong>Started:</strong> {new Date(tender.createdAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-blue-600">{stats.totalBids}</div>
          <div className="text-sm text-gray-600">Total Bids</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-green-600">{stats.participatingSuppliers}</div>
          <div className="text-sm text-gray-600">Participating Suppliers</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-purple-600">
            ${stats.lowestBid > 0 ? stats.lowestBid.toFixed(2) : '0.00'}
          </div>
          <div className="text-sm text-gray-600">Best Bid</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-orange-600">
            ${stats.averagePrice > 0 ? stats.averagePrice.toFixed(2) : '0.00'}
          </div>
          <div className="text-sm text-gray-600">Average Price</div>
        </div>
      </div>

      {/* Best Bid Highlight */}
      {bestBid && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 mb-8 rounded-r-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">🏆 Current Best Bid</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-700">${bestBid.price.toFixed(2)}</div>
              <div className="text-green-600">{bestBid.supplier.name}</div>
            </div>
            <div className="text-sm text-green-700">
              <div><strong>Units:</strong> {bestBid.units}</div>
              <div><strong>Payment:</strong> {bestBid.paymentCondition}</div>
              <div><strong>Time:</strong> {new Date(bestBid.createdAt).toLocaleString()}</div>
            </div>
          </div>
          {bestBid.notes && (
            <div className="mt-3 p-3 bg-green-100 rounded">
              <strong>Notes:</strong> {bestBid.notes}
            </div>
          )}
          
          {/* Lock Bid Button */}
          {tender.status === 'active' && !tender.winningBidId && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleLockBid(bestBid.id)}
                disabled={lockingBid}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {lockingBid ? 'Awarding...' : '🏆 Award to This Supplier'}
              </button>
            </div>
          )}
          
          {tender.winningBidId === bestBid.id && (
            <div className="mt-4 p-3 bg-green-200 rounded-lg border border-green-300">
              <div className="flex items-center text-green-800">
                <span className="mr-2 text-xl">🎉</span>
                <strong>Winner! This supplier has been awarded the tender.</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Bids */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            All Bids ({bids.length})
          </h3>
        </div>
        
        {bids.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bids yet</h3>
            <p className="text-gray-600">Waiting for suppliers to submit their bids...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warranty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rankedBids.map((bid, index) => (
                  <tr key={bid.id} className={index === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index === 0 && <span className="mr-2">🏆</span>}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bid.supplier.name}</div>
                          <div className="text-sm text-gray-500">{bid.supplier.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-semibold ${index === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        ${bid.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bid.units}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bid.paymentCondition}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bid.deliveryDays ? `${bid.deliveryDays} days` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bid.warrantyMonths ? `${bid.warrantyMonths} mo` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bid.qualityScore ? `${bid.qualityScore}/5` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        index === 0 ? 'bg-green-100 text-green-800' : 
                        index === 1 ? 'bg-yellow-100 text-yellow-800' : 
                        index === 2 ? 'bg-orange-100 text-orange-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        #{bid.rank} {bid.score ? `(${(bid.score * 100).toFixed(1)}%)` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bid.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {bid.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tender.status === 'active' && !tender.winningBidId && (
                        <button
                          onClick={() => handleLockBid(bid.id)}
                          disabled={lockingBid}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {lockingBid ? 'Awarding...' : 'Award'}
                        </button>
                      )}
                      {tender.winningBidId === bid.id && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          🏆 Winner
                        </span>
                      )}
                      {tender.status === 'awarded' && tender.winningBidId !== bid.id && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}