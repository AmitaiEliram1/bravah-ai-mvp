import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tender = await prisma.tender.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true }
        },
        _count: {
          select: { bids: true, invitations: true }
        }
      }
    })

    if (!tender) {
      return NextResponse.json(
        { error: 'Tender not found' },
        { status: 404 }
      )
    }

    // Check if tender has expired
    if (tender.status === 'active' && new Date() > tender.expiresAt) {
      await prisma.tender.update({
        where: { id },
        data: { status: 'expired' }
      })
      tender.status = 'expired'
    }

    return NextResponse.json(tender)
  } catch (error) {
    console.error('Error fetching tender:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tender' },
      { status: 500 }
    )
  }
}