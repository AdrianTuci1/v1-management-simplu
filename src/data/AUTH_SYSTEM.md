# Auth System Documentation

## Overview

The auth system has been refactored to use a dedicated AuthInvoker and AuthRepository pattern that integrates with the `/api/me` endpoint. This system handles user authentication data from Cognito and maps user roles to locations.

## Architecture

### AuthInvoker (`src/data/invoker/AuthInvoker.js`)

Handles API communication with the `/api/me` endpoint:

- **`getCurrentUser()`**: Calls `/api/me` to fetch current user data
- **`getUserIdFromAuth()`**: Extracts user ID from Cognito auth data
- **`getBusinessIdFromStorage()`**: Gets business ID from localStorage
- **`getAccessToken()`**: Retrieves access token for API authentication

### AuthRepository (`src/data/repositories/AuthRepository.js`)

Manages auth data storage and provides business logic:

- **`getCurrentUser()`**: Fetches and caches user data
- **`getLocationsWithRoles()`**: Returns user's locations with their roles
- **`getAccessibleLocations()`**: Filters locations where user has valid roles
- **`getUserRoleForLocation(locationId)`**: Gets user's role for specific location
- **`canAccessLocation(locationId)`**: Checks if user can access a location
- **`getDefaultLocation()`**: Returns user's default accessible location
- **`hasAdminAccess()`**: Checks if user has admin role anywhere
- **`shouldDenyAccess()`**: Determines if user should be denied access

## Data Format

The `/api/me` endpoint returns data in this format:

```javascript
{
  success: true,
  user: {
    userId: "user-123",
    userName: "John Doe", 
    email: "john@example.com",
    businessId: "B0100001",
    locations: [
      {
        locationId: "L0100001",
        locationName: "Premier Central",
        role: "admin"
      },
      {
        locationId: "L0100002", 
        locationName: "Filiala Pipera",
        role: "manager"
      },
      {
        locationId: "L0100003",
        locationName: "Centrul Medical Militari", 
        role: "user"  // No access
      }
    ]
  }
}
```

## Integration with App.jsx

The App.jsx component uses the auth service which now:

1. **Initializes auth data**: Calls `authService.initialize()` which uses the new AuthRepository
2. **Checks access permissions**: Uses `authService.shouldDenyAccess()` to determine if user can access the app
3. **Sets default location**: Uses `authService.getDefaultLocation()` to set user's default location
4. **Handles Cognito authentication**: When user authenticates via Cognito, stores the data and re-initializes the app

## Role-Based Access Control

### Role Types
- **`admin`**: Full access to location
- **`manager`**: Management access to location  
- **`user`**: No access (used to indicate locations where user has no permissions)

### Access Logic
- Users can only access locations where they have roles other than `user`
- The system filters out locations with `user` role when determining accessible locations
- Admin access is determined by having `admin` role in any location

## Caching Strategy

- Auth data is cached in localStorage under `auth-user-data` key
- If API call fails, cached data is used as fallback
- Data is automatically refreshed when user re-authenticates

## API Authentication

The `apiClient.js` has been updated to automatically include Bearer tokens for auth requests:

```javascript
// For auth requests, automatically include Authorization header
if (resourceType === 'auth') {
  const savedCognitoData = localStorage.getItem('cognito-data');
  if (savedCognitoData) {
    const userData = JSON.parse(savedCognitoData);
    authToken = userData.access_token || userData.id_token;
  }
}
```

## Demo Mode Support

The system maintains backward compatibility with demo mode:

- In demo mode, uses mock data instead of calling `/api/me`
- Converts old location format to new format for consistency
- Preserves existing demo functionality

## Testing

Comprehensive tests are available in `src/data/repositories/__tests__/AuthRepository.test.js` covering:

- Data fetching and caching
- Location access control
- Role-based permissions
- Error handling and fallbacks

## Migration from Old System

The auth service maintains backward compatibility:

1. **New format priority**: First tries to use data from AuthRepository
2. **Fallback to old format**: If new data isn't available, falls back to old location format
3. **Gradual migration**: Existing code continues to work while new system is adopted

## Usage Examples

```javascript
// Get user's accessible locations
const accessibleLocations = authRepository.getAccessibleLocations();

// Check if user can access specific location
const canAccess = authRepository.canAccessLocation('L0100001');

// Get user's role for location
const role = authRepository.getUserRoleForLocation('L0100001');

// Check admin access
const isAdmin = authRepository.hasAdminAccess();
```
