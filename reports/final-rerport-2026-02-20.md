# Final Rerport - Home Module

## 1. Execution Overview
- Project: DOS UAT Automation
- Module under test: Home Page
- Execution date (UTC): 2026-02-20
- Environment URL: https://dos-web-uat.abym.us/
- OS: win32 10.0.22621
- Node.js: v25.6.1
- Playwright: v1.58.2
- Command executed: `npx playwright test tests/home/homepage.spec.ts --workers=1 --reporter=json`
- Raw result file: `./home-full-run-split.json`

## 2. Summary Dashboard
| Metric | Overall | Without Login (Guest) | With Login (Authenticated) |
|---|---:|---:|---:|
| Total scenarios | 18 | 9 | 9 |
| Passed | 17 | 9 | 8 |
| Failed | 1 | 0 | 1 |
| Skipped | 0 | 0 | 0 |
| Run duration | 253.27s | - | - |

## 3. Scenario Difference Matrix
| Area | Without Login (Guest) | With Login (Authenticated) |
|---|---|---|
| Profile icon click | Login modal should open | Profile menu should open with user email + Logout |
| Cart behavior | `Add to Cart` should show `User not Login` warning | `Add to Cart` should increase cart count |
| Download Selected | Should show login warning | Should work without login modal |
| Header cart icon | Should open login modal | Should not open login modal |
| Core navigation/search/pagination | Functional navigation checks | Same checks validated after successful login |

## 4. Test Case List - Without Login (Guest)
| TC ID | Scenario | Status | Duration (s) |
|---|---|---|---:|
| G-001 | `[Guest] loads home page and shows core modules` | Passed | 22.32 |
| G-002 | `[Guest] all visible home page buttons are working` | Passed | 6.49 |
| G-003 | `[Guest] eye icon opens and closes details` | Passed | 2.16 |
| G-004 | `[Guest] download selected shows login warning` | Passed | 37.44 |
| G-005 | `[Guest] top navigation links route to expected pages` | Passed | 2.92 |
| G-006 | `[Guest] all header icons open expected page or modal` | Passed | 3.09 |
| G-007 | `[Guest] search works with icon click and Enter key` | Passed | 2.60 |
| G-008 | `[Guest] add to cart shows login warning` | Passed | 1.93 |
| G-009 | `[Guest] pagination works on home catalog` | Passed | 2.06 |

## 5. Test Case List - With Login (Authenticated)
| TC ID | Scenario | Status | Duration (s) |
|---|---|---|---:|
| L-001 | `[Login] user can login with email and OTP` | Passed | 14.39 |
| L-002 | `[Login] loads home page and shows core modules` | Passed | 13.88 |
| L-003 | `[Login] top navigation links route to expected pages` | Failed | 41.87 |
| L-004 | `[Login] all header icons open expected page or modal` | Passed | 18.38 |
| L-005 | `[Login] search works with icon click and Enter key` | Passed | 15.46 |
| L-006 | `[Login] eye icon opens and closes details` | Passed | 16.03 |
| L-007 | `[Login] add to cart updates cart count` | Passed | 16.11 |
| L-008 | `[Login] download selected works without login modal` | Passed | 16.09 |
| L-009 | `[Login] pagination works on home catalog` | Passed | 15.71 |

## 6. Failed Scenario Detail
### L-003 - `[Login] top navigation links route to expected pages`
- File: `tests/home/homepage.spec.ts:102`
- Failure point: `pages/login.page.ts:55`
- Error summary: OTP verification title did not appear within 35s after clicking `Send OTP` (element not found).
- Classification: Intermittent login/OTP flow failure (environment/service timing), not a direct home page UI functional failure.
- Evidence:
- `./evidence/home-login-otp-timeout-2026-02-20/test-failed-1.png`
- `./evidence/home-login-otp-timeout-2026-02-20/video.webm`
- `./evidence/home-login-otp-timeout-2026-02-20/error-context.md`

## 7. Shareable Artifacts
- Final rerport (this file): `./final-rerport-2026-02-20.md`
- Latest full run JSON: `./home-full-run-split.json`
- Legacy full run JSON: `./home-full-run.json`
- Search rerun JSON: `./home-search-rerun.json`
- Playwright HTML report: `../playwright-report/index.html`
