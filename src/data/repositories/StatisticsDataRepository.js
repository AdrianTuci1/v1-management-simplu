import { db } from "../infrastructure/db";

export class StatisticsDataRepository {
  constructor() {
    // No default resourceType - it will be set based on the request type
  }

  async query(params = {}) {
    try {
      // Build the endpoint with businessId-locationId
      const businessId = localStorage.getItem("businessId") || 'B0100001';
      const locationId = localStorage.getItem("locationId") || 'L0100001';
      const authToken = localStorage.getItem('auth-token');
      
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const url = `${baseUrl}/api/resources/statistics/${businessId}-${locationId}`;
      
      // Determine statistics type from params
      const statisticsType = params.type || 'business-statistics';
      
      const headers = {
        "Content-Type": "application/json",
        "X-Resource-Type": statisticsType, // This will be either 'business-statistics' or 'recent-activities'
        "Authorization": `Bearer ${authToken}`,
      };
      
      console.log('Making statistics API request:', {
        url: url,
        method: 'GET',
        statisticsType: statisticsType,
        headers: headers
      });
      
      const res = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const response = await res.json();
      
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
