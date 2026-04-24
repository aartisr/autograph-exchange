"use client";

import React from "react";
import { INPUT_CLASS } from "./screen-utils";

const PROFILE_PHOTO_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const PROFILE_PHOTO_MAX_BYTES = 1_000_000;
const PROFILE_PHOTO_MAX_STORED_BYTES = 260_000;
const PROFILE_PHOTO_SIZE = 480;
const PROFILE_PHOTO_OUTPUT_TYPE = "image/jpeg";
const PROFILE_PHOTO_QUALITIES = [0.86, 0.76, 0.66] as const;

function isLocalProfilePhoto(value: string): boolean {
  return value.startsWith("data:image/");
}

function dataUrlBytes(value: string): number {
  const base64 = value.split(",", 2)[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function readProfilePhotoAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read that image."));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result.startsWith("data:image/")) {
        reject(new Error("Choose a valid image file."));
        return;
      }
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
}

function loadProfilePhoto(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

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

function drawSquareAvatar(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);

  canvas.width = PROFILE_PHOTO_SIZE;
  canvas.height = PROFILE_PHOTO_SIZE;

  if (!context) {
    throw new Error("Unable to resize that image.");
  }

  context.fillStyle = "#f7f4ed";
  context.fillRect(0, 0, PROFILE_PHOTO_SIZE, PROFILE_PHOTO_SIZE);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    PROFILE_PHOTO_SIZE,
    PROFILE_PHOTO_SIZE,
  );

  return canvas;
}

async function readProfilePhoto(file: File): Promise<string> {
  if (!PROFILE_PHOTO_ACCEPT.split(",").includes(file.type)) {
    return Promise.reject(new Error("Choose a PNG, JPG, WebP, or GIF image."));
  }

  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return Promise.reject(new Error("Choose an image under 1 MB."));
  }

  if (typeof document === "undefined") {
    const dataUrl = await readProfilePhotoAsDataUrl(file);
    if (dataUrlBytes(dataUrl) > PROFILE_PHOTO_MAX_STORED_BYTES) {
      throw new Error("Choose a smaller image.");
    }
    return dataUrl;
  }

  const image = await loadProfilePhoto(file);
  const canvas = drawSquareAvatar(image);

  for (const quality of PROFILE_PHOTO_QUALITIES) {
    const dataUrl = canvas.toDataURL(PROFILE_PHOTO_OUTPUT_TYPE, quality);
    if (dataUrl.startsWith("data:image/") && dataUrlBytes(dataUrl) <= PROFILE_PHOTO_MAX_STORED_BYTES) {
      return dataUrl;
    }
  }

  throw new Error("Choose a simpler image. We could not keep it small enough.");
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
  const urlValue = isLocalProfilePhoto(value) ? "" : value;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    try {
      const dataUrl = await readProfilePhoto(file);
      onChange(dataUrl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload that image.");
    }
  }

  return (
    <div className="autograph-field autograph-photo-field">
      <span className="app-form-label">{label}</span>
      <div className="autograph-photo-upload">
        {value ? (
          <img className="autograph-photo-preview" src={value} alt="Selected profile preview" />
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
          />
          {value ? (
            <button type="button" className="autograph-secondary-btn" onClick={() => onChange("")}>
              Remove photo
            </button>
          ) : null}
        </div>
      </div>
      <p id={hintId} className="autograph-field-hint">
        Paste an image URL or choose a local image under 1 MB. Local photos are optimized for fast profiles.
      </p>
      {error ? (
        <p className="app-alert-error autograph-error-banner" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
