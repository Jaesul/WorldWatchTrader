import { UTApi } from 'uploadthing/server';

let _ut: UTApi | undefined;

/**
 * Server-side UploadThing API (delete files, list, etc.).
 * Uses `UPLOADTHING_TOKEN` from the environment.
 */
export function getUploadThingApi() {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) {
    throw new Error('UPLOADTHING_TOKEN is not set');
  }
  if (!_ut) {
    _ut = new UTApi({ token });
  }
  return _ut;
}
