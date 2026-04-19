# Changelog

All notable changes to Autograph Exchange should be documented in this file.

This project follows a human-maintained changelog format and a semantic-versioning mindset for packages and the standalone application.

## [Unreleased]

### Fixed

- Restored dark-mode primary action contrast by aligning `--autograph-button-primary-text` with the dark gold primary gradient surface in `@aartisr/autograph-feature`.
- Added regression coverage for gradient-based primary action contrast tokens in light and dark mode.
- Added mobile and tablet browser-level visibility/accessibility checks for signed-out Autograph Exchange screens.

### Added

- Standalone website and reusable package architecture
- Host-owned authentication boundary for embedded usage
- Host-owned, database-neutral persistence contract
- Package examples for Next.js, React Router, and custom fetchers
- Accessibility, contrast, responsive, and storage regression tests
- CI, ownership metadata, contribution guidance, and repository hygiene checks

### Changed

- Improved package-level UX, responsiveness, accessibility semantics, and telemetry hooks
- Strengthened repository documentation, legal metadata, and packaging guidance

## [1.0.0] - 2026-04-18

### Added

- Initial standalone Autograph Exchange repository extraction
- Reusable `@aartisr/autograph-feature`, `@aartisr/autograph-core`, and `@aartisr/autograph-contract` packages
