# Email Verification System

A production-ready email verification system for the Coding War application.

## 🚀 Features

### Backend Features
- **Email Verification**: Users must verify their email before accessing the platform
- **Resend Verification**: Users can request new verification emails
- **Professional Email Templates**: Beautiful HTML emails with branding
- **Development Mode**: Console logging for development without SMTP setup
- **Security**: Token-based verification with 24-hour expiration
- **Welcome Emails**: Automatic welcome emails after successful verification

### Frontend Features
- **Email Verification Screen**: Professional UI for email verification process
- **Resend Functionality**: Users can resend verification emails with cooldown
- **Smart Error Handling**: Specific error messages for different scenarios
- **Progress Feedback**: Clear instructions and status updates

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Email Configuration (Optional - will use console logging if not configured)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL (for email verification links)
FRONTEND_URL=http://localhost:8081

# Email Verification (set to false for development to bypass email verification)
REQUIRE_EMAIL_VERIFICATION=false
```

### Development vs Production

**Development Mode** (`REQUIRE_EMAIL_VERIFICATION=false`):
- Users are auto-verified after registration
- Verification emails are logged to console
- No SMTP configuration required

**Production Mode** (`REQUIRE_EMAIL_VERIFICATION=true`):
- Users must verify email before login
- Real emails sent via SMTP
- SMTP configuration required

## 📧 Email Setup

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Configure Environment**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

### Other Email Providers

**Outlook/Hotmail**:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Custom SMTP**:
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

## 🎯 API Endpoints

### POST `/auth/register`
Register a new user and send verification email.

**Request**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (Email Verification Enabled)**:
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "emailSent": true,
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "isEmailVerified": false
  }
}
```

### POST `/auth/login`
Login with email verification check.

**Response (Email Not Verified)**:
```json
{
  "message": "Email not verified",
  "error": "email_not_verified",
  "details": "Please verify your email address before logging in."
}
```

### GET `/auth/verify-email?token=TOKEN`
Verify email with token from email link.

**Response**:
```json
{
  "message": "Email verified successfully",
  "success": true,
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "isEmailVerified": true
  }
}
```

### POST `/auth/resend-verification`
Resend verification email.

**Request**:
```json
{
  "email": "john@example.com"
}
```

**Response**:
```json
{
  "message": "Verification email sent successfully",
  "emailSent": true
}
```

## 🎨 Frontend Usage

### Registration Flow

```tsx
const handleRegister = async () => {
  try {
    const response = await authStore.register(credentials);
    
    if (response?.emailSent) {
      // Navigate to email verification screen
      navigation.navigate('EmailVerification', { 
        email, 
        fromRegistration: true 
      });
    } else {
      // Auto-verified (development mode)
      uiStore.showToast('Account created successfully!', 'success');
    }
  } catch (error) {
    // Handle errors
  }
};
```

### Login Flow

```tsx
const handleLogin = async () => {
  try {
    await authStore.login(credentials);
    uiStore.showToast('Welcome back!', 'success');
  } catch (error) {
    if (error?.response?.data?.error === 'email_not_verified') {
      navigation.navigate('EmailVerification', { email });
    }
  }
};
```

### Email Verification Screen

```tsx
// Navigation to email verification
navigation.navigate('EmailVerification', {
  email: 'user@example.com',
  fromRegistration: true // Optional
});
```

## 🔒 Security Features

### Token Security
- **Crypto-strong tokens**: 32-byte random tokens
- **Time-limited**: 24-hour expiration
- **Single-use**: Tokens are cleared after verification
- **Database stored**: Secure server-side validation

### Email Security
- **Sender verification**: Branded "from" address
- **HTTPS links**: Secure verification URLs
- **Rate limiting**: Cooldown on resend requests
- **Privacy**: No email enumeration attacks

## 🎯 User Experience

### Email Templates
- **Professional design**: Branded HTML templates
- **Mobile responsive**: Works on all devices
- **Clear CTAs**: Prominent verification buttons
- **Fallback links**: Copy-paste URLs for accessibility

### Frontend Features
- **Smart error messages**: Context-aware error handling
- **Progress indicators**: Clear status feedback
- **Resend cooldown**: Prevents spam with 60s cooldown
- **Help instructions**: Step-by-step guidance

## 📱 Testing

### Development Testing
```bash
# Start with email verification disabled
REQUIRE_EMAIL_VERIFICATION=false npm start

# Check console for email logs
# Emails will be logged instead of sent
```

### Production Testing
```bash
# Enable email verification
REQUIRE_EMAIL_VERIFICATION=true npm start

# Configure SMTP settings
# Test with real email addresses
```

## 🚀 Deployment

### Environment Setup
1. **Configure SMTP** settings for your email provider
2. **Set REQUIRE_EMAIL_VERIFICATION=true** for production
3. **Update FRONTEND_URL** to your production domain
4. **Test email delivery** before going live

### Docker Deployment
The email system is included in the Docker build:
```bash
docker-compose up --build -d
```

## 📋 Database Schema

### User Model Updates
```typescript
{
  // Existing fields...
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  passwordResetToken: { type: String },      // For future use
  passwordResetExpires: { type: Date },      // For future use
}
```

## 🔧 Customization

### Email Templates
Modify templates in `src/services/email.service.ts`:
- `getVerificationEmailTemplate()`: Verification email HTML
- `getWelcomeEmailTemplate()`: Welcome email HTML

### Verification Flow
Customize the verification flow:
- Token expiration time
- Email resend cooldown
- Error messages
- UI components

## 📈 Monitoring

### Email Logs
- **Success logs**: `✅ Verification email sent`
- **Error logs**: `❌ Failed to send verification email`
- **Development logs**: Email content in console

### User Analytics
- Track verification completion rates
- Monitor failed email deliveries
- Analyze user onboarding funnel

## 🆘 Troubleshooting

### Common Issues

**Emails not sending**:
- Check SMTP credentials
- Verify email provider settings
- Check spam/junk folders
- Review server logs

**Verification links not working**:
- Check FRONTEND_URL configuration
- Verify token expiration
- Check database connectivity

**Development mode issues**:
- Set `REQUIRE_EMAIL_VERIFICATION=false`
- Check console for email logs
- Verify registration flow

This email verification system provides a professional, secure, and user-friendly experience for email verification in the Coding War application! 🎉