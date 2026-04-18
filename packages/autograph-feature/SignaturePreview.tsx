import React from "react";
import type { SignaturePreset } from "./types";

export function SignaturePreview({ preset, previewId }: { preset: SignaturePreset; previewId: string }) {
  const gradientId = `signature-gradient-${previewId}`;
  const shadowId = `signature-shadow-${previewId}`;
  const accentId = `signature-accent-${previewId}`;

  return (
    <div className="autograph-signature-preview" data-testid="signature-preview">
      <p className="autograph-signature-preview-label">Your dynamic signature</p>
      <svg className="autograph-signature-svg" viewBox="0 0 390 98" role="img" aria-label={`Signature style for ${preset.label}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={`hsl(${preset.hueStart} 70% 37%)`} />
            <stop offset="100%" stopColor={`hsl(${preset.hueEnd} 68% 32%)`} />
          </linearGradient>
          <radialGradient id={accentId} cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={`hsla(${preset.hueStart} 74% 42% / 0.22)`} />
            <stop offset="100%" stopColor={`hsla(${preset.hueEnd} 70% 32% / 0)`} />
          </radialGradient>
          <filter id={shadowId} x="-10%" y="-20%" width="120%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="rgba(20, 58, 48, 0.18)" />
          </filter>
        </defs>
        <ellipse cx="72" cy="42" rx="52" ry="28" fill={`url(#${accentId})`} />
        <text
          x="36"
          y="48"
          fill={`url(#${gradientId})`}
          opacity={preset.monogramOpacity}
          fontSize={preset.monogramSize}
          fontWeight="700"
          letterSpacing="0.08em"
          style={{
            fontFamily: '"Didot", "Baskerville", "Times New Roman", serif',
          }}
        >
          {preset.initials}
        </text>
        <g filter={`url(#${shadowId})`}>
          <text
            x="16"
            y="58"
            fill={`url(#${gradientId})`}
            fontSize={preset.wordmarkSize}
            fontStyle="italic"
            fontWeight="500"
            letterSpacing={preset.wordmarkSpacing}
            transform={`rotate(${preset.wordmarkTilt} 24 46)`}
            style={{
              fontFamily: '"Snell Roundhand", "Segoe Script", "Brush Script MT", "Apple Chancery", cursive',
            }}
          >
            {preset.label}
          </text>
        </g>
        <path d={preset.strokeA} stroke={`url(#${gradientId})`} fill="none" strokeWidth="2.8" strokeLinecap="round" opacity="0.96" />
        <path d={preset.strokeB} stroke={`url(#${gradientId})`} fill="none" strokeWidth="1.8" strokeLinecap="round" opacity="0.72" />
        <path d={preset.flourish} stroke={`url(#${gradientId})`} fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.58" />
      </svg>
      <p className="autograph-signature-preview-name">{preset.label}</p>
    </div>
  );
}

export default SignaturePreview;
