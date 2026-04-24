# Autograph Book UX Research

This package should feel like a reusable digital autograph book, not a host-specific dashboard. The current product direction is based on comparable signing, group-card, guestbook, and collector experiences reviewed in April 2026.

## Comparable Patterns

### Digital yearbook signing

Jostens Digital Yearbook Signing Pages is the closest emotional analogue: students register, share a personal signing link, friends choose expressive writing options, pages fill up, and the finished pages can be printed and kept with the yearbook. The strongest lesson is that the product must preserve the familiar handwritten autograph ritual while making sharing and saving easier.

Source: https://www.jostens.com/about/press-center/jostens-releases-free-digital-yearbook-signing-experience

### Group cards and contributor coordination

GroupGreeting and Paperless Post emphasize the operational loop around a shared card: choose or create the surface, invite contributors, track signatures, and send or reveal the finished artifact. Kudoboard adds a platform lesson for reuse: contributors, recipients, delivery, privacy, moderation, and scale should be model concepts that can be embedded into other products.

Sources:

- https://www.groupgreeting.com/
- https://paperlesspost.zendesk.com/hc/en-us/articles/360047169571-Collecting-Multiple-Signatures-for-a-Group-Greeting-Card-or-Flyer
- https://www.kudoboard.com/features/api/

### Guestbooks and memory books

Wishgram, Memofreeze, and BoothStory show that memory products work best when they have a low-friction contribution path, a visual book/gallery metaphor, customization, and a strong export story. Memofreeze is especially useful for the host-side lesson: guests should be able to contribute without app-install friction, while the owner keeps control over privacy and the final archive.

Sources:

- https://wishgram.app/en/
- https://memofreeze.com/en
- https://boothstory.com/

### Collector autograph trust

SWAU is not a social memory product, but it is useful for the trust layer: serious autograph experiences make state, provenance, and proof visible. Its signing pages foreground authenticity, remote participation, personalization, and scan-to-verify/hologram assurances. For this package, the equivalent is clearly preserving who asked, who signed, timing, status, and exportable keepsakes.

Source: https://swau.com/collections/autograph-signings

## Product Decisions

- Lead with an open-book preview so the first screen communicates “autograph book” before users read instructions.
- Keep the flow one-person-at-a-time because yearbook and collector contexts both rely on intentional, personal requests.
- Make the hero stats behave like page tabs: sent requests, waiting requests, and saved autographs are the book’s current state.
- Render requests and signed items as paper pages with ruled lines, margin marks, and subtle page folds so the archive feels like a keepsake.
- Keep copy generic and host-overridable so `buddhi-align-app` can adapt language without forking package UI.
- Preserve provenance on every signed item: requester, signer, roles, request timing, signed timing, and status.
- Keep exports package-owned and lazy-loaded so hosts get PNG/JPG/GIF/PDF/SVG keepsakes without paying the cost on first render.
- Maintain keyboard, screen-reader, dark-mode, and mobile behavior as first-class constraints; the book metaphor cannot break accessibility.

## Reusable Package Boundary

The package owns:

- book metaphor UI
- role-aware generic copy
- contributor/request/signed-state presentation
- archive search/sort and paged loading behavior
- keepsake rendering and export actions

Hosts own:

- authentication and session identity
- persistence adapter and API endpoints
- telemetry forwarding
- product-specific labels through `copy` and `roleLabels`
