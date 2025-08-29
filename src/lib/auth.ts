import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text', optional: true }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string
        const name = credentials.name as string

        try {
          // Check if user exists
          let user = await prisma.user.findUnique({
            where: { email }
          })

          if (user) {
            // Login: verify password
            const isValidPassword = await bcrypt.compare(password, user.password || '')
            if (!isValidPassword) {
              return null
            }
          } else if (name) {
            // Registration: create new user
            const hashedPassword = await bcrypt.hash(password, 12)
            user = await prisma.user.create({
              data: {
                name,
                email,
                password: hashedPassword,
                language: 'en'
              }
            })
          } else {
            // No user found and no name provided for registration
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  pages: {
    signIn: '/auth/signin'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})