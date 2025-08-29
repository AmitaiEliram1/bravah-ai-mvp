import { NextRequest, NextResponse } from 'next/server'
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

      const suppliers = await prisma.supplier.findMany({
        where: { userId: session.user.id },
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
      const session = await auth()

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const { suppliers } = await request.json()

      if (!suppliers || !Array.isArray(suppliers)) {
        return NextResponse.json(
          { error: 'Invalid suppliers data' },
          { status: 400 }
        )
      }

      const userId = session.user.id

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
