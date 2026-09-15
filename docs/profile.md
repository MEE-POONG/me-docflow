# Employee profile

`/profile` displays the authenticated account's personal and organizational data.
It selects the account from a signed, HTTP-only cookie, never from URL parameters
or local storage, and rejects inactive accounts. The page is read-only.

Set `SESSION_SECRET` to a private random value of at least 32 characters in every
deployment, identical across instances. Do not commit it. The local `.env` has
been configured. Rotating the secret invalidates existing profile sessions.

API login/registration creates a 24-hour, SameSite=Lax cookie with Secure enabled
in production. Existing users must sign in again once. Logout clears the cookie.

This protection also applies to /employees and /settings/users and all their
read and mutation actions. Only active OWNER accounts or accounts with position
exactly หัวหน้า may access them. Other users are redirected to /profile and the
sidebar links are hidden. Actors must match the signed-in account and company.
ADMIN alone does not qualify. Other actions accepting browser-supplied actors
still need a separate authentication migration.
