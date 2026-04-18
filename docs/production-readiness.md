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
