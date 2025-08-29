import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateInviteLink } from '@/lib/utils'
import { sendTenderInvitation } from '@/lib/email'

export async function GET() {
  try {
    const tenders = await prisma.tender.findMany({
      include: {
        _count: {
          select: { bids: true, invitations: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(tenders)
  } catch (error) {
    console.error('Error fetching tenders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productName, units, paymentCondition, durationHours, selectedSuppliers, images, preferences } = await request.json()
    
    if (!productName || !units || !paymentCondition || !durationHours || !selectedSuppliers?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const userId = 'default-user-id'
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000)

    // Ensure default user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: 'Administrator',
        email: 'admin@bravah.com',
        language: 'en'
      }
    })

    const tender = await prisma.tender.create({
      data: {
        productName,
        units,
        paymentCondition,
        durationHours,
        expiresAt,
        status: 'active',
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        preferences: preferences ? JSON.stringify(preferences) : null,
        userId
      }
    })

    const invitations = await Promise.all(
      selectedSuppliers.map(async (supplierId: string) => {
        const inviteLink = generateInviteLink(tender.id)
        
        return await prisma.tenderInvitation.create({
          data: {
            tenderId: tender.id,
            supplierId,
            inviteLink,
            status: 'pending'
          }
        })
      })
    )

    try {
      await Promise.all(
        invitations.map(async (invitation) => {
          const supplier = await prisma.supplier.findUnique({
            where: { id: invitation.supplierId }
          })
          
          if (supplier) {
            await sendTenderInvitation(
              supplier.email,
              supplier.name,
              {
                productName,
                units,
                paymentCondition,
                expiresAt
              },
              invitation.inviteLink
            )
          }
        })
      )
    } catch (emailError) {
      console.error('Some email invitations failed to send:', emailError)
    }

    return NextResponse.json(tender)
  } catch (error) {
    console.error('Error creating tender:', error)
    return NextResponse.json(
      { error: 'Failed to create tender' },
      { status: 500 }
    )
  }
}