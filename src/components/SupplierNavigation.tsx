'use client'

export default function SupplierNavigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="text-xl font-bold text-blue-600">
              Bravah Supplier Portal
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Secure Bidding Platform
            </div>
            <button
              onClick={() => {
                const subject = encodeURIComponent("Interest in Joining Bravah as a Supplier")
                const body = encodeURIComponent("Hi,\n\nI want to join Bravah as a supplier!\n\nPlease provide me with information about becoming a supplier on your platform.\n\nThank you,")
                window.open(`mailto:amitai.eli.eli@gmail.com?subject=${subject}&body=${body}`, '_blank')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Join Bravah
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}