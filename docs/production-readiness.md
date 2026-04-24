# Production Readiness

Autograph Exchange is designed to be production-ready in both standalone and embedded modes.

## Quality gates

- unit tests for copy, utilities, contrast, sections, and storage bridging
- Playwright responsive coverage across mobile, tablet, and desktop
- accessibility checks with axe-core
- package boundary checks to keep auth out of the reusable UI package
- production builds for both the standalone app and the consuming host app

## Observability

`@aartisr/autograph-feature` exposes `onEvent`, so the host can forward feature telemetry into any observability stack.

Example:

```tsx
<AutographExchangeFeature
  authStatus="authenticated"
  viewer={viewer}
  onEvent={(event) => {
    telemetryClient.trackEvent({
      name: `autograph.${event.name}`,
      properties: {
        userId: event.userId,
        requestId: event.requestId,
        ...event.metadata,
      },
    });
  }}
/>
```

## Event names

- `view_loading`
- `view_signed_out`
- `view_authenticated`
- `load_succeeded`
- `load_failed`
- `profile_saved`
- `request_created`
- `request_signed`

## Accessibility

- visible focus treatment
- status updates announced through live regions
- explicit labels and descriptions on interactive controls
- reduced-motion support
- verified contrast on buttons, badges, and select options

## Product UX

- source-informed autograph-book metaphor documented in `docs/autograph-book-ux-research.md`
- open-book hero preview that turns request, inbox, and archive state into a single keepsake mental model
- paper-page cards for pending, sent, and signed items so the package feels generic and memorable across hosts
- host-overridable copy and role labels so product-specific vocabulary stays outside the reusable package

## Performance

- archive data loads in pages
- signer and archive filtering use memoized derived state
- in-flight initial loads are abortable and protected against stale state writes
- keepsake download encoders are lazy-loaded only when a user exports SVG, PNG, JPG, GIF, or PDF
