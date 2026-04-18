# Contributing

Thank you for contributing to Autograph Exchange.

This repository is maintained with a high bar for clarity, portability, accessibility, and reuse.

## Ownership

- Primary owner: `aartisr` (Aarti Sri Ravikumar)
- CODEOWNERS approval is expected for significant architectural, UX, or release-facing changes

## Before You Change Code

Please align with these principles:

- keep auth host-owned when the feature is consumed as a library
- keep persistence host-owned and database-neutral
- do not add direct product coupling into reusable packages
- preserve accessibility, contrast, and responsive behavior
- prefer explicit interfaces and maintainable boundaries over convenience shortcuts

## Development Workflow

1. Install dependencies with `npm install`
2. Run the standalone site with `npm run dev`
3. Make focused changes
4. Run validation before opening a pull request

## Validation

Run all of the following before submitting:

```bash
npm run test:repo
npm run test
npm run test:boundaries
npm run build
```

For browser-level checks, also run:

```bash
npm run test:e2e
```

## Pull Requests

Pull requests should:

- explain the user or host-facing problem being solved
- describe the architectural impact
- mention any accessibility or responsiveness considerations
- note whether the change affects standalone mode, embedded mode, or both
- update docs when public package behavior changes
- update `CHANGELOG.md` for noteworthy changes

## Commit Guidance

Prefer small, understandable commits with clear intent. Good examples:

- `feat(core): add host-owned storage bridge`
- `fix(feature): improve select contrast in dark mode`
- `docs(repo): add production readiness guide`

## Release Expectations

- do not publish packages without owner approval
- do not change ownership or license metadata without owner approval
- keep package public surfaces intentional and documented
