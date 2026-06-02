"use client";

import { useEffect, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api-error";
import { lessonService } from "@/lib/services/lesson-service";

interface LibraryFileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadAccept: string;
  onUploaded: () => void;
}

export function LibraryFileUploadDialog({
  open,
  onOpenChange,
  uploadAccept,
  onUploaded,
}: LibraryFileUploadDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const handleUploadFromComputer = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = uploadAccept;
    input.onchange = async () => {
      if (!input.files?.length) return;
      setUploading(true);
      setError(null);
      try {
        await lessonService.uploadLibraryPoolFiles(Array.from(input.files));
        onUploaded();
        onOpenChange(false);
      } catch (err) {
        setError(getApiErrorMessage(err, "Upload failed."));
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload files to library</DialogTitle>
          <DialogDescription>
            Store PDF, DOCX, or PPTX in your file library. Attach them to lesson templates
            later from the template editor.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" disabled={uploading} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={uploading} onClick={() => void handleUploadFromComputer()}>
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <FileUp className="h-4 w-4 mr-1.5" />
            )}
            Choose from computer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
