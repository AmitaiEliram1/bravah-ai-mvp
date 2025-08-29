import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWinnerNotification } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { bidId } = await request.json()

    if (!bidId) {
      return NextResponse.json(
        { error: 'Missing bid ID' },
        { status: 400 }
      )
    }

    // Verify the bid exists and belongs to this tender
    const bid = await prisma.bid.findFirst({
      where: {
        id: bidId,
        tenderId: id
      },
      include: {
        supplier: true,
        tender: true
      }
    })

    if (!bid) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      )
    }

    // Check if tender is still active
    if (bid.tender.status !== 'active') {
      return NextResponse.json(
        { error: 'Tender is no longer active' },
        { status: 400 }
      )
    }

    // Update tender with winning bid and award status
    const updatedTender = await prisma.tender.update({
      where: { id },
      data: {
        winningBidId: bidId,
        status: 'awarded'
      }
    })

    // Send winner notification email
    try {
      await sendWinnerNotification(
        bid.supplier.email,
        bid.supplier.name,
        {
          productName: bid.tender.productName,
          units: bid.tender.units,
          winningPrice: bid.price,
          paymentCondition: bid.paymentCondition,
          deliveryDays: bid.deliveryDays,
          warrantyMonths: bid.warrantyMonths
        }
      )
    } catch (emailError) {
      console.error('Failed to send winner notification:', emailError)
      // Don't fail the award process if email fails
    }

    return NextResponse.json({
      message: 'Tender awarded successfully',
      tender: updatedTender,
      winningBid: bid
    })
  } catch (error) {
    console.error('Error awarding tender:', error)
    return NextResponse.json(
      { error: 'Failed to award tender' },
      { status: 500 }
    )
  }
}