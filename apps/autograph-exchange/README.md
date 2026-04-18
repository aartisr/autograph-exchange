# Autograph Exchange

This workspace app is the standalone website for the Autograph Exchange project.

## Purpose

- run `Autograph Exchange` as its own website
- keep the feature generic and reusable
- let other websites consume the same shared packages without duplicating logic

## Shared layers

This app consumes:

- `@aartisr/autograph-feature`
- `@aartisr/autograph-contract`
- `@aartisr/autograph-core`

## Local auth

The standalone site uses a lightweight `next-auth` credentials flow so it can run independently with no external identity provider.

For local development, the app auto-generates a stable fallback auth secret so `npm run dev` works out of the box.

For production or shared environments, set one of:

- `AUTH_SECRET`
- `NEXTAUTH_SECRET`

Production runtime should always provide a real secret. The fallback is only there to keep local development and framework builds friction-free.

## Local storage

The standalone site uses a file-backed storage adapter at:

- `.data/autograph-exchange.json`

This keeps the standalone app generic for local use while the core feature remains storage-agnostic.
