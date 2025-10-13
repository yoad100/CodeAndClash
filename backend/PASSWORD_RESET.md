Password reset flow (backend)

Overview
- Two new endpoints added under /auth:
  - POST /auth/request-password-reset  { email }
  - POST /auth/reset-password?token=... { password }

Behavior
- Request: accepts an email and will generate a secure token (crypto-random) stored on the user and an expiry (1 hour). If an email provider is configured (SendGrid or SMTP) the user receives a reset email with a secure link to the frontend.
- Reset: accepts token and new password, validates token expiry, updates the password hash, clears the token/expiry fields, invalidates refresh tokens for that user and sends a confirmation email.

Environment
- FRONTEND_URL must be set in env so emails point to the correct frontend URL.
- SendGrid or SMTP should be configured as in SENDGRID_INTEGRATION.md for real emails.

Security notes
- The endpoints purposely return generic success messages for request-password-reset to avoid enumerating emails.
- Tokens expire after 1 hour.
- Refresh tokens are deleted on successful password change to prevent stolen refresh tokens from remaining valid.

Testing locally
- In development (no email provider), password reset token is logged to the server console. Use the logged URL or copy the token into the frontend ResetPassword screen.
