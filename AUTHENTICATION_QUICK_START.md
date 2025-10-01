# Authentication Quick Start Guide

## 🎉 Migration Complete!

Your application has been successfully migrated from OIDC redirect authentication to direct AWS Cognito authentication.

## What Changed?

### ❌ Removed
- `react-oidc-context` package and OIDC redirects
- Complex OAuth flow with browser redirects
- AuthProvider wrapper in main.jsx

### ✅ Added
- `amazon-cognito-identity-js` - Direct Cognito SDK
- Beautiful shadcn sign-in component
- `cognitoAuthService` - Complete auth service
- Custom animations and styling

## How to Test

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Sign In

Navigate to `http://localhost:5173` and you'll see the new sign-in page with:
- Email/password fields
- Remember me checkbox
- Password visibility toggle
- Reset password link
- Beautiful hero image with testimonials

### 3. Demo Mode (Optional)

To test without Cognito:

```bash
# Set in .env or .env.local
VITE_DEMO_MODE=true
```

## Sign-In Page Features

### Left Panel
- Clean, modern form design
- Email and password inputs
- "Keep me signed in" option
- "Reset password" link
- "Create Account" link
- "Continue with Google" button (placeholder)

### Right Panel (Desktop)
- Beautiful medical-themed hero image
- Three testimonial cards
- Smooth entrance animations

## User Credentials

Use your existing AWS Cognito users:

```javascript
// Example credentials (if you have test users)
Email: your-test-user@example.com
Password: YourPassword123!
```

## Error Handling

The system provides user-friendly error messages in Romanian:

- ✅ Invalid credentials → "Email sau parolă incorectă"
- ✅ User not found → "Utilizator inexistent"
- ✅ Account not confirmed → "Contul nu este confirmat"
- ✅ Network issues → "Eroare de rețea"

## Password Reset Flow

1. Click "Reset password" on sign-in page
2. Enter email address in prompt
3. Check email for reset code
4. Use code to set new password

## Customization

### Change Hero Image

Edit `src/components/AuthScreen.jsx`:

```javascript
heroImageSrc="https://your-image-url.jpg"
```

### Update Testimonials

Edit the `testimonials` array in `src/components/AuthScreen.jsx`:

```javascript
const testimonials = [
  {
    avatarSrc: "https://...",
    name: "Your Name",
    handle: "@yourhandle",
    text: "Your testimonial"
  }
]
```

### Modify Title

Change the `title` constant in `src/components/AuthScreen.jsx`

## API Methods

### Sign In
```javascript
import cognitoAuthService from '@/services/cognitoAuthService'

const userData = await cognitoAuthService.signIn(email, password, rememberMe)
```

### Sign Out
```javascript
await cognitoAuthService.signOut()
window.location.reload()
```

### Check Authentication
```javascript
if (cognitoAuthService.isAuthenticated()) {
  // User is signed in
}
```

### Forgot Password
```javascript
await cognitoAuthService.forgotPassword(email)
```

### Refresh Session
```javascript
const newTokens = await cognitoAuthService.refreshSession()
```

## File Structure

```
src/
├── components/
│   ├── AuthScreen.jsx          # Main sign-in page
│   └── ui/
│       └── sign-in.tsx          # shadcn sign-in component
├── services/
│   ├── authService.js           # Business logic service (existing)
│   └── cognitoAuthService.js    # NEW: Cognito auth service
├── index.css                    # Updated with animations
├── main.jsx                     # Simplified (no AuthProvider)
└── App.jsx                      # Updated auth check
```

## Authentication Flow

```
┌─────────────────┐
│  User visits    │
│  application    │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Check if            │
│ authenticated       │◄──── authService.isAuthenticated()
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    │         ▼
    │   ┌─────────────────┐
    │   │  Show AuthScreen│
    │   │  (Sign-in page) │
    │   └────────┬────────┘
    │            │
    │            ▼
    │   ┌──────────────────┐
    │   │ User enters      │
    │   │ email/password   │
    │   └────────┬─────────┘
    │            │
    │            ▼
    │   ┌──────────────────────┐
    │   │ cognitoAuthService   │
    │   │ .signIn()            │
    │   └────────┬─────────────┘
    │            │
    │            ▼
    │   ┌──────────────────────┐
    │   │ AWS Cognito          │
    │   │ validates credentials│
    │   └────────┬─────────────┘
    │            │
    │            ▼
    │   ┌──────────────────────┐
    │   │ Store JWT tokens     │
    │   │ in localStorage      │
    │   └────────┬─────────────┘
    │            │
    │            ▼
    │   ┌──────────────────────┐
    │   │ Reload page          │
    │   └────────┬─────────────┘
    │            │
    └────────────┘
         │
         ▼
┌─────────────────────┐
│ Initialize app      │
│ - Load business data│
│ - Set location      │
│ - Connect WebSocket │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Show Dashboard      │
└─────────────────────┘
```

## Troubleshooting

### Issue: "Cannot read properties of undefined"

**Solution**: Clear browser cache and localStorage:
```javascript
localStorage.clear()
```

### Issue: Sign-in button does nothing

**Solution**: Check browser console for errors. Verify Cognito pool configuration.

### Issue: Animations not working

**Solution**: Clear CSS cache or do a hard refresh (Ctrl+Shift+R)

### Issue: Page keeps showing sign-in

**Solution**: Check if tokens are being stored:
```javascript
console.log(localStorage.getItem('auth-token'))
console.log(localStorage.getItem('cognito-data'))
```

## Next Steps

1. ✅ Test sign-in with existing Cognito users
2. ✅ Customize the UI (colors, images, text)
3. ✅ Add more users to Cognito if needed
4. ✅ Test password reset flow
5. ✅ Configure production environment

## Production Checklist

Before deploying to production:

- [ ] Update hero image to your brand
- [ ] Customize testimonials with real users
- [ ] Set up proper error logging
- [ ] Configure HTTPS
- [ ] Test on mobile devices
- [ ] Set up session timeout
- [ ] Configure Cognito email templates
- [ ] Test password reset flow
- [ ] Verify token refresh works
- [ ] Set up monitoring

## Support

For detailed documentation, see:
- `COGNITO_DIRECT_AUTH_IMPLEMENTATION.md` - Complete technical documentation
- `src/services/cognitoAuthService.js` - API reference with comments

---

**Ready to use!** 🚀

Start the dev server and test your new authentication system.

