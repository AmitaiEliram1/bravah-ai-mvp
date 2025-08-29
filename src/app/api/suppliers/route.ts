import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { suppliers } = await request.json()
    
    if (!suppliers || !Array.isArray(suppliers)) {
      return NextResponse.json(
        { error: 'Invalid suppliers data' },
        { status: 400 }
      )
    }

    const userId = 'default-user-id'

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

    const createdSuppliers = await Promise.all(
      suppliers.map(async (supplier: any) => {
        return await prisma.supplier.create({
          data: {
            name: supplier.name,
            whatsapp: supplier.whatsapp,
            email: supplier.email,
            userId: userId
          }
        })
      })
    )
    
    return NextResponse.json(createdSuppliers)
  } catch (error) {
    console.error('Error creating suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to create suppliers' },
      { status: 500 }
    )
  }
}