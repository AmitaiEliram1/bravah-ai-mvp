import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rankBidsByValue } from '@/lib/scoring'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const tenderId = searchParams.get('tenderId')

  if (!token || !tenderId) {
    return NextResponse.json(
      { error: 'Missing token or tender ID' },
      { status: 400 }
    )
  }

  try {
    // Validate invitation
    const invitation = await prisma.tenderInvitation.findFirst({
      where: {
        tenderId,
        inviteLink: {
          contains: token
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 404 }
      )
    }

    // Get tender with preferences
    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
      select: { preferences: true }
    })

    // Get all bids for this tender
    const bids = await prisma.bid.findMany({
      where: { tenderId },
      select: {
        id: true,
        price: true,
        supplierId: true,
        deliveryDays: true,
        warrantyMonths: true,
        qualityScore: true
      }
    })

    // Use default preferences if not set
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

    // Rank bids using value-based algorithm
    const rankedBids = rankBidsByValue(bids, preferences)

    // Create anonymous competitive data
    const competitiveBids = rankedBids.map((bid) => ({
      price: bid.price,
      rank: bid.rank,
      score: bid.score,
      isYours: bid.supplierId === invitation.supplierId
    }))

    return NextResponse.json(competitiveBids)
  } catch (error) {
    console.error('Error fetching competitive bids:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitive data' },
      { status: 500 }
    )
  }
}