import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
    const invitation = await prisma.tenderInvitation.findFirst({
      where: {
        tenderId,
        inviteLink: {
          contains: token
        }
      },
      include: {
        tender: true,
        supplier: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      )
    }

    // Update invitation status to viewed
    await prisma.tenderInvitation.update({
      where: { id: invitation.id },
      data: { status: 'viewed' }
    })

    // Check if supplier already has a bid
    const currentBid = await prisma.bid.findFirst({
      where: {
        tenderId,
        supplierId: invitation.supplierId
      }
    })

    return NextResponse.json({
      tender: invitation.tender,
      supplier: invitation.supplier,
      currentBid
    })
  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    )
  }
}