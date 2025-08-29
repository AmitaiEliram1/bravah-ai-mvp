interface TenderPreferences {
  deliveryPriority: number // 1-5
  warrantyPriority: number // 1-5
  qualityPriority: number // 1-5
  pricePriority: number // 1-5
}

interface BidData {
  id: string
  price: number
  deliveryDays?: number | null
  warrantyMonths?: number | null
  qualityScore?: number | null
  supplierId: string
}

export function calculateValueScore(
  bid: BidData, 
  preferences: TenderPreferences,
  allBids: BidData[]
): number {
  if (allBids.length === 0) return 0
  
  // Find min/max values for normalization
  const prices = allBids.map(b => b.price).filter(p => p > 0)
  const deliveryDays = allBids.map(b => b.deliveryDays || 0).filter(d => d > 0)
  const warrantyMonths = allBids.map(b => b.warrantyMonths || 0)
  const qualityScores = allBids.map(b => b.qualityScore || 1)
  
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const minDelivery = Math.min(...deliveryDays) || 1
  const maxDelivery = Math.max(...deliveryDays) || 30
  const minWarranty = Math.min(...warrantyMonths) || 0
  const maxWarranty = Math.max(...warrantyMonths) || 24
  const minQuality = Math.min(...qualityScores)
  const maxQuality = Math.max(...qualityScores)
  
  // Normalize scores (0-1), higher is better
  let priceScore = 0
  if (maxPrice > minPrice) {
    // For price: lower is better, so invert
    priceScore = (maxPrice - bid.price) / (maxPrice - minPrice)
  } else {
    priceScore = 1 // All prices are the same
  }
  
  let deliveryScore = 0
  if (maxDelivery > minDelivery && bid.deliveryDays) {
    // For delivery: fewer days is better, so invert
    deliveryScore = (maxDelivery - bid.deliveryDays) / (maxDelivery - minDelivery)
  } else if (bid.deliveryDays) {
    deliveryScore = 0.5 // Default score if all delivery times are the same
  }
  
  let warrantyScore = 0
  if (maxWarranty > minWarranty && bid.warrantyMonths !== null) {
    // For warranty: more months is better
    warrantyScore = (bid.warrantyMonths! - minWarranty) / (maxWarranty - minWarranty)
  } else if (bid.warrantyMonths !== null) {
    warrantyScore = 0.5 // Default score if all warranties are the same
  }
  
  let qualityScore = 0
  if (maxQuality > minQuality && bid.qualityScore) {
    // For quality: higher score is better
    qualityScore = (bid.qualityScore - minQuality) / (maxQuality - minQuality)
  } else if (bid.qualityScore) {
    qualityScore = 0.5 // Default score if all quality scores are the same
  }
  
  // Calculate weighted final score
  const totalWeight = preferences.pricePriority + preferences.deliveryPriority + 
                     preferences.warrantyPriority + preferences.qualityPriority
  
  if (totalWeight === 0) return 0
  
  const finalScore = (
    (priceScore * preferences.pricePriority) +
    (deliveryScore * preferences.deliveryPriority) +
    (warrantyScore * preferences.warrantyPriority) +
    (qualityScore * preferences.qualityPriority)
  ) / totalWeight
  
  return finalScore
}

export function rankBidsByValue(
  bids: BidData[], 
  preferences: TenderPreferences
): Array<BidData & { score: number; rank: number }> {
  // Calculate scores for all bids
  const bidsWithScores = bids.map(bid => ({
    ...bid,
    score: calculateValueScore(bid, preferences, bids)
  }))
  
  // Sort by score (descending) then by price (ascending) as tiebreaker
  const sortedBids = bidsWithScores.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.001) {
      // Scores are very close, use price as tiebreaker
      return a.price - b.price
    }
    return b.score - a.score // Higher score is better
  })
  
  // Assign ranks
  return sortedBids.map((bid, index) => ({
    ...bid,
    rank: index + 1
  }))
}