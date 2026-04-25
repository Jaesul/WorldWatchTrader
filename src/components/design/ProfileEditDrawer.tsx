"use client";

import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
import { useUploadThing } from "@/lib/uploadthing";
import type { AppViewer } from "@/lib/viewer/types";

const MAX_BIO_LENGTH = 500;

export function ProfileEditDrawer({
  open,
  onOpenChange,
  viewer,
  fallbackAvatarUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewer: AppViewer;
  fallbackAvatarUrl: string;
}) {
  const router = useRouter();
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(viewer.bio);
  const [avatarUrl, setAvatarUrl] = useState(
    viewer.profilePictureUrl ?? fallbackAvatarUrl,
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setBio(viewer.bio);
      setAvatarUrl(viewer.profilePictureUrl ?? fallbackAvatarUrl);
      setPendingFile(null);
      setSaveError(null);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    }
  }, [open, viewer.bio, viewer.profilePictureUrl, fallbackAvatarUrl]);

  const { startUpload } = useUploadThing("profileAvatar", {
    onUploadError: (e) => {
      setSaveError(e.message || "Upload failed");
    },
  });

  function applyImageFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setSaveError(null);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setAvatarUrl(url);
    setPendingFile(file);
  }

  async function handleSave() {
    if (saving) return;
    const trimmedBio = bio.slice(0, MAX_BIO_LENGTH);

    setSaveError(null);
    setSaving(true);
    try {
      let nextPictureUrl: string | null | undefined;
      if (pendingFile) {
        const uploaded = await startUpload([pendingFile]);
        const url = uploaded?.[0]?.ufsUrl;
        if (!url) {
          setSaveError("Couldn’t upload photo");
          return;
        }
        nextPictureUrl = url;
      }

      const patch: Record<string, unknown> = { bio: trimmedBio };
      if (nextPictureUrl !== undefined) patch.profilePictureUrl = nextPictureUrl;

      const res = await fetch("/api/design/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setSaveError(j.error || "Could not save profile");
        return;
      }

      toast.success("Profile updated");
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      console.error("profile save failed", e);
      setSaveError(
        e instanceof Error ? e.message : "Could not save profile",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={(next) => (!saving ? onOpenChange(next) : null)}>
      <DrawerContent className="mx-auto max-h-[92vh] max-w-lg">
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription className="sr-only">
            Update your profile photo and bio. Changes are saved to your account.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6 overflow-y-auto px-4 pb-2">
          <section>
            <p className="mb-2 text-sm font-semibold text-foreground">Profile photo</p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="relative size-28 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted ring-2 ring-ring/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              </div>
              <div className="flex w-full flex-1 flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Take a new photo or choose one from your library. Saved to your
                  account when you tap Save.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={saving}
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
                    disabled={saving}
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
                    applyImageFile(f);
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
                    applyImageFile(f);
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
              onChange={(e) => {
                setSaveError(null);
                setBio(e.target.value.slice(0, MAX_BIO_LENGTH));
              }}
              rows={5}
              placeholder="Tell buyers about your collecting style, shipping, and authenticity practices."
              className="resize-none text-sm"
              disabled={saving}
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
              {bio.length}/{MAX_BIO_LENGTH}
            </p>
          </section>
        </div>

        <DrawerFooter className="border-t border-border pt-2">
          {saveError ? (
            <p
              className="mb-2 text-center text-sm text-destructive"
              role="alert"
            >
              {saveError}
            </p>
          ) : null}
          <Button
            type="button"
            className="w-full rounded-xl"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </span>
            ) : (
              "Save changes"
            )}
          </Button>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              disabled={saving}
            >
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
