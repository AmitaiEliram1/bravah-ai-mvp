import Link from 'next/link'
import { prisma } from '@/lib/db'

export default async function Home() {
  const stats = await getStats()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your suppliers and live tenders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Suppliers"
          value={stats.totalSuppliers}
          icon="👥"
          href="/suppliers"
        />
        <StatCard
          title="Active Tenders"
          value={stats.activeTenders}
          icon="📋"
          href="/create-tender"
        />
        <StatCard
          title="Completed Tenders"
          value={stats.completedTenders}
          icon="✅"
          href="/"
        />
        <StatCard
          title="Total Bids"
          value={stats.totalBids}
          icon="💰"
          href="/"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/suppliers"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl mr-3">📤</span>
              <div>
                <div className="font-medium text-gray-900">Upload Suppliers</div>
                <div className="text-sm text-gray-600">Import supplier list from CSV</div>
              </div>
            </Link>
            <Link
              href="/create-tender"
              className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl mr-3">🎯</span>
              <div>
                <div className="font-medium text-gray-900">Create Live Tender</div>
                <div className="text-sm text-gray-600">Start a new live bidding session</div>
              </div>
            </Link>
            <Link
              href="/profile"
              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-2xl mr-3">⚙️</span>
              <div>
                <div className="font-medium text-gray-900">Profile Settings</div>
                <div className="text-sm text-gray-600">Update profile and language</div>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-gray-500 text-center py-8">
            <p>No recent activity</p>
            <p className="text-sm mt-1">Start by uploading suppliers or creating a tender</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon, 
  href 
}: { 
  title: string
  value: number
  icon: string
  href: string
}) {
  return (
    <Link href={href} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <span className="text-3xl mr-4">{icon}</span>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Link>
  )
}

async function getStats() {
  try {
    const [totalSuppliers, activeTenders, completedTenders, totalBids] = await Promise.all([
      prisma.supplier.count(),
      prisma.tender.count({ where: { status: 'active' } }),
      prisma.tender.count({ where: { status: 'closed' } }),
      prisma.bid.count()
    ])

    return {
      totalSuppliers,
      activeTenders,
      completedTenders,
      totalBids
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      totalSuppliers: 0,
      activeTenders: 0,
      completedTenders: 0,
      totalBids: 0
    }
  }
}