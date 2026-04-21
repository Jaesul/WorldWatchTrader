'use server';

import { auth } from '@/auth';
import { createListing, publishListing } from '@/db/queries/listings';
import { isAllowedUploadthingPhotoUrl } from '@/lib/upload-photo-url';
import { revalidatePath } from 'next/cache';

const TITLE_MAX = 200;
const DETAILS_MAX = 12000;
const PRICE_MAX = 100_000_000;

export type CreateAndPublishListingPayload = {
  title: string;
  details: string;
  priceUsd: number;
  condition?: string | null;
  modelNumber?: string | null;
  photoUfsUrls: string[];
};

export type CreateAndPublishListingResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string };

export async function createAndPublishListingAction(
  payload: CreateAndPublishListingPayload,
): Promise<CreateAndPublishListingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in to create a listing.' };
  }

  const title = payload.title.trim();
  const details = payload.details.trim();
  if (!title || title.length > TITLE_MAX) {
    return { ok: false, error: `Title is required (max ${TITLE_MAX} characters).` };
  }
  if (!details || details.length > DETAILS_MAX) {
    return { ok: false, error: `Description is required (max ${DETAILS_MAX} characters).` };
  }

  const { priceUsd } = payload;
  if (!Number.isInteger(priceUsd) || priceUsd < 0 || priceUsd > PRICE_MAX) {
    return { ok: false, error: 'Price must be a whole number of USD.' };
  }

  const photoUfsUrls = payload.photoUfsUrls;
  if (photoUfsUrls.length < 1 || photoUfsUrls.length > 8) {
    return { ok: false, error: 'Add between 1 and 8 photos.' };
  }
  for (const url of photoUfsUrls) {
    if (!isAllowedUploadthingPhotoUrl(url)) {
      return { ok: false, error: 'Invalid image URL.' };
    }
  }

  const teaser = details.length <= 160 ? details : `${details.slice(0, 157)}…`;
  const condition = payload.condition?.trim() || null;
  const modelNumber = payload.modelNumber?.trim() || null;

  try {
    const listing = await createListing(
      session.user.id,
      {
        title,
        teaser,
        details,
        priceUsd,
        condition,
        modelNumber,
      },
      photoUfsUrls,
    );
    await publishListing(session.user.id, listing.id);
    revalidatePath('/home');
    revalidatePath('/listings');
    revalidatePath(`/listings/${listing.id}`);
    return { ok: true, listingId: listing.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not create listing.';
    return { ok: false, error: message };
  }
}
