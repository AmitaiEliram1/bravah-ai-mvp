import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      where: { id: 'default-user-id' }
    })

    if (!user) {
      // Return default profile if no user exists
      return NextResponse.json({
        id: 'default-user-id',
        name: 'Administrator',
        email: 'admin@bravah.com',
        language: 'en'
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, language } = await request.json()
    
    if (!name || !email || !language) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const user = await prisma.user.upsert({
      where: { id: 'default-user-id' },
      update: { name, email, language },
      create: {
        id: 'default-user-id',
        name,
        email,
        language
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    )
  }
}