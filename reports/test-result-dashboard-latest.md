# Test Result Dashboard

- Generated: 2026-02-23 13:46:50
- Source JSON: `reports/playwright-2026-02-23_13-41-30.json`
- Playwright HTML report: `reports/playwright-html-2026-02-23_13-41-30/index.html`

## Summary

| Metric | Value |
|---|---:|
| Total | 21 |
| Passed | 21 |
| Failed | 0 |
| Skipped | 0 |
| Timed Out | 0 |
| Duration | 379.10s |
| Pass Rate | 100.00% |

## Module Summary

| Module | Total | Passed | Failed | Skipped | Duration |
|---|---:|---:|---:|---:|---:|
| auth | 1 | 1 | 0 | 0 | 37.63s |
| home | 18 | 18 | 0 | 0 | 313.34s |
| smoke | 2 | 2 | 0 | 0 | 28.12s |

## Segment Summary

| Segment | Total | Passed | Failed | Skipped | Duration |
|---|---:|---:|---:|---:|---:|
| Auth | 1 | 1 | 0 | 0 | 37.63s |
| Guest | 9 | 9 | 0 | 0 | 135.95s |
| Login | 9 | 9 | 0 | 0 | 177.40s |
| Smoke | 2 | 2 | 0 | 0 | 28.12s |

## Failed Tests

- No failed tests.

## Test Case Matrix

| # | Scenario | Module | Segment | Status | Duration | Location |
|---:|---|---|---|---|---:|---|
| 1 | login with email and otp | auth | Auth | Passed | 37.63s | `auth/login.spec.ts:11` |
| 2 | [Guest] loads home page and shows core modules | home | Guest | Passed | 29.53s | `home/homepage.spec.ts:21` |
| 3 | [Guest] all visible home page buttons are working | home | Guest | Passed | 39.60s | `home/homepage.spec.ts:30` |
| 4 | [Guest] eye icon opens and closes details | home | Guest | Passed | 6.03s | `home/homepage.spec.ts:37` |
| 5 | [Guest] download selected shows login warning | home | Guest | Passed | 4.69s | `home/homepage.spec.ts:44` |
| 6 | [Guest] top navigation links route to expected pages | home | Guest | Passed | 38.18s | `home/homepage.spec.ts:51` |
| 7 | [Guest] all header icons open expected page or modal | home | Guest | Passed | 5.12s | `home/homepage.spec.ts:58` |
| 8 | [Guest] search works with icon click and Enter key | home | Guest | Passed | 4.99s | `home/homepage.spec.ts:65` |
| 9 | [Guest] add to cart shows login warning | home | Guest | Passed | 3.83s | `home/homepage.spec.ts:72` |
| 10 | [Guest] pagination works on home catalog | home | Guest | Passed | 3.98s | `home/homepage.spec.ts:77` |
| 11 | [Login] user can login with email and OTP | home | Login | Passed | 16.11s | `home/homepage.spec.ts:86` |
| 12 | [Login] loads home page and shows core modules | home | Login | Passed | 17.03s | `home/homepage.spec.ts:92` |
| 13 | [Login] top navigation links route to expected pages | home | Login | Passed | 21.35s | `home/homepage.spec.ts:102` |
| 14 | [Login] all header icons open expected page or modal | home | Login | Passed | 21.19s | `home/homepage.spec.ts:111` |
| 15 | [Login] search works with icon click and Enter key | home | Login | Passed | 21.65s | `home/homepage.spec.ts:120` |
| 16 | [Login] eye icon opens and closes details | home | Login | Passed | 20.49s | `home/homepage.spec.ts:129` |
| 17 | [Login] add to cart updates cart count | home | Login | Passed | 19.08s | `home/homepage.spec.ts:138` |
| 18 | [Login] download selected works without login modal | home | Login | Passed | 21.44s | `home/homepage.spec.ts:147` |
| 19 | [Login] pagination works on home catalog | home | Login | Passed | 19.05s | `home/homepage.spec.ts:156` |
| 20 | framework setup is working | smoke | Smoke | Passed | 0.57s | `smoke/smokeAllModules.spec.ts:7` |
| 21 | homepage is reachable | smoke | Smoke | Passed | 27.55s | `smoke/smokeAllModules.spec.ts:14` |

