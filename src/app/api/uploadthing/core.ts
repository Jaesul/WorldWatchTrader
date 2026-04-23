import { auth } from '@/auth';
import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

/**
 * Watch listing photos — multiple images, bounded size.
 * Metadata carries `userId` from session for auditing in `onUploadComplete`.
 */
export const ourFileRouter = {
  listingImages: f({
    image: { maxFileSize: '8MB', maxFileCount: 10 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) {
        throw new UploadThingError('You must be signed in to upload images.');
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId as string,
        url: file.ufsUrl,
        name: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
