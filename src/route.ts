import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const [totalSuppliers, activeTenders, completedTenders, totalBids] = await Promise.all([
      prisma.supplier.count({
        where: { userId }
      }),
      prisma.tender.count({
        where: { userId, status: 'active' }
      }),
      prisma.tender.count({
        where: { userId, status: 'closed' }
      }),
      prisma.bid.count({
        where: {
          tender: { userId }
        }
      })
    ])

    return NextResponse.json({
      totalSuppliers,
      activeTenders,
      completedTenders,
      totalBids
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}