'use client';

import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from '@uploadthing/react';

import type { OurFileRouter } from '@/app/api/uploadthing/core';

const clientOpts = {
  url: '/api/uploadthing',
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, { ...init, credentials: 'include' }),
} as const;

export const UploadButton = generateUploadButton<OurFileRouter>(clientOpts);
export const UploadDropzone = generateUploadDropzone<OurFileRouter>(clientOpts);

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>(clientOpts);
