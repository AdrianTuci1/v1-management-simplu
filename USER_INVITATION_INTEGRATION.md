# User Invitation Integration in UserDrawer

Acest document descrie integrarea sistemului de invitații în UserDrawer pentru trimiterea automată și manuală a invitațiilor Cognito.

## Features Implementate

### 1. Trimitere Automată la Creare User

Când se creează un utilizator nou în UserDrawer, sistemul trimite automat o invitație Cognito:

```javascript
// După creare user
const savedUser = await addUser(formData)

// Trimite invitație automat
if (savedUser && formData.email && !user?.cognitoUserId) {
  await handleSendInvitation(savedUser)
}
```

### 2. Secțiune Invitație în Edit Mode

Când editezi un utilizator existent, apare o secțiune nouă pentru management invitație:

**Status-uri:**
- ✓ **Are cont Cognito** - Utilizatorul s-a înregistrat (cognitoUserId există)
- 📧 **Invitație trimisă** - Invitația a fost trimisă dar nu s-a înregistrat încă
- ⚠ **Invitație netrimisă** - Nicio invitație trimisă

**Buton:**
- "📧 Trimite invitație" - Pentru prima trimitere
- "↻ Retrimite invitație" - Pentru retrimitere
- "✓ Are cont" (disabled) - Când user are deja cont

### 3. Notificări Vizuale

**Success:**
```jsx
<div className="bg-green-50 border border-green-200">
  Invitație trimisă cu succes la {email}
</div>
```

**Error:**
```jsx
<div className="bg-amber-50 border border-amber-200">
  {validationErrors.invitation}
</div>
```

## API Integration

### Endpoint: POST /api/invitations/send

**Request:**
```javascript
{
  data: {
    businessId: "B0100001",
    locationId: "L0100001",
    medicResourceId: "user-resource-id",
    email: "doctor@example.com"
  }
}
```

**Response:**
```javascript
{
  success: true,
  message: "Invitație trimisă cu succes",
  data: {
    invitationToken: "abc123",
    invitationUrl: "https://app.com/register?token=abc123",
    sentAt: "2025-10-09T12:00:00Z"
  }
}
```

## User Data Structure

Pentru tracking invitații, backend-ul ar trebui să stocheze în user resource:

```javascript
{
  resource_id: "user-123",
  resource_type: "medic",
  data: {
    medicName: "Dr. Ion Popescu",
    email: "ion.popescu@example.com",
    phone: "+40721234567",
    role: { id: "role-1", name: "doctor" },
    dutyDays: ["Luni", "Marți", "Miercuri"],
    
    // Invitation tracking
    cognitoUserId: null, // Set when user registers
    invitationStatus: "sent", // "not_sent" | "sent" | "accepted"
    invitationSentAt: "2025-10-09T12:00:00Z",
    invitationToken: "abc123" // Current active token
  }
}
```

## Flow Complet

### 1. Creare User Nou

```
1. Admin completează form în UserDrawer
2. Click "Salvează"
3. → addUser(formData)
4. ✅ User creat în backend
5. → handleSendInvitation(savedUser)
6. 📧 POST /api/invitations/send
7. ✅ Backend trimite email cu link de register
8. → Backend updatează user: 
   - invitationStatus = "sent"
   - invitationSentAt = now
9. → Drawer se închide
10. User primește email cu link
```

### 2. Retrimitere Invitație (Edit Mode)

```
1. Admin deschide UserDrawer pentru edit
2. Secțiunea "Invitație Cognito" afișează:
   - Status: "📧 Invitație trimisă"
   - Buton: "↻ Retrimite invitație"
3. Click buton
4. → handleSendInvitation()
5. 📧 POST /api/invitations/send
6. ✅ Backend generează token nou
7. 📧 Backend trimite email nou
8. → Status updated to "sent"
9. ✓ Notificare success în drawer
```

### 3. User Se Înregistrează

```
1. User primește email cu link
2. Click → /register?token=abc123
3. RegisterPage verifică token
4. User completează parolă
5. → Cognito signUp cu invitationToken
6. Lambda Post-confirmation:
   - Actualizează user în DB
   - cognitoUserId = sub
   - invitationStatus = "accepted"
7. User se poate autentifica
```

### 4. Edit User După Înregistrare

```
1. Admin deschide UserDrawer pentru user înregistrat
2. Secțiunea "Invitație Cognito" afișează:
   - Status: "✓ Are cont Cognito"
   - Buton disabled
3. Nu se mai poate trimite invitație
```

## Backend Implementation Required

### 1. POST /api/invitations/send Endpoint

```javascript
// Handler pentru /api/invitations/send
async function handleSendInvitation(req, res) {
  const { businessId, locationId, medicResourceId, email } = req.body.data

  try {
    // 1. Verifică dacă user-ul există
    const user = await getUserByResourceId(medicResourceId)
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilizator nu există' 
      })
    }

    // 2. Verifică dacă user-ul are deja cont Cognito
    if (user.data.cognitoUserId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Utilizatorul are deja cont' 
      })
    }

    // 3. Generează token nou
    const invitationToken = generateUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 zile

    // 4. Salvează invitația în DB
    await saveInvitation({
      token: invitationToken,
      email: email,
      medicResourceId: medicResourceId,
      businessId: businessId,
      locationId: locationId,
      role: user.data.role,
      status: 'pending',
      expiresAt: expiresAt,
      createdAt: new Date()
    })

    // 5. Updatează user resource
    await updateUserResource(medicResourceId, {
      invitationStatus: 'sent',
      invitationSentAt: new Date().toISOString(),
      invitationToken: invitationToken
    })

    // 6. Trimite email
    const invitationUrl = `${process.env.APP_URL}/register?token=${invitationToken}`
    await sendInvitationEmail({
      to: email,
      name: user.data.medicName,
      invitationUrl: invitationUrl,
      expiresAt: expiresAt
    })

    // 7. Return success
    res.status(200).json({
      success: true,
      message: 'Invitație trimisă cu succes',
      data: {
        invitationToken: invitationToken,
        invitationUrl: invitationUrl,
        sentAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error sending invitation:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Eroare la trimiterea invitației' 
    })
  }
}
```

### 2. Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { 
      display: inline-block; 
      padding: 12px 24px; 
      background-color: #2563eb; 
      color: white; 
      text-decoration: none; 
      border-radius: 8px; 
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Bine ai venit în echipă!</h2>
    
    <p>Salut {{name}},</p>
    
    <p>Ai fost invitat să te alături echipei noastre. Pentru a-ți crea contul, te rugăm să accesezi linkul de mai jos:</p>
    
    <a href="{{invitationUrl}}" class="button">Creează cont</a>
    
    <p>Sau copiază și lipește acest link în browser:</p>
    <p><code>{{invitationUrl}}</code></p>
    
    <p>Acest link va expira pe {{expiresAt}}.</p>
    
    <hr>
    <p><small>Dacă nu ai solicitat acest email, îl poți ignora.</small></p>
  </div>
</body>
</html>
```

### 3. Lambda Post-confirmation Update

```javascript
// Lambda Post-confirmation trigger
exports.handler = async (event) => {
  const { invitationToken } = event.request.validationData || {}
  const { email, sub } = event.request.userAttributes
  
  try {
    // 1. Găsește user-ul după email
    const user = await findUserByEmail(email)
    
    if (user) {
      // 2. Updatează cu cognitoUserId
      await updateUserResource(user.resource_id, {
        cognitoUserId: sub,
        invitationStatus: 'accepted',
        invitationAcceptedAt: new Date().toISOString()
      })
      
      console.log(`✅ User ${email} updated with Cognito ID: ${sub}`)
    }
    
    // 3. Marchează invitația ca folosită
    if (invitationToken) {
      await markInvitationUsed(invitationToken)
    }
    
    return event
  } catch (error) {
    console.error('Error in post-confirmation:', error)
    // Nu oprim procesul de confirmare chiar dacă update-ul eșuează
    return event
  }
}
```

## Testing

### Test 1: Creare User + Invitație Automată

```javascript
// În UserDrawer
const formData = {
  medicName: 'Dr. Test User',
  email: 'test@example.com',
  phone: '+40721234567',
  role: { id: 'role-1', name: 'doctor' },
  dutyDays: ['Luni', 'Marți']
}

// Click Salvează
// Verifică:
// 1. User creat în backend
// 2. POST /api/invitations/send apelat automat
// 3. Email trimis cu link de register
// 4. User.invitationStatus = "sent"
```

### Test 2: Retrimitere Invitație

```javascript
// Deschide UserDrawer pentru user existent fără cont
// Verifică că secțiunea Invitație apare
// Click "↻ Retrimite invitație"
// Verifică:
// 1. POST /api/invitations/send apelat
// 2. Token nou generat
// 3. Email nou trimis
// 4. Notificare success în UI
```

### Test 3: User Cu Cont Existent

```javascript
// User cu cognitoUserId setat
// Deschide UserDrawer
// Verifică:
// 1. Status = "✓ Are cont Cognito"
// 2. Buton disabled
// 3. Nu se poate trimite invitație
```

## Error Handling

### Backend Errors

```javascript
// User nu există
{ success: false, error: 'Utilizator nu există' }

// User are deja cont
{ success: false, error: 'Utilizatorul are deja cont' }

// Email fail
{ success: false, error: 'Eroare la trimiterea email-ului' }

// Network error
{ success: false, error: 'Eroare la comunicarea cu serverul' }
```

### Frontend Handling

```javascript
try {
  await sendInvitation(params)
} catch (error) {
  // Afișează în UI
  setValidationErrors({
    invitation: error.message || 'Eroare la trimiterea invitației'
  })
}
```

## Environment Variables

```bash
# .env pentru backend
APP_URL=https://app.example.com
EMAIL_FROM=noreply@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
```

## Security Considerations

### Token Security
- ✅ UUID-uri unice pentru fiecare invitație
- ✅ Expirare după 7 zile
- ✅ Single-use (marchate ca folosite după register)
- ✅ Validare în Lambda Pre-signup

### Email Security
- ✅ Rate limiting (max 5 retrimiteri/oră per user)
- ✅ Verificare email valid înainte de trimitere
- ✅ Link-uri HTTPS only

### Admin Permissions
- ✅ Doar admin/manager pot trimite invitații
- ✅ Token Cognito necesar pentru API call
- ✅ Backend validează permisiunile

## Future Enhancements

- [ ] Bulk invitation sending pentru multiple users
- [ ] Invitation expiry notifications
- [ ] Custom email templates per business
- [ ] Invitation analytics (opened, clicked, registered)
- [ ] Auto-resend după X zile dacă nu s-a înregistrat
- [ ] Invitation history per user
- [ ] Custom invitation message

