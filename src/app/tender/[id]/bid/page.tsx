'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { formatTimeLeft, paymentConditions } from '@/lib/utils'
import SupplierNavigation from '@/components/SupplierNavigation'
import SupplierGuard from '@/components/SupplierGuard'

interface Tender {
  id: string
  productName: string
  units: number
  paymentCondition: string
  status: string
  expiresAt: string
  images?: string
}

interface Supplier {
  id: string
  name: string
  email: string
}

interface Bid {
  id?: string
  price: number
  paymentCondition: string
  units: number
  notes?: string
  deliveryDays?: number
  warrantyMonths?: number
  qualityScore?: number
}

interface CompetitiveBid {
  price: number
  rank: number
  isYours: boolean
}

export default function SupplierBidPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const tenderId = params.id as string
  const token = searchParams.get('token')

  const [tender, setTender] = useState<Tender | null>(null)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [currentBid, setCurrentBid] = useState<Bid | null>(null)
  const [competitiveBids, setCompetitiveBids] = useState<CompetitiveBid[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState('')
  
  const [form, setForm] = useState<Bid>({
    price: 0,
    paymentCondition: '',
    units: 1,
    notes: '',
    deliveryDays: 7,
    warrantyMonths: 12,
    qualityScore: 4
  })

  useEffect(() => {
    // Security warning in console
    console.clear()
    console.log(
      '%c🚫 SECURITY WARNING 🚫',
      'color: red; font-size: 20px; font-weight: bold;'
    )
    console.log(
      '%cThis is a restricted supplier portal. Unauthorized access attempts are logged and monitored.',
      'color: red; font-size: 12px;'
    )
    console.log(
      '%cIf you are a legitimate supplier, please use the invitation link from your email.',
      'color: orange; font-size: 12px;'
    )

    if (token) {
      validateInvitation()
    } else {
      setError('Invalid invitation link')
      setLoading(false)
    }
  }, [tenderId, token])

  // Show popup for closed/expired tenders
  useEffect(() => {
    if (tender && (tender.status !== 'active' || new Date() > new Date(tender.expiresAt))) {
      const timeoutId = setTimeout(() => {
        alert('⏰ This tender has closed or expired. You can no longer submit bids for this tender.')
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [tender])

  // Basic security measures (SupplierGuard handles most protection)
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      if (token) {
        e.preventDefault()
        return false
      }
    }

    // Block middle mouse button (open in new tab)
    const handleMouseDown = (e: MouseEvent) => {
      if (token && e.button === 1) {
        e.preventDefault()
        return false
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [token])

  useEffect(() => {
    if (tender && tender.status === 'active') {
      fetchCompetitiveBids()
      const interval = setInterval(fetchCompetitiveBids, 10000) // Update every 10 seconds
      return () => clearInterval(interval)
    }
  }, [tender])

  useEffect(() => {
    if (tender) {
      const interval = setInterval(() => {
        setTimeLeft(formatTimeLeft(new Date(tender.expiresAt)))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [tender])

  const validateInvitation = async () => {
    try {
      const response = await fetch(`/api/tender-invitation/validate?token=${token}&tenderId=${tenderId}`)
      
      if (response.ok) {
        const data = await response.json()
        setTender(data.tender)
        setSupplier(data.supplier)
        
        if (data.currentBid) {
          setCurrentBid(data.currentBid)
          setForm({
            price: data.currentBid.price,
            paymentCondition: data.currentBid.paymentCondition,
            units: data.currentBid.units,
            notes: data.currentBid.notes || ''
          })
        } else {
          setForm(prev => ({
            ...prev,
            paymentCondition: data.tender.paymentCondition,
            units: data.tender.units
          }))
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Invalid invitation')
      }
    } catch (error) {
      console.error('Error validating invitation:', error)
      setError('Failed to validate invitation')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompetitiveBids = async () => {
    try {
      const response = await fetch(`/api/tender-invitation/competitive-bids?token=${token}&tenderId=${tenderId}`)
      
      if (response.ok) {
        const data = await response.json()
        setCompetitiveBids(data)
      }
    } catch (error) {
      console.error('Error fetching competitive bids:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/tenders/${tenderId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          supplierId: supplier?.id
        })
      })

      if (response.ok) {
        const bid = await response.json()
        setCurrentBid(bid)
        fetchCompetitiveBids() // Refresh competitive data
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit bid')
      }
    } catch (error) {
      console.error('Error submitting bid:', error)
      setError('Failed to submit bid')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  if (error || !tender || !supplier) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  const isExpired = tender.status !== 'active' || new Date() > new Date(tender.expiresAt)
  const yourRank = competitiveBids.find(bid => bid.isYours)?.rank
  const lowestBid = competitiveBids.find(bid => bid.rank === 1)

  return (
    <SupplierGuard requiredToken={true}>
      <SupplierNavigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{tender.productName}</h1>
            <p className="text-gray-600">Live Tender Bidding</p>
          </div>
          {!isExpired && (
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">⏰ {timeLeft}</div>
              <div className="text-sm text-gray-500">Time Remaining</div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><strong>Units Required:</strong> {tender.units}</div>
            <div><strong>Preferred Payment:</strong> {tender.paymentCondition}</div>
            <div><strong>Your Company:</strong> {supplier.name}</div>
          </div>
        </div>

        {/* Product Images */}
        {tender.images && (() => {
          try {
            const images = JSON.parse(tender.images)
            if (images && images.length > 0) {
              return (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">📸 Product Images</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image: string, index: number) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={image}
                          alt={`${tender.productName} - Image ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => {
                            const modal = document.createElement('div')
                            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 cursor-pointer'
                            modal.onclick = () => modal.remove()
                            modal.innerHTML = `<img src="${image}" alt="Product Image" class="max-w-full max-h-full object-contain rounded-lg">`
                            document.body.appendChild(modal)
                          }}
                        />
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}/{images.length}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Click on any image to view full size</p>
                </div>
              )
            }
          } catch (e) {
            return null
          }
        })()}

        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-800">Tender Closed</h3>
            <p className="text-red-700">This tender is no longer accepting bids.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bidding Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentBid ? 'Update Your Bid' : 'Submit Your Bid'}
          </h2>
          
          {currentBid && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm">
                ✅ You have submitted a bid of <strong>${currentBid.price}</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Price (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  disabled={isExpired}
                  value={form.price}
                  onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Enter your price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  disabled={isExpired}
                  value={form.units}
                  onChange={(e) => setForm(prev => ({ ...prev, units: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms *
                </label>
                <select
                  required
                  disabled={isExpired}
                  value={form.paymentCondition}
                  onChange={(e) => setForm(prev => ({ ...prev, paymentCondition: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  {paymentConditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Time (days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    required
                    disabled={isExpired}
                    value={form.deliveryDays}
                    onChange={(e) => setForm(prev => ({ ...prev, deliveryDays: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="7"
                  />
                  <p className="text-xs text-gray-500 mt-1">How many days to deliver</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty (months) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    required
                    disabled={isExpired}
                    value={form.warrantyMonths}
                    onChange={(e) => setForm(prev => ({ ...prev, warrantyMonths: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="12"
                  />
                  <p className="text-xs text-gray-500 mt-1">Warranty duration</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Rating *
                  </label>
                  <select
                    required
                    disabled={isExpired}
                    value={form.qualityScore}
                    onChange={(e) => setForm(prev => ({ ...prev, qualityScore: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value={1}>1 - Basic</option>
                    <option value={2}>2 - Good</option>
                    <option value={3}>3 - High</option>
                    <option value={4}>4 - Premium</option>
                    <option value={5}>5 - Luxury</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Self-reported quality level</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  disabled={isExpired}
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Any special conditions or notes..."
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || isExpired}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : (currentBid ? 'Update Bid' : 'Submit Bid')}
            </button>
          </form>
        </div>

        {/* Live Competition */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Live Competition</h2>
          
          {competitiveBids.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👁️</div>
              <p>Be the first to bid!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowestBid && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-1">🏆 Current Best Offer</h3>
                  <div className="text-2xl font-bold text-green-700">
                    ${lowestBid.price.toFixed(2)}
                  </div>
                  {lowestBid.isYours && (
                    <div className="text-sm text-green-600 mt-1">That's your bid!</div>
                  )}
                </div>
              )}

              {yourRank && yourRank > 1 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-800">Your Position</h3>
                  <div className="text-lg font-bold text-yellow-700">
                    Rank #{yourRank} of {competitiveBids.length}
                  </div>
                  <div className="text-sm text-yellow-600 mt-1">
                    ${(lowestBid!.price - competitiveBids.find(b => b.isYours)!.price).toFixed(2)} above the leader
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">All Bids ({competitiveBids.length})</h4>
                <div className="space-y-2">
                  {competitiveBids.map((bid, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center p-3 rounded ${
                        bid.isYours ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        {bid.rank === 1 && <span className="mr-2">🏆</span>}
                        <span className="font-medium">#{bid.rank}</span>
                        {bid.isYours && <span className="ml-2 text-blue-600 text-sm">(You)</span>}
                      </div>
                      <div className="font-semibold">${bid.price.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">💡 Tips</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Prices update in real-time</li>
              <li>• You can update your bid anytime</li>
              <li>• Consider payment terms in your strategy</li>
              <li>• Lower bids rank higher</li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </SupplierGuard>
  )
}