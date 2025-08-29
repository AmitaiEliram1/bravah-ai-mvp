'use client'

import SupplierNavigation from '@/components/SupplierNavigation'

export default function AccessDeniedPage() {
  return (
    <>
      <SupplierNavigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-24">
        <div className="text-center">
          {/* Large warning icon */}
          <div className="text-8xl mb-8">🚫</div>
          
          {/* Main heading */}
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            Access Restricted
          </h1>
          
          {/* Subheading */}
          <h2 className="text-xl text-gray-700 mb-8">
            You can only access the tender page you were invited to
          </h2>
          
          {/* Explanation */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="text-red-800">
              <h3 className="font-semibold mb-3">Why am I seeing this?</h3>
              <ul className="text-left space-y-2">
                <li>• You may have modified the website URL manually</li>
                <li>• Your tender invitation link may have expired</li>
                <li>• You're trying to access pages you don't have permission for</li>
                <li>• The tender you were invited to may have been closed</li>
              </ul>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="text-blue-800">
              <h3 className="font-semibold mb-3">What should I do?</h3>
              <ul className="text-left space-y-2">
                <li>• Use the original tender invitation link from your email</li>
                <li>• Contact the tender creator if your link doesn't work</li>
                <li>• Don't modify the website URL in your browser</li>
              </ul>
            </div>
          </div>
          
          {/* Contact section */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Need to become a Bravah supplier?
            </h3>
            <button
              onClick={() => {
                const subject = encodeURIComponent("Access Issue - Tender Invitation")
                const body = encodeURIComponent("Hi,\\n\\nI'm having trouble accessing a tender invitation. Please help me resolve this issue.\\n\\nThank you,")
                window.open(`mailto:amitai.eli.eli@gmail.com?subject=${subject}&body=${body}`, '_blank')
              }}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📧 Contact Support
            </button>
          </div>
          
          {/* Security notice */}
          <div className="mt-12 text-xs text-gray-500">
            <p>🔒 This page is protected by Bravah security systems</p>
          </div>
        </div>
      </div>
    </>
  )
}