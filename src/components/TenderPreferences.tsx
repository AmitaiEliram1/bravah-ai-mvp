'use client'

import { useState } from 'react'

export interface TenderPreferencesData {
  deliveryPriority: number
  warrantyPriority: number
  qualityPriority: number
  pricePriority: number
}

interface TenderPreferencesProps {
  preferences: TenderPreferencesData
  onChange: (preferences: TenderPreferencesData) => void
}

export default function TenderPreferences({ preferences, onChange }: TenderPreferencesProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handlePriorityChange = (field: keyof TenderPreferencesData, value: number) => {
    onChange({
      ...preferences,
      [field]: value
    })
  }

  const PrioritySlider = ({ 
    label, 
    field, 
    description 
  }: { 
    label: string
    field: keyof TenderPreferencesData
    description: string 
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-blue-600 font-medium">
          {preferences[field] === 1 ? 'Low' : preferences[field] === 3 ? 'Medium' : 'High'}
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        value={preferences[field]}
        onChange={(e) => handlePriorityChange(field, parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  )

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tender Preferences</h3>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-6">
        Set your priorities to help rank suppliers by value, not just price. Higher priority means more weight in ranking.
      </div>

      {showAdvanced && (
        <div className="space-y-6">
          <PrioritySlider
            label="Delivery Time"
            field="deliveryPriority"
            description="How important is fast delivery to you?"
          />

          <PrioritySlider
            label="Warranty Terms"
            field="warrantyPriority"
            description="How important are extended warranty and support?"
          />

          <PrioritySlider
            label="Product Quality"
            field="qualityPriority"
            description="How important are quality standards and certifications?"
          />

          <PrioritySlider
            label="Price Competitiveness"
            field="pricePriority"
            description="How important is the lowest price vs other factors?"
          />

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Suppliers will be ranked based on their combined value score</li>
              <li>• Higher priority factors contribute more to the final ranking</li>
              <li>• Best overall value will appear first, not necessarily cheapest price</li>
            </ul>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}