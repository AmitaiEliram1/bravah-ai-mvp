import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const paymentConditions = [
  "Net 30",
  "Net 60",
  "Net 90", 
  "Cash on Delivery",
  "Prepayment",
  "2/10 Net 30",
  "Letter of Credit",
  "Bank Transfer"
]

export function generateInviteLink(tenderId: string): string {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
  return `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/tender/${tenderId}/bid?token=${token}`
}

export function formatTimeLeft(expiresAt: Date): string {
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()
  
  if (diff <= 0) return "Expired"
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}