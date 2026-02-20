# Bug Sheet - Home Module

## Run Context
- Generated on: 2026-02-20T12:10:30.000Z
- Source execution: `npx playwright test tests/home/homepage.spec.ts --workers=1 --reporter=json`
- Environment URL: https://dos-web-uat.abym.us/
- Started (UTC): 2026-02-20T12:04:52.891Z
- Final report reference: `./final-rerport-2026-02-20.md`

## Bug Register
| Bug ID | Test ID | Scenario | Status | Severity | Priority | Bug State | Error Summary | Root Cause Hypothesis | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| BUG-HOME-001 | L-003 | `[Login] top navigation links route to expected pages` | Failed | Medium | P2 | Open | OTP verification title was not visible within 35s after `Send OTP`. | Intermittent OTP/login service response in UAT caused setup failure before scenario navigation assertions. | `./evidence/home-login-otp-timeout-2026-02-20/test-failed-1.png`<br>`./evidence/home-login-otp-timeout-2026-02-20/video.webm`<br>`./evidence/home-login-otp-timeout-2026-02-20/error-context.md` |

## Notes
- Bug is from logged-in precondition step (login/OTP), not from home top-navigation functional assertion itself.
- Re-run suggested once OTP service stabilizes.
