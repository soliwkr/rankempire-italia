# CONTEXT: Phase 6 - Lead Capture

## Goal
Implement a GDPR-compliant DOI lead form.

## Requirements (LEAD-01 to LEAD-06)
1. GDPR compliant DOI flow.
2. Form submission writes to D1 with pending status.
3. Trigger verification email via Resend.
4. Verify lead on click.
5. Avatar tagging.
6. Telegram notification.

## Implementation Decisions
- **Form:** Standard HTML form with honeypot field.
- **Backend:** Cloudflare Pages Function (or Worker).
- **Email:** Resend API.
- **Notification:** Telegram Bot API (rank-rent-bot-chris).
- **Database:** D1 'leads' table.
