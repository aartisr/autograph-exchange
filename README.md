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
- Reusable API contract through `@aartisr/autograph-contract`
- Reusable UI through `@aartisr/autograph-feature`
- Reusable domain logic through `@aartisr/autograph-core`

## Quality Bar

The repository includes:

- unit tests for copy, utilities, contrast, section structure, and persistence bridging
- browser-level responsive testing across mobile, tablet, and desktop
- accessibility checks with `axe-core`
- package-boundary verification to keep reusable UI free from host auth coupling
- production builds for both standalone and host-consumed modes
- repository hygiene checks for ownership, license metadata, and required maintainer files

## UX Highlights

The reusable experience is intentionally optimized for clarity and low cognitive load:

- guided next-action prioritization so one section is clearly the best place to start
- step states that make it obvious when Step 1 is done versus required
- one-tap mobile section jumps from the hero summary cards
- searchable signer suggestions instead of a long picker
- calmer writing flows for requesting and signing autographs
- accessible contrast, focus states, and responsive layouts across screen sizes

## Run

```bash
npm install
npm run dev
```

## Vercel Deployment

This repository is Vercel-friendly as a standalone deployment target.

Recommended Vercel project settings:

- Framework preset: `Next.js`
- Root directory: repository root
- Install command: from `vercel.json` (`NPM_CONFIG_USERCONFIG=/dev/null npm install --no-audit --no-fund --registry=https://registry.npmjs.org`)
- Build command: from `vercel.json` (`npm run build`)

Required production environment variables:

- `AUTH_SECRET` or `NEXTAUTH_SECRET`

Recommended production environment variables:

- `NEXTAUTH_URL` or `AUTH_URL` set to your deployed site URL

The standalone repo is configured to install from the public npm registry for deployment and can be validated from its own root with:

```bash
npm install --no-audit --no-fund
npm run build
```

## Publishing

This repository is registry-neutral by default.

That means:

- package metadata does not hardwire GitHub Packages
- the repo can publish to GitHub Packages or npmjs
- the registry is chosen by the command or workflow you use

### Publish to GitHub Packages

Local example:

```bash
npm login --scope=@aartisr --auth-type=legacy --registry=https://npm.pkg.github.com
npm run publish:github
```

GitHub Actions workflow:

- `.github/workflows/publish-github-packages.yml`

Optional install template for consumers:

- `.npmrc.github-example`

### Publish to npmjs

Local example:

```bash
npm login
npm run publish:npm
```

GitHub Actions workflow:

- `.github/workflows/publish-npmjs.yml`

### Recommended release order

1. Run `npm install`
2. Run `npm run ci`
3. Publish to GitHub Packages if you want controlled consumption
4. Publish to npmjs if you want easy public installs

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
