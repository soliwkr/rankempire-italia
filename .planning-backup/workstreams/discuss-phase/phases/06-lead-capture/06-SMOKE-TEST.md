# SMOKE TEST: Phase 6 - Lead Capture

## Test Cases
- [ ] Submit lead form with honeypot -> Verify bot detection (silent drop).
- [ ] Submit valid lead -> Verify 'pending' status in D1 and email receipt.
- [ ] Verify lead via email link -> Verify 'verified' status in D1.
- [ ] Verify Telegram notification upon successful capture.

## Current Status
- Pending.

## Test Results (2026-04-27)
- [x] Submit lead form with honeypot -> Bot detection active (silent drop).
- [x] Submit valid lead -> D1 record created with 'pending' status, email received.
- [x] Verify lead via email link -> D1 status updated to 'verified'.
- [x] Telegram notification -> Received with correct data.

## Overall Status
- PASSED
