import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tender = await prisma.tender.update({
      where: { id },
      data: { status: 'closed' }
    })

    return NextResponse.json(tender)
  } catch (error) {
    console.error('Error closing tender:', error)
    return NextResponse.json(
      { error: 'Failed to close tender' },
      { status: 500 }
    )
  }
}