"use client";

import React from "react";

export function EnlargableProfilePhoto({
  src,
  alt,
  imageClassName,
  dialogTitle = "Profile photo",
  referrerPolicy,
}: {
  src: string;
  alt: string;
  imageClassName: string;
  dialogTitle?: string;
  referrerPolicy?: React.ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const titleId = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  const close = React.useCallback(() => {
    setIsOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="autograph-photo-zoom-trigger"
        onDoubleClick={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`${alt}. Double-click to enlarge.`}
        title="Double-click to enlarge profile photo"
      >
        <img
          className={imageClassName}
          src={src}
          alt=""
          aria-hidden="true"
          referrerPolicy={referrerPolicy}
          draggable={false}
        />
      </button>

      {isOpen ? (
        <div
          className="autograph-photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}
        >
          <div className="autograph-photo-lightbox-panel">
            <div className="autograph-photo-lightbox-header">
              <h3 id={titleId} className="autograph-photo-lightbox-title">
                {dialogTitle}
              </h3>
              <button
                ref={closeButtonRef}
                type="button"
                className="autograph-photo-lightbox-close"
                onClick={close}
                aria-label="Close enlarged profile photo"
              >
                Close
              </button>
            </div>
            <img className="autograph-photo-lightbox-image" src={src} alt={alt} referrerPolicy={referrerPolicy} />
          </div>
        </div>
      ) : null}
    </>
  );
}
