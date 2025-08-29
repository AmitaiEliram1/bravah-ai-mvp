'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { paymentConditions } from '@/lib/utils'
import ImageUpload from '@/components/ImageUpload'
import TenderPreferences, { TenderPreferencesData } from '@/components/TenderPreferences'

interface Supplier {
  id: string
  name: string
  email: string
  whatsapp: string
}

interface TenderForm {
  productName: string
  units: number
  paymentCondition: string
  durationHours: number
  selectedSuppliers: string[]
  images: string[]
  preferences: TenderPreferencesData
}

export default function CreateTenderPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<TenderForm>({
    productName: '',
    units: 1,
    paymentCondition: paymentConditions[0],
    durationHours: 2,
    selectedSuppliers: [],
    images: [],
    preferences: {
      deliveryPriority: 3,
      warrantyPriority: 3,
      qualityPriority: 3,
      pricePriority: 4
    }
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      } else {
        setError('Failed to fetch suppliers')
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      setError('Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }

  const handleSupplierToggle = (supplierId: string) => {
    setForm(prev => ({
      ...prev,
      selectedSuppliers: prev.selectedSuppliers.includes(supplierId)
        ? prev.selectedSuppliers.filter(id => id !== supplierId)
        : [...prev.selectedSuppliers, supplierId]
    }))
  }

  const handleSelectAll = () => {
    setForm(prev => ({
      ...prev,
      selectedSuppliers: prev.selectedSuppliers.length === suppliers.length 
        ? [] 
        : suppliers.map(s => s.id)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (form.selectedSuppliers.length === 0) {
      setError('Please select at least one supplier')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (response.ok) {
        const tender = await response.json()
        router.push(`/tender/${tender.id}/monitor`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create tender')
      }
    } catch (error) {
      console.error('Error creating tender:', error)
      setError('Failed to create tender')
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Live Tender</h1>
        <p className="text-gray-600">Set up a new live bidding session for your suppliers</p>
      </div>

      {suppliers.length === 0 && (
        <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">No suppliers found</h3>
          <p className="text-yellow-700">
            You need to upload suppliers before creating a tender.{' '}
            <a href="/suppliers" className="underline font-medium">
              Go to My Suppliers
            </a>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tender Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                required
                value={form.productName}
                onChange={(e) => setForm(prev => ({ ...prev, productName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Units
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.units}
                onChange={(e) => setForm(prev => ({ ...prev, units: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Condition
              </label>
              <select
                value={form.paymentCondition}
                onChange={(e) => setForm(prev => ({ ...prev, paymentCondition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {paymentConditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (hours)
              </label>
              <select
                value={form.durationHours}
                onChange={(e) => setForm(prev => ({ ...prev, durationHours: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={4}>4 hours</option>
                <option value={8}>8 hours</option>
                <option value={24}>24 hours</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <ImageUpload 
              images={form.images}
              onImagesChange={(images) => setForm(prev => ({ ...prev, images }))}
              maxImages={4}
            />
          </div>
        </div>

        <TenderPreferences
          preferences={form.preferences}
          onChange={(preferences) => setForm(prev => ({ ...prev, preferences }))}
        />

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Select Suppliers</h2>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {form.selectedSuppliers.length === suppliers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {suppliers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No suppliers available. Please add suppliers first.
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    id={supplier.id}
                    checked={form.selectedSuppliers.includes(supplier.id)}
                    onChange={() => handleSupplierToggle(supplier.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={supplier.id} className="ml-3 flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-sm text-gray-600">{supplier.email}</div>
                      </div>
                      <div className="text-sm text-gray-500">{supplier.whatsapp}</div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {form.selectedSuppliers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>{form.selectedSuppliers.length}</strong> suppliers selected
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || suppliers.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Publishing...' : 'Publish Live Tender'}
          </button>
        </div>
      </form>
    </div>
  )
}