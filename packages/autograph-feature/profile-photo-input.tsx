"use client";

import React from "react";
import { INPUT_CLASS } from "./screen-utils";
import { EnlargableProfilePhoto } from "./profile-photo-lightbox";

const PROFILE_PHOTO_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const PROFILE_PHOTO_MAX_BYTES = 5_000_000;
const PROFILE_PHOTO_MAX_STORED_BYTES = 140_000;
const PROFILE_PHOTO_SIZES = [480, 384, 320, 256] as const;
const PROFILE_PHOTO_OUTPUTS = [
  { type: "image/webp", qualities: [0.82, 0.72, 0.62, 0.52] },
  { type: "image/jpeg", qualities: [0.82, 0.72, 0.62, 0.52] },
] as const;

type OptimizedProfilePhoto = {
  dataUrl: string;
  originalBytes: number;
  optimizedBytes: number;
  size: number;
  mimeType: string;
};

function isLocalProfilePhoto(value: string): boolean {
  return value.startsWith("data:image/");
}

function dataUrlBytes(value: string): number {
  const base64 = value.split(",", 2)[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function formatBytes(value: number): string {
  if (value < 1_000) return `${value} B`;
  if (value < 1_000_000) return `${Math.round(value / 1_000)} KB`;
  return `${(value / 1_000_000).toFixed(1)} MB`;
}

function readProfilePhotoAsDataUrl(file: File): Promise<OptimizedProfilePhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read that image."));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result.startsWith("data:image/")) {
        reject(new Error("Choose a valid image file."));
        return;
      }
      resolve({
        dataUrl: result,
        originalBytes: file.size,
        optimizedBytes: dataUrlBytes(result),
        size: 0,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  });
}

function loadProfilePhoto(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.decoding = "async";

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to prepare that image."));
    };
    image.src = objectUrl;
  });
}

function drawSquareAvatar(image: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);

  canvas.width = size;
  canvas.height = size;

  if (!context) {
    throw new Error("Unable to resize that image.");
  }

  context.fillStyle = "#f7f4ed";
  context.fillRect(0, 0, size, size);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    size,
    size,
  );

  return canvas;
}

async function readProfilePhoto(file: File): Promise<OptimizedProfilePhoto> {
  if (!PROFILE_PHOTO_ACCEPT.split(",").includes(file.type)) {
    return Promise.reject(new Error("Choose a PNG, JPG, WebP, or GIF image."));
  }

  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return Promise.reject(new Error("Choose an image under 5 MB."));
  }

  if (typeof document === "undefined") {
    const result = await readProfilePhotoAsDataUrl(file);
    if (result.optimizedBytes > PROFILE_PHOTO_MAX_STORED_BYTES) {
      throw new Error("Choose a smaller image.");
    }
    return result;
  }

  const image = await loadProfilePhoto(file);
  let smallest: OptimizedProfilePhoto | null = null;

  for (const size of PROFILE_PHOTO_SIZES) {
    const canvas = drawSquareAvatar(image, size);

    for (const output of PROFILE_PHOTO_OUTPUTS) {
      for (const quality of output.qualities) {
        const dataUrl = canvas.toDataURL(output.type, quality);
        if (!dataUrl.startsWith(`data:${output.type}`)) {
          continue;
        }

        const optimizedBytes = dataUrlBytes(dataUrl);
        const candidate: OptimizedProfilePhoto = {
          dataUrl,
          originalBytes: file.size,
          optimizedBytes,
          size,
          mimeType: output.type,
        };

        if (!smallest || optimizedBytes < smallest.optimizedBytes) {
          smallest = candidate;
        }
      }
    }
  }

  if (smallest && smallest.optimizedBytes <= PROFILE_PHOTO_MAX_STORED_BYTES) {
    return smallest;
  }

  throw new Error("Choose a simpler image. We could not keep it small enough after optimization.");
}

export function ProfilePhotoInput({
  value,
  onChange,
  label = "Profile photo",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const hintId = React.useId();
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const urlValue = isLocalProfilePhoto(value) ? "" : value;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    try {
      setIsOptimizing(true);
      setError(null);
      setStatus("Optimizing photo before storage...");
      const photo = await readProfilePhoto(file);
      onChange(photo.dataUrl);
      setError(null);
      setStatus(
        `Optimized before storage: ${formatBytes(photo.originalBytes)} to ${formatBytes(photo.optimizedBytes)} (${photo.size}px ${photo.mimeType.replace("image/", "").toUpperCase()}).`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload that image.");
      setStatus(null);
    } finally {
      setIsOptimizing(false);
    }
  }

  return (
    <div className="autograph-field autograph-photo-field">
      <span className="app-form-label">{label}</span>
      <div className="autograph-photo-upload">
        {value ? (
          <EnlargableProfilePhoto
            src={value}
            alt="Selected profile preview"
            imageClassName="autograph-photo-preview"
            dialogTitle="Selected profile photo"
          />
        ) : (
          <span className="autograph-photo-preview autograph-photo-preview-placeholder" aria-hidden="true">
            Photo
          </span>
        )}
        <div className="autograph-photo-controls">
          <input
            className={INPUT_CLASS}
            value={urlValue}
            onChange={(event) => {
              onChange(event.target.value);
              setError(null);
              setStatus(null);
            }}
            placeholder={value && isLocalProfilePhoto(value) ? "Local photo selected" : "https://..."}
            aria-label={`${label} URL`}
            aria-describedby={hintId}
          />
          <input
            className={`${INPUT_CLASS} autograph-file-input`}
            type="file"
            accept={PROFILE_PHOTO_ACCEPT}
            onChange={handleFileChange}
            aria-label={`Upload ${label.toLowerCase()}`}
            aria-describedby={hintId}
            disabled={isOptimizing}
          />
          {value ? (
            <button
              type="button"
              className="autograph-secondary-btn"
              onClick={() => {
                onChange("");
                setStatus(null);
              }}
            >
              Remove photo
            </button>
          ) : null}
        </div>
      </div>
      <p id={hintId} className="autograph-field-hint">
        Paste an image URL or choose a local image under 5 MB. Uploaded photos are cropped, resized, and compressed in your browser before storage; the original file is not stored.
      </p>
      {status ? (
        <p className="autograph-field-hint" role="status">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="app-alert-error autograph-error-banner" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
