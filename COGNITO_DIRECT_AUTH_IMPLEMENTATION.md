# AWS Cognito Direct Authentication Implementation

## Overview

This document describes the migration from OIDC redirect-based authentication to direct AWS Cognito authentication using the Cognito SDK.

## Changes Made

### 1. Removed OIDC Dependencies

- **Removed Package**: `react-oidc-context` 
- **Removed from**: `main.jsx` and `App.jsx`
- No more redirect-based authentication flow

### 2. Added Direct Cognito Authentication

- **New Package**: `amazon-cognito-identity-js`
- **New Service**: `src/services/cognitoAuthService.js`
- Direct sign-in without redirects

### 3. New Sign-In UI Component

- **Installed**: shadcn sign-in component from `https://21st.dev/r/easemize/sign-in`
- **Location**: `src/components/ui/sign-in.tsx`
- **Features**:
  - Beautiful, modern design
  - Email/password authentication
  - Password visibility toggle
  - Remember me functionality
  - Reset password option
  - Hero image with testimonials
  - Smooth animations

### 4. Updated CSS Animations

Added custom animations to `src/index.css`:
- `fadeSlideIn` - Fade and slide elements
- `slideRightIn` - Slide in from right
- `testimonialIn` - Testimonial card animations
- Custom checkbox styling

## Architecture

### Authentication Flow

```
User enters credentials
        ↓
AuthScreen component
        ↓
cognitoAuthService.signIn()
        ↓
Amazon Cognito User Pool
        ↓
Returns JWT tokens
        ↓
Store in localStorage
        ↓
Reload app
        ↓
App.jsx checks authentication
        ↓
Initialize business data
```

### Key Components

#### 1. `cognitoAuthService.js`

Main authentication service with methods:

- `signIn(email, password, rememberMe)` - Authenticate user
- `signUp(email, password, name)` - Register new user
- `confirmSignUp(email, code)` - Confirm registration with code
- `forgotPassword(email)` - Initiate password reset
- `confirmPassword(email, code, newPassword)` - Complete password reset
- `signOut()` - Sign out user
- `getCurrentSession()` - Get current session
- `isAuthenticated()` - Check if user is authenticated
- `refreshSession()` - Refresh JWT tokens

#### 2. `AuthScreen.jsx`

Sign-in page component that:
- Renders the SignInPage UI component
- Handles form submission
- Shows error messages
- Provides loading states
- Integrates with cognitoAuthService

#### 3. `App.jsx`

Main application component updated to:
- Remove OIDC dependencies
- Use `authService.isAuthenticated()` instead of `auth.isAuthenticated`
- Remove auth state synchronization logic

#### 4. `main.jsx`

Entry point simplified to:
- Remove AuthProvider wrapper
- Direct App rendering

## Configuration

### Cognito User Pool Settings

Located in `src/services/cognitoAuthService.js`:

```javascript
const poolData = {
  UserPoolId: 'eu-central-1_KUaE0MTcQ',
  ClientId: 'ar2m2qg3gp4a0b4cld09aegdb'
}
```

### Environment Variables

No environment variables needed for authentication. All configuration is in code.

## Usage Examples

### Sign In

```javascript
import cognitoAuthService from '../services/cognitoAuthService'

try {
  const userData = await cognitoAuthService.signIn(email, password, rememberMe)
  console.log('User signed in:', userData)
  // Reload or navigate to app
  window.location.reload()
} catch (error) {
  console.error('Sign in failed:', error)
}
```

### Sign Out

```javascript
import cognitoAuthService from '../services/cognitoAuthService'

await cognitoAuthService.signOut()
window.location.reload()
```

### Check Authentication

```javascript
import cognitoAuthService from '../services/cognitoAuthService'

if (cognitoAuthService.isAuthenticated()) {
  // User is authenticated
} else {
  // Show sign-in screen
}
```

### Reset Password

```javascript
import cognitoAuthService from '../services/cognitoAuthService'

// Step 1: Request reset code
await cognitoAuthService.forgotPassword(email)
// User receives code via email

// Step 2: Confirm with code
await cognitoAuthService.confirmPassword(email, code, newPassword)
```

## Error Handling

The service provides user-friendly error messages for common scenarios:

- `UserNotFoundException` - User doesn't exist
- `NotAuthorizedException` - Invalid credentials
- `UserNotConfirmedException` - Account not confirmed
- `NewPasswordRequired` - Password change required
- `LimitExceededException` - Too many attempts
- `NetworkError` - Connection issues

## UI Customization

### Testimonials

Edit testimonials in `AuthScreen.jsx`:

```javascript
const testimonials = [
  {
    avatarSrc: "https://...",
    name: "Name",
    handle: "@handle",
    text: "Testimonial text"
  }
]
```

### Hero Image

Change hero image in `AuthScreen.jsx`:

```javascript
heroImageSrc="https://images.unsplash.com/..."
```

### Title and Description

Customize in `AuthScreen.jsx`:

```javascript
const title = (
  <div className="flex items-center gap-3">
    <Building className="h-10 w-10 text-primary" />
    <span className="font-semibold">Your Title</span>
  </div>
)

const description = "Your description"
```

## Security Considerations

1. **JWT Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
2. **Token Refresh**: Automatic token refresh on session expiry
3. **Password Reset**: Secure code-based flow via email
4. **Session Management**: User session maintained by Cognito
5. **HTTPS**: Always use HTTPS in production

## Migration Benefits

1. ✅ No redirect interruption - smoother UX
2. ✅ Faster authentication - no browser redirects
3. ✅ Better error handling - immediate feedback
4. ✅ Simpler codebase - less OIDC complexity
5. ✅ Beautiful UI - modern sign-in experience
6. ✅ Better control - full auth flow control

## Testing

### Test Accounts

Use your existing Cognito users or create new ones:

```javascript
await cognitoAuthService.signUp(
  'test@example.com',
  'TestPassword123!',
  'Test User'
)
```

### Demo Mode

Demo mode still works as before - set `VITE_DEMO_MODE=true` to bypass authentication.

## Troubleshooting

### Issue: "User not found"

**Solution**: Verify the user exists in Cognito User Pool

### Issue: "Invalid credentials"

**Solution**: Check email/password combination

### Issue: "User not confirmed"

**Solution**: Complete email verification process

### Issue: Network errors

**Solution**: Check internet connection and Cognito service status

## Future Enhancements

Potential improvements:

1. **Social Sign-In**: Google, Facebook integration
2. **Multi-Factor Authentication**: SMS/TOTP support
3. **Biometric Auth**: Fingerprint/Face ID on mobile
4. **Remember Me**: Persistent sessions across devices
5. **Session Timeout**: Auto-logout after inactivity

## API Reference

See `src/services/cognitoAuthService.js` for complete API documentation.

## Support

For issues or questions:
1. Check Cognito User Pool settings
2. Review console logs for detailed errors
3. Verify network connectivity
4. Check Cognito service status

---

**Last Updated**: September 30, 2025
**Version**: 1.0.0

