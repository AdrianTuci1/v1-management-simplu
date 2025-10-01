# AWS Cognito - Google Federation Setup

## Overview

Pentru a implementa corect autentificarea cu Google, trebuie să configurezi Google ca **Identity Provider Federat** în AWS Cognito User Pool.

## Pași de Configurare

### Pas 1: Configurare Google OAuth Credentials

1. Accesează [Google Cloud Console](https://console.cloud.google.com/)
2. Creează un proiect nou sau selectează unul existent
3. Navighează la **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Selectează **Web application**

**IMPORTANT - Authorized redirect URIs:**
```
https://YOUR_COGNITO_DOMAIN.auth.REGION.amazoncognito.com/oauth2/idpresponse
```

Exemplu:
```
https://your-app-name.auth.eu-central-1.amazoncognito.com/oauth2/idpresponse
```

6. Salvează:
   - **Client ID**
   - **Client Secret**

### Pas 2: Configurare AWS Cognito User Pool

#### 2.1 Accesează Cognito Console

1. Deschide [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Selectează User Pool-ul tău: `eu-central-1_KUaE0MTcQ`

#### 2.2 Adaugă Google ca Identity Provider

1. În User Pool, navighează la **Sign-in experience**
2. Click **Federated identity provider sign-in**
3. Click **Add identity provider**
4. Selectează **Google**
5. Completează:
   - **Google app ID**: Client ID de la Google
   - **App secret**: Client Secret de la Google
   - **Authorized scopes**: `profile email openid`
6. Salvează

#### 2.3 Configurare App Client

1. Navighează la **App integration** > **App clients**
2. Selectează app client-ul: `ar2m2qg3gp4a0b4cld09aegdb`
3. Click **Edit Hosted UI settings**
4. La **Identity providers**, selectează:
   - ✅ Cognito User Pool
   - ✅ Google
5. La **Allowed callback URLs**, adaugă:
   ```
   http://localhost:5173/
   https://your-production-domain.com/
   ```
6. La **Allowed sign-out URLs**, adaugă:
   ```
   http://localhost:5173/
   https://your-production-domain.com/
   ```
7. Salvează

#### 2.4 Configurare App Client Settings

1. În același app client, verifică:
   - **Allowed OAuth Flows**: 
     - ✅ Authorization code grant
     - ✅ Implicit grant
   - **Allowed OAuth Scopes**:
     - ✅ openid
     - ✅ email
     - ✅ profile

### Pas 3: Obține Cognito Domain

1. În User Pool, navighează la **App integration** > **Domain**
2. Dacă nu ai un domain:
   - Click **Create Cognito domain**
   - Alege un prefix unic (ex: `your-app-name`)
   - Salvează
3. Notează domain-ul: `https://your-app-name.auth.eu-central-1.amazoncognito.com`

### Pas 4: Actualizare Cod

Trebuie să folosim **Cognito Hosted UI** sau **Cognito SDK** pentru federația cu Google.

## Verificare Configurare

### Testare URL Hosted UI

```
https://YOUR_DOMAIN.auth.REGION.amazoncognito.com/oauth2/authorize?
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  scope=openid+email+profile&
  redirect_uri=http://localhost:5173/&
  identity_provider=Google
```

Înlocuiește:
- `YOUR_DOMAIN` cu domain-ul Cognito
- `REGION` cu `eu-central-1`
- `YOUR_CLIENT_ID` cu `ar2m2qg3gp4a0b4cld09aegdb`

Dacă URL-ul funcționează și te redirectează la Google, configurarea este corectă.

## Informații Necesare

După configurare, vei avea nevoie de:

```env
VITE_COGNITO_USER_POOL_ID=eu-central-1_KUaE0MTcQ
VITE_COGNITO_CLIENT_ID=ar2m2qg3gp4a0b4cld09aegdb
VITE_COGNITO_REGION=eu-central-1
VITE_COGNITO_DOMAIN=your-app-name.auth.eu-central-1.amazoncognito.com
```

## Next Steps

După ce ai configurat Cognito cu Google:
1. Vom actualiza codul pentru a folosi Cognito Hosted UI
2. Vom elimina integrarea directă @react-oauth/google
3. Vom folosi fluxul OAuth standard prin Cognito

---

**IMPORTANT**: Fără această configurare în AWS Cognito, autentificarea cu Google nu va funcționa corect în aplicația ta.

