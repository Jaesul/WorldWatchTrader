"use client";

import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Verify } from "@/components/Verify";

export function AutoVerifyDialog({
  initiallyVerified,
  action,
}: {
  initiallyVerified: boolean;
  action: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!initiallyVerified) {
      setOpen(true);
    }
  }, [initiallyVerified]);

  if (initiallyVerified) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Verify with World ID</AlertDialogTitle>
          <AlertDialogDescription>
            Complete verification to update your account&apos;s orb status in the
            database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Verify
          action={action}
          showHeading={false}
          onVerified={() => setOpen(false)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Later</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
