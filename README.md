# Automation Test Setup

This project uses Playwright with TypeScript for automation testing.

## Setup

```bash
npm install
npx playwright install chromium
```

## Run tests

```bash
npm test
```

## Auth prerequisites

Authenticated tests depend on `.auth/user.json` and a working login account.

- Set `LOGIN_EMAIL` in `.env` to a real account that the UAT site accepts for OTP login.
- `npm run auth:manual` can be used to create or refresh the reusable session file.
- The suite now fails fast when the OTP request API rejects the configured email, instead of timing out waiting for the OTP screen.

## POM structure

The project now follows a root Page Object Model (POM) layout:

```text
pages/
  base.page.ts
  ...
tests/
  auth/
  testCatalog/
  doctorSpeciality/
  diseaseCondition/
  forms/
  faq/
  smoke/
  support/
```

`tests/modules/**` is treated as legacy and ignored by Playwright.

## Add new page objects and tests

1. Create/update a page object in `pages/`.
2. Add tests in the matching folder under `tests/`.
3. Keep env/config helpers in `tests/support`.
4. Use `tests/smoke/` for critical quick checks.

## Optional app smoke test

1. Create `.env` from `.env.example`.
2. Set `BASE_URL` to your app URL.
3. Run `npm test`.
