'use client'

import { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'

interface Supplier {
  id?: string
  name: string
  whatsapp: string
  email: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [editForm, setEditForm] = useState<Supplier>({ name: '', whatsapp: '', email: '' })
  const [updating, setUpdating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      setError('Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv') {
      setError('Please upload a CSV file')
      return
    }

    setUploading(true)
    setError(null)

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const csvData = results.data as any[]
          const validSuppliers: Supplier[] = []

          for (const row of csvData) {
            if (row.name && row.whatsapp && row.email) {
              validSuppliers.push({
                name: row.name.trim(),
                whatsapp: row.whatsapp.trim(),
                email: row.email.trim()
              })
            }
          }

          if (validSuppliers.length === 0) {
            setError('No valid supplier data found in CSV')
            setUploading(false)
            return
          }

          const response = await fetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suppliers: validSuppliers })
          })

          if (response.ok) {
            const newSuppliers = await response.json()
            setSuppliers(prev => [...prev, ...newSuppliers])
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          } else {
            const errorData = await response.json()
            setError(errorData.error || 'Failed to upload suppliers')
          }
        } catch (error) {
          console.error('Error processing CSV:', error)
          setError('Error processing CSV file')
        } finally {
          setUploading(false)
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error)
        setError('Error parsing CSV file')
        setUploading(false)
      }
    })
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return
    
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSuppliers(prev => prev.filter(s => s.id !== id))
      } else {
        setError('Failed to delete supplier')
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
      setError('Failed to delete supplier')
    }
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setEditForm({ 
      name: supplier.name, 
      whatsapp: supplier.whatsapp, 
      email: supplier.email 
    })
  }

  const handleUpdateSupplier = async () => {
    if (!editingSupplier?.id) return
    
    setUpdating(true)
    setError(null)

    try {
      const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const updatedSupplier = await response.json()
        setSuppliers(prev => prev.map(s => 
          s.id === editingSupplier.id ? updatedSupplier : s
        ))
        setEditingSupplier(null)
        setEditForm({ name: '', whatsapp: '', email: '' })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update supplier')
      }
    } catch (error) {
      console.error('Error updating supplier:', error)
      setError('Failed to update supplier')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingSupplier(null)
    setEditForm({ name: '', whatsapp: '', email: '' })
  }

  const downloadTemplate = () => {
    const csvContent = 'name,whatsapp,email\n"Supplier Name","+1234567890","supplier@example.com"'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'supplier-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Suppliers</h1>
          <p className="text-gray-600">Manage your supplier database</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Download Template
          </button>
          <label className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            {uploading ? 'Uploading...' : 'Upload CSV'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        {suppliers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers yet</h3>
            <p className="text-gray-600 mb-6">Upload a CSV file to get started</p>
            <div className="text-sm text-gray-500">
              <p>CSV format: name, whatsapp, email</p>
              <button 
                onClick={downloadTemplate}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Download template
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{supplier.whatsapp}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{supplier.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditSupplier(supplier)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => supplier.id && handleDeleteSupplier(supplier.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {suppliers.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>{suppliers.length}</strong> suppliers in your database
          </p>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Supplier</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={editForm.whatsapp}
                  onChange={(e) => setEditForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                disabled={updating}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSupplier}
                disabled={updating || !editForm.name || !editForm.whatsapp || !editForm.email}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? 'Updating...' : 'Update Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}