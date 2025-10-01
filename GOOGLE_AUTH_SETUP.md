# Google Authentication Setup Guide

## Overview

This guide explains how to set up Google Sign-In for your application using AWS Cognito and Google OAuth.

## Prerequisites

- Google Cloud Console account
- AWS Cognito User Pool configured
- Application running locally or deployed

## Step 1: Create Google OAuth Credentials

### 1.1 Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one

### 1.2 Enable Google+ API

1. Navigate to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click **Enable**

### 1.3 Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as application type
4. Configure the OAuth consent screen if prompted:
   - User Type: External (for testing) or Internal (for organization)
   - App name: Your app name
   - User support email: Your email
   - Developer contact information: Your email

### 1.4 Configure Authorized Origins and Redirect URIs

**For Development:**
- Authorized JavaScript origins:
  - `http://localhost:5173`
  - `http://localhost:3000` (if using different port)

**For Production:**
- Authorized JavaScript origins:
  - `https://your-domain.com`
  
**Important:** No redirect URIs needed for this implementation as we're using popup-based authentication.

### 1.5 Get Your Client ID

After creating the credentials, you'll receive:
- **Client ID**: Copy this (looks like: `xxxxx.apps.googleusercontent.com`)
- **Client Secret**: Not needed for frontend OAuth

## Step 2: Configure Your Application

### 2.1 Create Environment File

Create a `.env.local` file in your project root:

```bash
# Copy from .env.local.example
cp .env.local.example .env.local
```

### 2.2 Add Google Client ID

Edit `.env.local` and add your Google Client ID:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE.apps.googleusercontent.com

# AWS Cognito Configuration (already configured)
VITE_COGNITO_USER_POOL_ID=eu-central-1_KUaE0MTcQ
VITE_COGNITO_CLIENT_ID=ar2m2qg3gp4a0b4cld09aegdb
VITE_COGNITO_REGION=eu-central-1

# Demo Mode
VITE_DEMO_MODE=false
```

### 2.3 Restart Development Server

```bash
npm run dev
```

## Step 3: Test Google Sign-In

1. Navigate to your application's sign-in page
2. Click "Continue with Google" button
3. Google OAuth popup should appear
4. Select your Google account
5. Grant permissions
6. You should be redirected back and signed in

## Implementation Details

### How It Works

1. **User clicks "Continue with Google"**
   - Opens Google OAuth popup
   - User authenticates with Google

2. **Google returns access token**
   - Application receives OAuth token from Google
   - Fetches user profile information

3. **Create session**
   - Application stores user data in localStorage
   - Creates authenticated session

4. **Page reload**
   - Application recognizes authenticated user
   - Initializes business data

### Files Modified

- `src/main.jsx` - Added GoogleOAuthProvider wrapper
- `src/components/AuthScreen.jsx` - Integrated Google Sign-In
- `src/services/cognitoAuthService.js` - Added Google auth methods

### Authentication Flow

```
┌─────────────────────┐
│ User clicks         │
│ "Continue with      │
│  Google" button     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Google OAuth popup  │
│ opens               │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ User authenticates  │
│ with Google         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Google returns      │
│ access token        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Fetch user info     │
│ from Google API     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Store in localStorage│
│ - auth-token        │
│ - user-email        │
│ - cognito-data      │
│ - auth-provider     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Reload page         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ User authenticated  │
│ Show dashboard      │
└─────────────────────┘
```

## Troubleshooting

### Issue: "Autentificarea cu Google nu este configurată"

**Solution:** 
- Ensure `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart development server after adding environment variable
- Check that the value doesn't have quotes or extra spaces

### Issue: "Origin not authorized"

**Solution:**
- Add your origin to Authorized JavaScript origins in Google Cloud Console
- Common origins:
  - Development: `http://localhost:5173`
  - Production: `https://your-domain.com`
- Wait a few minutes for changes to propagate

### Issue: "Popup blocked"

**Solution:**
- Allow popups for your domain in browser settings
- Click on the blocked popup icon in address bar
- Enable popups for the site

### Issue: "Failed to get user info from Google"

**Solution:**
- Check browser console for detailed error
- Ensure Google+ API is enabled in Google Cloud Console
- Verify OAuth consent screen is properly configured

### Issue: "Invalid client ID"

**Solution:**
- Double-check that `VITE_GOOGLE_CLIENT_ID` matches the one from Google Cloud Console
- Ensure you copied the Client ID, not the Client Secret
- Client ID should end with `.apps.googleusercontent.com`

## Security Considerations

### Production Recommendations

1. **HTTPS Required**
   - Always use HTTPS in production
   - Google OAuth requires secure connections

2. **Restrict Origins**
   - Only add trusted domains to authorized origins
   - Remove development URLs in production

3. **Token Storage**
   - Current implementation uses localStorage
   - Consider using httpOnly cookies for enhanced security
   - Implement token rotation

4. **Session Management**
   - Set appropriate token expiration
   - Implement automatic refresh
   - Clear session on logout

5. **Error Handling**
   - Don't expose sensitive errors to users
   - Log errors server-side
   - Provide generic error messages

## Testing

### Test Scenarios

1. **Successful Sign-In**
   - Click "Continue with Google"
   - Select account
   - Verify dashboard loads

2. **Cancelled Sign-In**
   - Click "Continue with Google"
   - Close popup
   - Verify no error shown

3. **Sign-Out**
   - Sign in with Google
   - Click sign-out button
   - Verify redirected to sign-in page

4. **Session Persistence**
   - Sign in with Google
   - Close browser
   - Reopen application
   - Verify still signed in

## Advanced Configuration

### Customize OAuth Scopes

Edit `AuthScreen.jsx` to request additional scopes:

```javascript
const googleLogin = useGoogleLogin({
  scope: 'email profile openid',
  // Add more scopes as needed
  onSuccess: async (tokenResponse) => {
    // ...
  }
})
```

### Available Scopes

- `profile` - Basic profile information
- `email` - Email address
- `openid` - OpenID Connect
- `https://www.googleapis.com/auth/calendar` - Google Calendar
- `https://www.googleapis.com/auth/drive` - Google Drive

## Monitoring

### Check Authentication Status

```javascript
import cognitoAuthService from '@/services/cognitoAuthService'

// Check if authenticated
const isAuth = cognitoAuthService.isAuthenticated()

// Check if Google auth
const isGoogle = cognitoAuthService.isGoogleAuth()

// Get user data
const userData = JSON.parse(localStorage.getItem('cognito-data'))
console.log('User:', userData.profile)
```

### Debug Mode

Enable debug logging by opening browser console:

```javascript
// Check stored data
console.log('Auth Token:', localStorage.getItem('auth-token'))
console.log('Auth Provider:', localStorage.getItem('auth-provider'))
console.log('User Email:', localStorage.getItem('user-email'))
console.log('Cognito Data:', localStorage.getItem('cognito-data'))
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Google Cloud Console configuration
3. Ensure environment variables are set
4. Review this documentation
5. Check Google OAuth documentation

## References

- [Google Identity Documentation](https://developers.google.com/identity)
- [Google Cloud Console](https://console.cloud.google.com/)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)

---

**Last Updated**: September 30, 2025  
**Version**: 1.0.0

