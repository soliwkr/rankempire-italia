# RESEARCH: Phase 6 - Lead Capture

## Technical Research
- **DOI Flow:** Need to generate a unique token upon submission, store it in D1 with 'pending' status, and send a verification email with the token link.
- **Form:** Standard HTML form. Need a hidden honeypot field for bot detection.
- **Resend API:** Use  to send emails.
- **D1 Integration:** Leads table needs: uid=1000(soliwkr) gid=1000(soliwkr) groups=1000(soliwkr),967(docker),992(input),998(wheel), , , , , .
- **Notification:** Use Telegram bot API to send messages upon successful lead capture.

## Implementation Approach
1. **D1 Schema:** Add  table to D1.
2. **Backend Service:** Create .
3. **API Endpoint:** Endpoint for form submission ().
4. **Verification Endpoint:** Endpoint for verification link ().
5. **Telegram Bot:** Integrate Telegram Bot API for notifications.
