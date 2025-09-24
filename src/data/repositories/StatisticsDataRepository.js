import { db } from "../infrastructure/db";
import { apiRequest, buildResourcesEndpoint } from "../infrastructure/apiClient.js";

export class StatisticsDataRepository {
  constructor() {
    // No default resourceType - it will be set based on the request type
  }

  async query(params = {}) {
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    
    // In demo mode, generate mock statistics data
    if (isDemoMode) {
      console.log('Demo mode: Generating mock statistics data');
      const statisticsType = params.type || 'business-statistics';
      
      if (statisticsType === 'business-statistics') {
        const mockData = {
          totalPatients: 1247,
          totalAppointments: 3421,
          totalRevenue: 156780,
          monthlyGrowth: 12.5,
          appointmentStats: {
            completed: 2890,
            scheduled: 531,
            cancelled: 156
          },
          revenueByMonth: [
            { month: 'Ian', revenue: 12500, appointments: 245 },
            { month: 'Feb', revenue: 13200, appointments: 267 },
            { month: 'Mar', revenue: 11800, appointments: 234 },
            { month: 'Apr', revenue: 14200, appointments: 289 },
            { month: 'Mai', revenue: 15800, appointments: 312 },
            { month: 'Iun', revenue: 16500, appointments: 328 }
          ]
        };
        
        // Store in local database
        await db.table('statistics').put({
          id: 'business-statistics',
          data: mockData,
          timestamp: new Date().toISOString()
        });
        
        return mockData;
      } else if (statisticsType === 'recent-activities') {
        const mockActivities = [
          { id: 1, type: 'appointment', description: 'Programare nouă cu Dr. Popescu', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { id: 2, type: 'patient', description: 'Pacient nou înregistrat', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
          { id: 3, type: 'payment', description: 'Plată procesată - 450 RON', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() }
        ];
        
        await db.table('statistics').put({
          id: 'recent-activities',
          data: mockActivities,
          timestamp: new Date().toISOString()
        });
        
        return mockActivities;
      }
      
      return null;
    }
    
    try {
      // Determine statistics type from params
      const statisticsType = params.type || 'business-statistics';
      
      // Build the endpoint with businessId-locationId
      const businessId = localStorage.getItem("businessId") || 'B0100001';
      const locationId = localStorage.getItem("locationId") || 'L0100001';
      const endpoint = `/api/resources/statistics/${businessId}-${locationId}`;
      
      console.log('Making statistics API request:', {
        endpoint: endpoint,
        method: 'GET',
        statisticsType: statisticsType
      });
      
      const response = await apiRequest(statisticsType, endpoint, { method: 'GET' });
      
      // Handle the response based on statistics type
      if (statisticsType === 'business-statistics') {
        if (response && response.success && response.data) {
          // Store in local database for caching
          await db.table('statistics').put({
            id: 'business-statistics',
            data: response.data,
            meta: response.meta,
            timestamp: new Date().toISOString()
          });
          
          return response.data;
        }
        throw new Error('Invalid response format for business statistics');
      } else if (statisticsType === 'recent-activities') {
        if (response && response.success && Array.isArray(response.data)) {
          // Store in local database for caching
          await db.table('statistics').put({
            id: 'recent-activities',
            data: response.data,
            meta: response.meta,
            timestamp: new Date().toISOString()
          });
          
          return response.data;
        }
        throw new Error('Invalid response format for recent activities');
      }
      
      return response;
    } catch (error) {
      console.error('Statistics API request failed:', error);
      throw error;
    }
  }



  async getCachedBusinessStatistics() {
    try {
      const cached = await db.table('statistics').get('business-statistics');
      if (cached && cached.data) {
        return cached.data;
      }
    } catch (error) {
      console.warn('Failed to get cached business statistics:', error);
    }
    return null;
  }

  async getCachedRecentActivities() {
    try {
      const cached = await db.table('statistics').get('recent-activities');
      if (cached && cached.data) {
        return cached.data;
      }
    } catch (error) {
      console.warn('Failed to get cached recent activities:', error);
    }
    return null;
  }
}

export default StatisticsDataRepository;
