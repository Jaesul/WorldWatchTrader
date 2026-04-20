/**
 * In-memory review store for the design sandbox.
 * Tracks seller-reviews-buyer submissions after a listing is marked sold.
 */

export interface SellerReview {
  listingId: string;
  buyerHandle: string;
  punctuality: boolean | null;
  customerService: boolean | null;
  submittedAt: string;
}

const reviews: SellerReview[] = [];

export function submitSellerReview(review: SellerReview): void {
  reviews.push(review);
}

export function getSellerReview(listingId: string): SellerReview | undefined {
  return reviews.find((r) => r.listingId === listingId);
}

export function getAllReviews(): SellerReview[] {
  return [...reviews];
}
