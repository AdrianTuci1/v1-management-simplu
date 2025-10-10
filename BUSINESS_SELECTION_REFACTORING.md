# Business Selection Refactoring

## Overview

This document describes the refactoring of the authentication and business information system to support multiple businesses per user.

## Changes Summary

### New Authentication Response Format

The authentication API now returns a response with the following structure:

```json
{
  "success": true,
  "user": {
    "userId": "...",
    "userName": "...",
    "email": "...",
    "businesses": [
      {
        "businessId": "B010001",
        "businessName": "Dental Practice XYZ",
        "locations": [
          {
            "locationId": "L010001",
            "locationName": "Main Clinic",
            "role": "admin"
          }
        ]
      }
    ]
  }
}
```

### Architecture Changes

#### 1. AuthRepository Enhancements

**File**: `src/data/repositories/AuthRepository.js`

New methods added:
- `getBusinesses()` - Returns all businesses the user has access to
- `getSelectedBusiness()` - Returns the currently selected business
- `setSelectedBusiness(businessId)` - Stores the selected business ID
- `isBusinessSelected()` - Checks if a business is selected
- `clearSelectedBusiness()` - Clears the selected business
- `getLocationsForSelectedBusiness()` - Gets locations for the selected business

#### 2. AuthInvoker Updates

**File**: `src/data/invoker/AuthInvoker.js`

- Removed dependency on `businessId` from storage
- API now returns all businesses for the authenticated user
- Added validation for the new response format

#### 3. New BusinessSelector Component

**File**: `src/components/BusinessSelector.jsx`

A new component that displays all available businesses and allows the user to select one.

Features:
- Displays business name and ID
- Shows accessible locations for each business
- Displays user roles for each location
- Auto-selects if only one business is available

#### 4. AuthService Refactoring

**File**: `src/services/authService.js`

Major changes:
- Removed dependency on `BusinessInfoRepository`
- All business and location data now comes from `AuthRepository`
- New methods:
  - `getBusinesses()` - Get user's businesses
  - `getSelectedBusiness()` - Get selected business
  - `setSelectedBusiness(businessId)` - Set selected business
  - `isBusinessSelected()` - Check if business is selected

Updated methods:
- `initialize()` - Auto-selects business if user has only one
- `getAccessibleLocations()` - Gets locations from selected business
- `getDefaultLocation()` - Gets default location from selected business
- `shouldDenyAccess()` - Checks access based on selected business

#### 5. App.jsx Integration

**File**: `src/App.jsx`

New features:
- Added `showBusinessSelector` state
- Shows `BusinessSelector` component when user has multiple businesses
- Auto-initialization with selected business
- Reload after business selection

Flow:
1. User authenticates
2. If multiple businesses → show BusinessSelector
3. User selects business → store in localStorage
4. Reload to initialize with selected business
5. Continue with normal flow

#### 6. LocationSwitcher Updates

**File**: `src/components/LocationSwitcher.jsx`

- Removed dependency on `BusinessInfoRepository`
- Now gets locations directly from selected business in `AuthRepository`
- Simplified logic

#### 7. Removed Components

The following files were removed as they are no longer needed:
- `src/data/repositories/BusinessInfoRepository.js`
- `src/data/invoker/BusinessInfoInvoker.js`

All references to these components have been removed from:
- `src/data/repositories/index.js`
- `src/data/invoker/index.js`
- `src/data/DataFacade.js`

#### 8. Updated Components

The following components were updated to use the new storage structure:
- `src/components/drawers/UserDrawer.jsx` - Uses `selected-business-id` instead of `business-info`
- `src/services/externalServices.js` - Updated `getBusinessId()` method
- `src/services/externalApiService.js` - Updated `getBusinessId()` method
- `src/data/invoker/UserRolesInvoker.js` - Updated `getBusinessIdFromStorage()` method
- `src/hooks/usePermissions.js` - Uses `selected-location` for role information
- `src/components/NewSidebar.jsx` - Uses `selected-location` for role information
- `src/components/drawers/DrawerRegistry.jsx` - Uses `selected-location` for role information
- `src/components/drawers/DrawerRegistry.js` - Uses `selected-location` for role information
- `src/components/drawers/UserProfileDrawer.jsx` - Uses `selected-location` for role information

## Data Flow

### Authentication Flow

1. **User logs in** → `AuthScreen.jsx`
2. **Auth request** → `AuthInvoker.getCurrentUser()`
3. **Response stored** → `AuthRepository.storeUserData()`
4. **Business check**:
   - If 1 business → auto-select it
   - If multiple businesses → show `BusinessSelector`
5. **Business selected** → `AuthRepository.setSelectedBusiness()`
6. **App reloads** → Initialize with selected business

### Location Flow

1. **App initialized** → `authService.initialize()`
2. **Get accessible locations** → `authRepository.getAccessibleLocations()`
3. **Filter by role** → Only locations with role !== 'user'
4. **Set default location** → First accessible location

## Storage Structure

### localStorage Keys

- `auth-user-data` - Complete authentication response (new format with businesses array)
- `selected-business-id` - ID of the currently selected business (replaces `business-info`)
- `selected-location` - Currently selected location object (now includes role)
- `cognito-data` - Cognito authentication data

### Deprecated localStorage Keys

- `business-info` - **REMOVED** - Was used to store business information, now replaced by `selected-business-id` and data from auth response

## Migration Notes

### For Developers

If you have code that uses `BusinessInfoRepository`:

**Before:**
```javascript
import businessInfoRepository from '../data/repositories/BusinessInfoRepository.js'

const businessInfo = await businessInfoRepository.getBusinessInfo()
const locations = businessInfo.locations
```

**After:**
```javascript
import authRepository from '../data/repositories/AuthRepository.js'

const selectedBusiness = authRepository.getSelectedBusiness()
const locations = selectedBusiness.locations
```

### For API Integration

The authentication endpoint (`/auth/me`) should now return the new format with `businesses` array instead of a single `businessId`.

## Demo Mode

In demo mode, the system creates a single demo business with three locations:
- Premier Central (admin role)
- Filiala Pipera (manager role)
- Centrul Medical Militari (user role - no access)

## Testing

To test the business selection flow:

1. Create a user with multiple businesses
2. Log in
3. Verify BusinessSelector appears
4. Select a business
5. Verify app initializes with correct business data
6. Check LocationSwitcher shows correct locations

## Benefits

1. **Multi-business support** - Users can access multiple businesses
2. **Simplified architecture** - Single source of truth (AuthRepository)
3. **Better separation of concerns** - Business data tied to authentication
4. **Reduced API calls** - All data received in authentication response
5. **Improved user experience** - Clear business selection interface

## Future Enhancements

Potential improvements:
1. Business switching without page reload
2. Remember last selected business per user
3. Business search/filter for users with many businesses
4. Business-specific settings and preferences
5. Business administration features

