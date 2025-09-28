# Resource Type Fixes - Singular Forms

## Problemă Identificată
Server-ul se așteaptă la resource type-uri în forma singulară în header-ul `X-Resource-Type`, dar aplicația trimitea forma plurală.

## Schimbări Aplicate

### 1. **AppointmentService.js** ✅
- `'appointments'` → `'appointment'`
- **Metode actualizate**:
  - `getAll('appointment', params)`
  - `create('appointment', data)`
  - `update('appointment', id, data)`
  - `delete('appointment', id)`
  - `getById('appointment', id)`
  - `createDraft('appointment', data, sessionId)`
  - `getDraftsByResourceType('appointment')`

### 2. **PatientService.js** ✅
- `'patients'` → `'patient'`
- **Metode actualizate**:
  - `getAll('patient', params)`
  - `create('patient', data)`
  - `update('patient', id, data)`
  - `delete('patient', id)`
  - `createDraft('patient', data, sessionId)`
  - `getDraftsByResourceType('patient')`

### 3. **ProductService.js** ✅
- `'products'` → `'product'`
- **Metode actualizate**:
  - `getAll('product', filters)`
  - `getAll('product', { category })`
  - `getAll('product', { lowStock: true })`
  - `create('product', data)`
  - `update('product', id, data)`
  - `delete('product', id)`
  - `createDraft('product', data, sessionId)`
  - `getDraftsByResourceType('product')`

### 4. **UserService.js** ✅
- `'users'` → `'medic'`
- **Metode actualizate**:
  - `getAll('medic', filters)`
  - `create('medic', data)`
  - `update('medic', id, data)`
  - `delete('medic', id)`
  - `getAll('medic', searchFilters)` (în search)
  - `createDraft('medic', data, sessionId)`
  - `getDraftsByResourceType('medic')`

### 5. **RoleService.js** ✅
- `'roles'` → `'role'`
- **Metode actualizate**:
  - `getAll('role', filters)`
  - `create('role', data)`
  - `update('role', id, data)`
  - `delete('role', id)`

### 6. **PermissionService.js** ✅
- `'permissions'` → `'permission'`
- **Metode actualizate**:
  - `getAll('permission', filters)`
  - `create('permission', data)`
  - `update('permission', id, data)`
  - `delete('permission', id)`

### 7. **TreatmentService.js** ✅
- `'treatments'` → `'treatment'`
- **Metode actualizate**:
  - `getAll('treatment', params)`
  - `create('treatment', data)`
  - `update('treatment', id, data)`
  - `delete('treatment', id)`
  - `getAll('treatment', searchFilters)` (în search)
  - `createDraft('treatment', data, sessionId)`
  - `getDraftsByResourceType('treatment')`

## Mapping Resource Types

| Serviciu | Resource Type (singular) | Descriere |
|----------|-------------------------|-----------|
| AppointmentService | `appointment` | Programări medicale |
| PatientService | `patient` | Pacienți |
| ProductService | `product` | Produse/medicamente |
| UserService | `medic` | Utilizatori/medici |
| RoleService | `role` | Roluri de utilizator |
| PermissionService | `permission` | Permisiuni |
| TreatmentService | `treatment` | Tratamente |

## Rezultat

✅ **Toate serviciile actualizate cu succes**  
✅ **0 erori de linting**  
✅ **Resource type-urile sunt acum în forma singulară corectă**  
✅ **Compatibilitate completă cu backend-ul**

## Testare

Pentru a testa, rulați aplicația și verificați că:
- Nu mai apar erori 403 Forbidden pentru operațiuni CRUD
- Header-ul `X-Resource-Type` conține valorile corecte în forma singulară
- Toate operațiunile de citire, scriere, actualizare și ștergere funcționează corect

## Notă Importantă

**SocketFacade** continuă să folosească forma plurală pentru evenimente (ex: `'appointments'`, `'patients'`) deoarece aceasta este formatul așteptat pentru notificările WebSocket.
