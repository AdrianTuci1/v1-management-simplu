import { db } from "../infrastructure/db";
import { apiRequest, buildResourcesEndpoint } from "../infrastructure/apiClient.js";

export class StatisticsDataRepository {
  constructor() {
    // No default resourceType - it will be set based on the request type
  }

  async query(params = {}) {
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
