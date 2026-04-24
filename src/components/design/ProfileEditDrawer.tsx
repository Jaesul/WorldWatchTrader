"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import type { DesignProfile } from "@/lib/design/profile-store";

const MAX_BIO_LENGTH = 500;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ProfileEditDrawer({
  open,
  onOpenChange,
  profile,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: DesignProfile;
  onSave: (next: DesignProfile) => void;
}) {
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  useEffect(() => {
    if (open) {
      setBio(profile.bio);
      setAvatarUrl(profile.avatarUrl);
    }
  }, [open, profile.bio, profile.avatarUrl]);

  async function applyImageFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      setAvatarUrl(await readFileAsDataUrl(file));
    } catch {
      /* ignore */
    }
  }

  function handleSave() {
    onSave({
      bio: bio.trim() || profile.bio,
      avatarUrl: avatarUrl.trim() || profile.avatarUrl,
    });
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92vh] max-w-lg">
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription className="sr-only">
            Update your profile photo and bio. Changes are saved in this browser
            only.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6 overflow-y-auto px-4 pb-2">
          <section>
            <p className="mb-2 text-sm font-semibold text-foreground">
              Profile photo
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="relative size-28 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted ring-2 ring-ring/20">
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <div className="flex w-full flex-1 flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Take a new photo or choose one from your library. Images stay in
                  this browser only (design sandbox).
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="size-4" />
                    Take photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => libraryInputRef.current?.click()}
                  >
                    <ImagePlus className="size-4" />
                    Upload photo
                  </Button>
                </div>
                <input
                  ref={libraryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    void applyImageFile(f);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    void applyImageFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </section>

          <section>
            <label
              htmlFor="profile-edit-bio"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Bio
            </label>
            <Textarea
              id="profile-edit-bio"
              value={bio}
              onChange={(e) =>
                setBio(e.target.value.slice(0, MAX_BIO_LENGTH))
              }
              rows={5}
              placeholder="Tell buyers about your collecting style, shipping, and authenticity practices."
              className="resize-none text-sm"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
              {bio.length}/{MAX_BIO_LENGTH}
            </p>
          </section>
        </div>

        <DrawerFooter className="border-t border-border pt-2">
          <Button type="button" className="w-full rounded-xl" onClick={handleSave}>
            Save changes
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="w-full rounded-xl">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
