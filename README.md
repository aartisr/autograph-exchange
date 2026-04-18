# Autograph Exchange

Autograph Exchange is a standalone product and a reusable platform module for asking, giving, and preserving written autographs in a calm, modern, accessible way.

It is designed to work in two modes:

- as a deployable website that runs independently
- as a plug-and-play library consumed by a host application

## Vision

Autograph Exchange should feel:

- warm instead of transactional
- simple instead of confusing
- premium instead of cluttered
- portable instead of tightly coupled
- accessible instead of fragile

The project is intentionally built so that the UI, contract, business rules, auth boundary, persistence boundary, and repository standards are clearly separated.

## Architecture

### Applications

- `apps/autograph-exchange`
  Standalone Next.js website

### Packages

- `packages/autograph-feature`
  Reusable UI, responsive presentation layer, and host-ready feature entry
- `packages/autograph-contract`
  Shared routes, request shapes, response shapes, and domain types
- `packages/autograph-core`
  Domain logic, route helpers, and persistence ports

## Design Principles

- Auth is owned by the standalone app or the consuming host, never by the reusable UI package.
- Persistence is owned by the standalone app or the consuming host, never by the reusable UI package.
- The core is database-neutral and adapter-driven.
- The feature should be easy to embed in shells with different layouts, branding, and backend stacks.
- Accessibility, contrast, responsive behavior, and clarity are part of the feature contract, not optional polish.

## What Makes It Plug And Play

- Host-controlled auth through `authStatus` and `viewer`
- Host-controlled persistence through `AutographStorage`
- Host-controlled telemetry through `onEvent`
- Reusable API contract through `@autograph-exchange/contract`
- Reusable UI through `@autograph-exchange/feature`
- Reusable domain logic through `@autograph-exchange/core`

## Quality Bar

The repository includes:

- unit tests for copy, utilities, contrast, section structure, and persistence bridging
- browser-level responsive testing across mobile, tablet, and desktop
- accessibility checks with `axe-core`
- package-boundary verification to keep reusable UI free from host auth coupling
- production builds for both standalone and host-consumed modes
- repository hygiene checks for ownership, license metadata, and required maintainer files

## Run

```bash
npm install
npm run dev
```

## Validate

Run the main validation pipeline:

```bash
npm run ci
```

For browser-level checks, also run:

```bash
npm run test:e2e
```

Or run checks individually:

```bash
npm run test:repo
npm run test
npm run test:boundaries
npm run build
npm run test:e2e
```

## Repository Standards

- owner and code ownership are enforced through metadata and CODEOWNERS
- changelog and contribution guidance are part of the repository contract
- CI validates repo hygiene, auth boundaries, tests, and builds
- release-readiness can be run manually from GitHub Actions before shipping

## Documentation

- [Feature package contract](./packages/autograph-feature/README.md)
- [Core persistence design](./packages/autograph-core/README.md)
- [Contract package overview](./packages/autograph-contract/README.md)
- [Host embedding guide](./docs/host-embedding.md)
- [Persistence adapters](./docs/persistence-adapters.md)
- [Production readiness](./docs/production-readiness.md)
- [Versioning and releases](./docs/versioning-and-releases.md)
- [Contribution guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)

## Embedded Host Examples

- [Next.js example](./packages/autograph-feature/examples/nextjs/NextAutographFeaturePage.example.tsx)
- [React Router example](./packages/autograph-feature/examples/react-router/ReactRouterAutographPage.example.tsx)
- [Custom fetcher example](./packages/autograph-feature/examples/custom-fetcher/CustomFetcherAutographFeature.example.tsx)

## Copyright And Licensing

Copyright (c) 2026 Aarti Sri Ravikumar.

This repository is currently marked as `UNLICENSED` unless a separate written license or commercial agreement is provided by the owner.
