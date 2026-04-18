import React from "react";
import type { SignaturePreset } from "./types";

export function SignaturePreview({ preset, previewId }: { preset: SignaturePreset; previewId: string }) {
  const gradientId = `signature-gradient-${previewId}`;

  return (
    <div className="autograph-signature-preview" data-testid="signature-preview">
      <p className="autograph-signature-preview-label">Your dynamic signature</p>
      <svg className="autograph-signature-svg" viewBox="0 0 390 98" role="img" aria-label={`Signature style for ${preset.label}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={`hsl(${preset.hueStart} 70% 37%)`} />
            <stop offset="100%" stopColor={`hsl(${preset.hueEnd} 68% 32%)`} />
          </linearGradient>
        </defs>
        <path d={preset.strokeA} stroke={`url(#${gradientId})`} fill="none" strokeWidth="3.2" strokeLinecap="round" />
        <path d={preset.strokeB} stroke={`url(#${gradientId})`} fill="none" strokeWidth="2.2" strokeLinecap="round" opacity="0.88" />
      </svg>
      <p className="autograph-signature-preview-name">{preset.label}</p>
    </div>
  );
}

export default SignaturePreview;
