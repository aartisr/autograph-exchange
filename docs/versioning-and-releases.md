# Versioning And Releases

Autograph Exchange uses a semantic-versioning mindset:

- major: breaking public API or integration changes
- minor: additive features or new extension points
- patch: bug fixes, accessibility fixes, test hardening, and documentation improvements

## What counts as a breaking change

- changing exported package names
- removing or renaming exported types
- changing the expected auth boundary
- changing the persistence adapter contract
- changing API contract payloads in incompatible ways

## Release checklist

1. Update `CHANGELOG.md`
2. Verify owner and license metadata remain correct
3. Run:

```bash
npm run test:repo
npm run test
npm run test:boundaries
npm run build
```

4. Run `npm run test:e2e` for browser-level confidence
5. Confirm docs reflect the released public surface
6. Tag and release only with owner approval

## Patch release workflow (single package)

Use this flow when only one package changes (for example, a contrast or accessibility fix in `@aartisr/autograph-feature`):

1. Bump the package version in its own `package.json` (patch for bug/accessibility fixes).
2. Add release notes to `CHANGELOG.md` under `Unreleased`.
3. Run the full validation checklist above.
4. Publish only that package:

```bash
npm run publish:npm:feature
```

5. Tag the release after publish and owner approval.
