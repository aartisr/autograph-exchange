# Security Policy

## Reporting

If you discover a security issue in Autograph Exchange, please report it privately to the repository owner instead of opening a public issue.

- Owner: `aartisr` (Aarti Sri Ravikumar)

Please include:

- a description of the issue
- affected files or packages
- steps to reproduce
- impact assessment if known

## Scope

Security-sensitive areas include:

- authentication boundaries
- session handling
- API authorization
- persistence adapters
- package boundary violations between host code and reusable packages

## Expectations

- do not disclose unpatched security issues publicly
- do not weaken auth or persistence boundaries for convenience
- preserve least-coupling and least-privilege design when adding integrations
