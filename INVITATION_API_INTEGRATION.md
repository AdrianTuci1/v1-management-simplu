# Invitation API Integration

Acest document descrie integrarea sistemului de invitații cu arhitectura existentă a aplicației.

## Structura Creată

### 1. InvitationInvoker (`src/data/invoker/InvitationInvoker.js`)

Gestionează comunicarea cu backend-ul pentru invitații:

```javascript
import invitationInvoker from '@/data/invoker/InvitationInvoker'

// Verify invitation token (no auth required)
const result = await invitationInvoker.verifyToken(token)

// Create invitation (admin only)
const invitation = await invitationInvoker.createInvitation({
  email: 'user@example.com',
  role: 'doctor',
  locationIds: ['L0100001']
})

// List invitations (admin only)
const invitations = await invitationInvoker.listInvitations({
  status: 'pending'
})

// Revoke invitation (admin only)
await invitationInvoker.revokeInvitation(invitationId)

// Resend invitation (admin only)
await invitationInvoker.resendInvitation(invitationId)
```

**Endpoints folosite:**
- `GET /api/invitations/verify?token={token}` - Verificare token (fără auth)
- `POST /api/invitations/create` - Creare invitație (cu auth)
- `GET /api/invitations` - Listare invitații (cu auth)
- `POST /api/invitations/{id}/revoke` - Revocare (cu auth)
- `POST /api/invitations/{id}/resend` - Retrimitere (cu auth)

### 2. InvitationRepository (`src/data/repositories/InvitationRepository.js`)

Layer de business logic și caching:

```javascript
import invitationRepository from '@/data/repositories/InvitationRepository'

// Verify with caching
const result = await invitationRepository.verifyToken(token)

// Get cached invitation
const cached = invitationRepository.getCachedInvitation(token)

// Clear cache
invitationRepository.clearCache(token)

// Admin operations
await invitationRepository.createInvitation(data)
await invitationRepository.listInvitations()
await invitationRepository.revokeInvitation(id)
await invitationRepository.resendInvitation(id)
```

**Features:**
- ✅ Cache pentru invitații verificate (5 minute)
- ✅ Error handling consistent
- ✅ Integrare cu `apiClient.js` pentru requests autentificate
- ✅ Direct fetch pentru verificare token (nu necesită auth)

### 3. useInvitations Hook (`src/hooks/useInvitations.js`)

React hook pentru management invitații în componente:

```javascript
import { useInvitations } from '@/hooks/useInvitations'

function InvitationManager() {
  const {
    invitations,
    loading,
    error,
    verifyToken,
    createInvitation,
    listInvitations,
    revokeInvitation,
    resendInvitation,
    clearError
  } = useInvitations()

  // Load invitations on mount
  useEffect(() => {
    listInvitations()
  }, [])

  // Create new invitation
  const handleCreate = async () => {
    try {
      await createInvitation({
        email: 'user@example.com',
        role: 'doctor'
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} onClose={clearError} />}
      
      {invitations.map(inv => (
        <InvitationCard 
          key={inv.id} 
          invitation={inv}
          onRevoke={() => revokeInvitation(inv.id)}
          onResend={() => resendInvitation(inv.id)}
        />
      ))}
    </div>
  )
}
```

## Integrare în RegisterPage

`RegisterPage` folosește `invitationRepository` direct:

```jsx
import invitationRepository from '@/data/repositories/InvitationRepository'

const RegisterPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  useEffect(() => {
    if (token) {
      verifyInvitationToken(token)
    }
  }, [token])
  
  const verifyInvitationToken = async (token) => {
    try {
      const result = await invitationRepository.verifyToken(token)
      
      if (result.valid) {
        setVerification(result.data)
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Eroare la verificarea invitației')
    }
  }
  
  // ... rest of component
}
```

## Backend API Contract

### Verify Token Endpoint

**Request:**
```http
GET /api/invitations/verify?token={token}
Content-Type: application/json
```

**Response (Success):**
```json
{
  "valid": true,
  "data": {
    "email": "user@example.com",
    "invitedBy": "Admin Name",
    "role": "doctor",
    "locationIds": ["L0100001"],
    "expiresAt": "2025-10-16T12:00:00Z"
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "error": "Invitație expirată sau invalidă"
}
```

### Create Invitation Endpoint

**Request:**
```http
POST /api/invitations/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "data": {
    "email": "user@example.com",
    "role": "doctor",
    "locationIds": ["L0100001"],
    "invitedBy": "Admin Name"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invitationId": "inv_123",
    "email": "user@example.com",
    "invitationUrl": "https://app.example.com/register?token=abc123",
    "expiresAt": "2025-10-16T12:00:00Z"
  }
}
```

### List Invitations Endpoint

**Request:**
```http
GET /api/invitations?status=pending&locationId=L0100001
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "invitationId": "inv_123",
      "email": "user@example.com",
      "status": "pending",
      "role": "doctor",
      "invitedBy": "Admin Name",
      "createdAt": "2025-10-09T12:00:00Z",
      "expiresAt": "2025-10-16T12:00:00Z"
    }
  ]
}
```

### Revoke Invitation Endpoint

**Request:**
```http
POST /api/invitations/{invitationId}/revoke
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Invitație revocată cu succes"
}
```

### Resend Invitation Endpoint

**Request:**
```http
POST /api/invitations/{invitationId}/resend
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Invitație retrimisă cu succes",
  "data": {
    "invitationUrl": "https://app.example.com/register?token=new_abc123",
    "expiresAt": "2025-10-16T12:00:00Z"
  }
}
```

## Configurare Environment Variables

Asigură-te că ai următoarele variabile în `.env.local`:

```bash
# API Configuration
VITE_API_URL=https://api.example.com
# sau pentru development:
VITE_API_URL=http://localhost:4000

# Cognito Configuration
VITE_COGNITO_USER_POOL_ID=eu-central-1_XXXXX
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_COGNITO_REGION=eu-central-1
```

## Integrare cu apiClient.js

`InvitationInvoker` folosește două abordări:

### 1. Pentru Verificare Token (fără auth)
```javascript
// Direct fetch - nu necesită autentificare
const response = await fetch(
  `${import.meta.env.VITE_API_URL}${url}`,
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }
)
```

### 2. Pentru Operations cu Auth
```javascript
// Folosește apiRequest din apiClient.js
const response = await apiRequest('invitations', url, {
  method: 'POST',
  body: JSON.stringify(data)
})
```

`apiClient.js` gestionează automat:
- ✅ Token-ul de autentificare din Cognito
- ✅ Header `X-Resource-Type: invitations`
- ✅ Refresh automat al token-ului expirat
- ✅ Error handling consistent
- ✅ Health monitoring

## Export în Barrel Files

Adăugat în barrel exports pentru acces ușor:

**`src/data/invoker/index.js`:**
```javascript
export { default as InvitationInvoker } from './InvitationInvoker.js';
```

**`src/data/repositories/index.js`:**
```javascript
export { invitationRepository } from './InvitationRepository.js';
```

## Testing

### Test verificare token:
```javascript
import invitationRepository from '@/data/repositories/InvitationRepository'

const result = await invitationRepository.verifyToken('test-token')
console.log(result)
// { valid: true, data: {...} }
```

### Test creare invitație:
```javascript
import { useInvitations } from '@/hooks/useInvitations'

const { createInvitation } = useInvitations()

await createInvitation({
  email: 'test@example.com',
  role: 'doctor',
  locationIds: ['L0100001']
})
```

## Security Considerations

### Token Verification
- ✅ Nu necesită autentificare (endpoint public)
- ✅ Backend validează token-ul în baza de date
- ✅ Token-uri sunt UUID-uri unice
- ✅ Expirare automată (7 zile default)

### Admin Operations
- ✅ Toate operațiunile (create, list, revoke, resend) necesită autentificare
- ✅ Token Cognito trimis automat prin `apiClient.js`
- ✅ Backend verifică permisiunile (admin/manager)

### Rate Limiting
- Backend ar trebui să implementeze rate limiting pentru:
  - Verificare token (max 10/min per IP)
  - Creare invitații (max 50/oră per admin)
  - Resend invitații (max 5/oră per invitație)

## Future Enhancements

- [ ] Bulk invitation creation
- [ ] Invitation templates
- [ ] Email customization
- [ ] Invitation analytics
- [ ] Auto-expiry notifications
- [ ] Invitation approval workflow
- [ ] CSV import for bulk invitations

