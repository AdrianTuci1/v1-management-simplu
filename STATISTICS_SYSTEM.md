# Statistics System

## Overview

The statistics system provides real-time KPI data and recent activities for the business dashboard. It integrates with the backend API to fetch live data and includes local caching for offline functionality.

## Architecture

### Components

1. **StatisticsDataRepository** (`src/data/repositories/StatisticsDataRepository.js`)
   - Handles API communication with the backend using businessId-locationId pattern
   - Implements query method compatible with GetCommand
   - Manages local caching in IndexedDB
   - Provides fallback mechanisms for offline scenarios

2. **StatisticsDataInvoker** (`src/data/invoker/StatisticsDataInvoker.js`)
   - Implements the Command pattern using GetCommand without modifications
   - Provides direct methods for easier access
   - Handles error recovery and caching

3. **useStatistics Hook** (`src/hooks/useStatistics.js`)
   - React hook for managing statistics state
   - Provides loading states, error handling, and refresh functionality
   - Auto-loads data on component mount

4. **DashboardHome Component** (`src/components/views/DashboardHome.jsx`)
   - Updated to use real data from the backend
   - Displays KPI cards and recent activities
   - Includes refresh functionality and loading states

## API Integration

### Endpoints

- **Business Statistics**: `GET /api/resources/statistics/{businessId}-{locationId}`
  - Header: `X-Resource-Type: business-statistics`
  - Returns: KPI data (registered patients, scheduled visits, etc.)

- **Recent Activities**: `GET /api/resources/statistics/{businessId}-{locationId}`
  - Header: `X-Resource-Type: recent-activities`
  - Returns: Array of recent activities

### Response Formats

#### Business Statistics Response
```json
{
  "success": true,
  "data": {
    "registeredPatients": 1,
    "scheduledVisits": 2,
    "completedVisits": 0,
    "canceledVisits": 0
  },
  "meta": {
    "businessId": "B0100001",
    "locationId": "L0100001",
    "statisticsType": "business-statistics",
    "timestamp": "2025-08-26T19:34:22.098Z",
    "operation": "business-statistics"
  }
}
```

#### Recent Activities Response
```json
{
  "success": true,
  "data": [
    {
      "id": "18",
      "resourceType": "appointment",
      "resourceId": "ap2508-00002",
      "activityType": "appointment",
      "title": "Programare",
      "description": "Programare nouă sau actualizată",
      "status": "scheduled",
      "updatedAt": "2025-08-26T01:18:59.835Z",
      "createdAt": "2025-08-25T21:33:26.566Z"
    }
  ],
  "meta": {
    "businessId": "B0100001",
    "locationId": "L0100001",
    "statisticsType": "recent-activities",
    "timestamp": "2025-08-26T19:37:14.585Z",
    "operation": "recent-activities"
  }
}
```

## Usage

### Basic Usage in Components

```jsx
import { useStatistics } from '../hooks/useStatistics.js'

const MyComponent = () => {
  const { 
    businessStatistics, 
    recentActivities, 
    loading, 
    error, 
    refresh 
  } = useStatistics()

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      <button onClick={refresh}>Refresh Data</button>
      
      {/* Display KPI data */}
      {businessStatistics && (
        <div>
          <p>Registered Patients: {businessStatistics.registeredPatients}</p>
          <p>Scheduled Visits: {businessStatistics.scheduledVisits}</p>
        </div>
      )}
      
      {/* Display recent activities */}
      {recentActivities.map(activity => (
        <div key={activity.id}>
          <h3>{activity.title}</h3>
          <p>{activity.description}</p>
        </div>
      ))}
    </div>
  )
}
```

### Direct Repository Usage

```javascript
import StatisticsDataRepository from '../data/repositories/StatisticsDataRepository.js'

const repository = new StatisticsDataRepository()

// Fetch business statistics
const stats = await repository.getBusinessStatistics()

// Fetch recent activities
const activities = await repository.getRecentActivities()

// Get cached data
const cachedStats = await repository.getCachedBusinessStatistics()
```

## Features

### Real-time Data
- Fetches live data from the backend API
- Automatic refresh capabilities
- Real-time updates for dashboard metrics

### Offline Support
- Local caching in IndexedDB
- Fallback to cached data when API is unavailable
- Graceful degradation for offline scenarios

### Error Handling
- Comprehensive error handling and recovery
- User-friendly error messages
- Automatic retry mechanisms

### Loading States
- Loading indicators during data fetch
- Skeleton states for better UX
- Disabled states during operations

## Database Schema

The system uses a new `statistics` table in IndexedDB:

```javascript
statistics: 'id, timestamp'
```

Stored data includes:
- `id`: Unique identifier ('business-statistics' or 'recent-activities')
- `data`: The actual statistics or activities data
- `meta`: Metadata from the API response
- `timestamp`: When the data was last updated

## Configuration

### Environment Variables

Make sure to set the API URL in your environment:

```env
VITE_API_URL=https://your-api-domain.com
```

### Database Migration

The system automatically adds the `statistics` table to the existing database schema. No manual migration is required.

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live updates
2. **Data Analytics**: Historical data analysis and trends
3. **Custom KPIs**: User-configurable dashboard metrics
4. **Export Functionality**: Export statistics to various formats
5. **Advanced Caching**: Intelligent cache invalidation and prefetching
