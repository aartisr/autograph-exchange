# @autograph-exchange/feature

Reusable Autograph Exchange UI for any website.

## Auth ownership

This package does not own authentication.

When consumed as a library, the host website must provide:

- `authStatus`
- `viewer`
- optional sign-in URL and label

That means the host decides:

- how users sign in
- how sessions are created
- which auth provider is used
- how the current user identity is resolved

The package only consumes the resolved host identity and renders the feature.

## Expected host contract

```tsx
<AutographExchangeFeature
  authStatus="authenticated"
  viewer={{
    id: "user-123",
    name: "Asha Raman",
    email: "asha@example.com",
  }}
  onEvent={(event) => {
    console.log("autograph telemetry", event);
  }}
/>
```

If the host is signed out, pass:

```tsx
<AutographExchangeFeature
  authStatus="unauthenticated"
  viewer={null}
  signInHref="/sign-in"
/>
```

## What this package must not do

- import `next-auth`
- call `useSession()`
- create or manage sessions
- infer the current user from cookies or headers

Those behaviors belong to the standalone app or the consuming host application.

## Host observability

Use `onEvent` to forward feature-level telemetry into the host's logging or observability system.

Supported events:

- `view_loading`
- `view_signed_out`
- `view_authenticated`
- `load_succeeded`
- `load_failed`
- `profile_saved`
- `request_created`
- `request_signed`

## Example hosts

- `examples/nextjs`
- `examples/react-router`
- `examples/custom-fetcher`
