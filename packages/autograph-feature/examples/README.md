# Embedded Host Examples

These examples show different ways to consume `@aartisr/autograph-feature` without giving up host control.

## Included examples

- `nextjs`
  Basic Next.js host integration
- `react-router`
  Host integration in a routed React application shell
- `custom-fetcher`
  Host integration with a custom API fetch layer and custom headers

Each example preserves the core contract:

- host owns auth
- host owns persistence
- host may own telemetry
