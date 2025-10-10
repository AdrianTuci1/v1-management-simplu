# Register & Invitation System

Acest document descrie sistemul de înregistrare bazat pe invitații implementat în aplicație.

## Prezentare Generală

Sistemul permite crearea de conturi noi doar prin intermediul invitațiilor. Utilizatorii primesc un link de invitație cu un token unic care le permite să se înregistreze.

## Componente

### 1. UI Components

#### SignUpPage (`src/components/ui/sign-up.tsx`)
- Componentă UI similară cu `SignInPage`
- Design consistent cu restul aplicației
- Features:
  - Email field (poate fi disabled și pre-filled)
  - Password field cu vizibilitate toggle
  - Confirm password field
  - Validare client-side
  - Loading states
  - Link înapoi la login

#### RegisterPage (`src/components/RegisterPage.jsx`)
- Pagină principală pentru înregistrare
- Gestionează fluxul complet de înregistrare

**Flux:**
1. Verifică prezența token-ului în URL (`?token=xyz`)
2. Verifică validitatea token-ului prin API call
3. Afișează form-ul de înregistrare cu email-ul pre-filled
4. Procesează înregistrarea în Cognito cu metadata
5. Redirecționează la login după succes

**Props și State:**
- `token`: Obținut din query params
- `verification`: Datele invitației (email, invitedBy, etc.)
- `loading`: Loading state pentru verificarea token-ului
- `registering`: Loading state pentru procesul de înregistrare
- `error`: Mesaje de eroare
- `success`: Mesaje de succes

### 2. Backend Integration

#### API Endpoint - Verify Invitation
```
GET /api/invitations/verify?token={token}
```

**Response (valid):**
```json
{
  "valid": true,
  "data": {
    "email": "user@example.com",
    "invitedBy": "Admin Name",
    "expiresAt": "2025-10-16T12:00:00Z"
  }
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "error": "Invitație expirată sau invalidă"
}
```

#### Cognito SignUp with Metadata

Metoda `signUp` din `cognitoAuthService` a fost extinsă pentru a suporta `clientMetadata`:

```javascript
await cognitoAuthService.signUp(
  email,
  password,
  null, // name (optional)
  {
    invitationToken: token // metadata pentru Lambda triggers
  }
)
```

**Cum funcționează:**
1. Metadata este trimisă ca `validationData` în Cognito
2. Cognito o face disponibilă în Lambda triggers (Pre-signup, Post-confirmation)
3. Lambda poate valida token-ul și actualiza baza de date

### 3. Routing

React Router este configurat în `App.jsx`:

```jsx
<Routes>
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/*" element={<AppContent />} />
</Routes>
```

Ruta `/register` este accesibilă fără autentificare.

## Flux Complet de Utilizare

### 1. Admin trimite invitație
```
POST /api/invitations/create
{
  "email": "user@example.com",
  "role": "doctor"
}

Response: {
  "invitationUrl": "https://app.example.com/register?token=abc123"
}
```

### 2. Utilizator accesează link-ul
- Click pe link → `/register?token=abc123`
- RegisterPage verifică token-ul automat
- Dacă valid, afișează formular cu email pre-filled

### 3. Utilizator completează formular
- Email: `user@example.com` (disabled, read-only)
- Parolă: minimum 8 caractere, trebuie să conțină:
  - Majusculă
  - Minusculă  
  - Cifră
  - Caracter special
- Confirmă parola

### 4. Submit formular
```javascript
// 1. Validări client-side
- Parolele coincid
- Lungime minimă 8 caractere

// 2. Cognito signUp
await cognitoAuthService.signUp(email, password, null, {
  invitationToken: token
})

// 3. Cognito triggers
- Pre-signup Lambda: Validează token-ul
- Post-confirmation Lambda: Actualizează user-ul în DB
```

### 5. Confirmation
- După înregistrare, Cognito trimite email cu cod de confirmare
- Utilizator redirect la login cu mesaj: "Verifică email-ul pentru confirmare"
- Utilizator confirmă contul (click link în email sau introduce cod)

### 6. Login
- Utilizator se autentifică cu credențialele create
- Access la platformă bazat pe roluri

## Validări și Erori

### Client-side Validations
- ✅ Token prezent în URL
- ✅ Parolele coincid
- ✅ Lungime minimă parolă (8 caractere)
- ✅ Email format valid (HTML5)

### Server-side Validations (în Lambda)
- ✅ Token valid și nu a expirat
- ✅ Email corespunde cu invitația
- ✅ Parola respectă politica Cognito
- ✅ User nu există deja

### Mesaje de Eroare

**Token invalid:**
```
"Invitație invalidă sau expirată"
→ Redirect la login după 5 secunde
```

**User există deja:**
```
"Acest email există deja. Poți să te autentifici."
```

**Parolă invalidă:**
```
"Parolă invalidă. Trebuie să conțină: majusculă, minusculă, cifră, caracter special."
```

**Parolele nu coincid:**
```
"Parolele nu coincid"
```

## Configurare Backend (Lambda Triggers)

### Pre-signup Trigger
```javascript
// Lambda function pentru validare token
exports.handler = async (event) => {
  const { invitationToken } = event.request.validationData || {}
  const { email } = event.request.userAttributes
  
  if (!invitationToken) {
    throw new Error('Invitation token required')
  }
  
  // Verifică token în DB
  const invitation = await getInvitation(invitationToken)
  
  if (!invitation || invitation.expired) {
    throw new Error('Invalid or expired invitation')
  }
  
  if (invitation.email !== email) {
    throw new Error('Email mismatch')
  }
  
  // Token valid, permite sign-up
  return event
}
```

### Post-confirmation Trigger
```javascript
// Lambda function pentru finalizare înregistrare
exports.handler = async (event) => {
  const { invitationToken } = event.request.clientMetadata || {}
  const { email, sub } = event.request.userAttributes
  
  // Creează user în DB cu rolurile din invitație
  const invitation = await getInvitation(invitationToken)
  
  await createUser({
    cognitoId: sub,
    email: email,
    roles: invitation.roles,
    locations: invitation.locations
  })
  
  // Marchează invitația ca folosită
  await markInvitationUsed(invitationToken)
  
  return event
}
```

## Environment Variables

Configurare necesară în `.env.local`:

```bash
# Cognito Configuration
VITE_COGNITO_USER_POOL_ID=eu-central-1_XXXXX
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_COGNITO_REGION=eu-central-1

# Backend API
VITE_API_ENDPOINT=https://api.example.com
```

## Security Considerations

### Token Security
- ✅ Tokens sunt UUID-uri unice
- ✅ Tokens au expirare (default: 7 zile)
- ✅ Tokens sunt single-use (marchate ca folosite după sign-up)
- ✅ Validare server-side în Lambda

### Password Security
- ✅ Politica Cognito pentru parole (uppercase, lowercase, number, special char)
- ✅ Minimum 8 caractere
- ✅ Parolele nu sunt vizibile în logs
- ✅ Transmise securizat prin HTTPS

### Email Verification
- ✅ Cognito trimite email de confirmare automat
- ✅ Contul nu este activ până la confirmare
- ✅ Linkul de confirmare expiră după 24h

## Testing

### Test Manual Flow

1. **Create invitation (API/Admin panel)**
   ```bash
   curl -X POST https://api.example.com/api/invitations/create \
     -H "Authorization: Bearer <admin-token>" \
     -d '{"email": "test@example.com", "role": "doctor"}'
   ```

2. **Access register link**
   ```
   http://localhost:5173/register?token=<received-token>
   ```

3. **Complete registration**
   - Email: pre-filled (disabled)
   - Password: Test123!@#
   - Confirm: Test123!@#
   - Submit

4. **Check email**
   - Verifică email-ul pentru codul de confirmare
   - Click link sau introduce cod

5. **Login**
   ```
   http://localhost:5173/
   ```

### Test Error Cases

**Invalid token:**
```
http://localhost:5173/register?token=invalid-token
→ Should show error + redirect
```

**Expired token:**
```
http://localhost:5173/register?token=expired-token
→ Should show error + redirect
```

**Password mismatch:**
- Enter different passwords
→ Should show client-side error

**Weak password:**
- Enter "test123"
→ Should show Cognito error

## Future Enhancements

- [ ] Pagină de confirmare email separată
- [ ] Resend confirmation code functionality
- [ ] Rate limiting pentru verificarea token-urilor
- [ ] Admin dashboard pentru management invitații
- [ ] Email templates customizabile
- [ ] Suport pentru invitații multiple (bulk)
- [ ] Tracking invitații (opened, registered, confirmed)
- [ ] Posibilitate de a revoca invitații

## Troubleshooting

### "Invitație invalidă" chiar dacă token-ul pare valid
- Verifică dacă backend-ul rulează
- Verifică `VITE_API_ENDPOINT` în `.env.local`
- Check network tab în browser pentru detalii despre request

### Cognito errors după submit
- Verifică politica de parole în Cognito Console
- Verifică dacă Lambda triggers sunt configurate corect
- Check CloudWatch logs pentru Lambda errors

### Redirect loop
- Asigură-te că ruta `/register` nu necesită autentificare
- Verifică logica de routing în `App.jsx`

### Email de confirmare nu sosește
- Check Cognito email configuration
- Verifică spam folder
- Verifică SES limits (AWS sandbox)

