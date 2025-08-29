import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bids = await prisma.bid.findMany({
      where: { tenderId: id },
      include: {
        supplier: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(bids)
  } catch (error) {
    console.error('Error fetching bids:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { price, paymentCondition, units, notes, supplierId, deliveryDays, warrantyMonths, qualityScore } = await request.json()
    
    if (!price || !paymentCondition || !units || !supplierId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if tender is still active
    const tender = await prisma.tender.findUnique({
      where: { id }
    })

    if (!tender) {
      return NextResponse.json(
        { error: 'Tender not found' },
        { status: 404 }
      )
    }

    if (tender.status !== 'active' || new Date() > tender.expiresAt) {
      return NextResponse.json(
        { error: 'Tender is no longer active' },
        { status: 400 }
      )
    }

    // Check if supplier already has a bid for this tender
    const existingBid = await prisma.bid.findFirst({
      where: {
        tenderId: id,
        supplierId: supplierId
      }
    })

    if (existingBid) {
      // Update existing bid
      const updatedBid = await prisma.bid.update({
        where: { id: existingBid.id },
        data: {
          price: parseFloat(price),
          paymentCondition,
          units: parseInt(units),
          notes: notes || null,
          deliveryDays: deliveryDays ? parseInt(deliveryDays) : null,
          warrantyMonths: warrantyMonths ? parseInt(warrantyMonths) : null,
          qualityScore: qualityScore ? parseInt(qualityScore) : null
        },
        include: {
          supplier: {
            select: { name: true, email: true }
          }
        }
      })

      return NextResponse.json(updatedBid)
    } else {
      // Create new bid
      const bid = await prisma.bid.create({
        data: {
          tenderId: id,
          supplierId,
          price: parseFloat(price),
          paymentCondition,
          units: parseInt(units),
          notes: notes || null,
          deliveryDays: deliveryDays ? parseInt(deliveryDays) : null,
          warrantyMonths: warrantyMonths ? parseInt(warrantyMonths) : null,
          qualityScore: qualityScore ? parseInt(qualityScore) : null
        },
        include: {
          supplier: {
            select: { name: true, email: true }
          }
        }
      })

      return NextResponse.json(bid)
    }
  } catch (error) {
    console.error('Error creating/updating bid:', error)
    return NextResponse.json(
      { error: 'Failed to submit bid' },
      { status: 500 }
    )
  }
}