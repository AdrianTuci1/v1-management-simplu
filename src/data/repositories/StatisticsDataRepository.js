import { db } from "../infrastructure/db";
import { apiRequest, buildResourcesEndpoint } from "../infrastructure/apiClient.js";
import { indexedDb } from "../infrastructure/db.js";

export class StatisticsDataRepository {
  constructor() {
    // No default resourceType - it will be set based on the request type
  }

  // Check if we're using a demo token
  isDemoToken() {
    const authToken = localStorage.getItem('auth-token');
    return authToken === 'demo-jwt-token';
  }

  // Check if in demo mode
  isInDemoMode() {
    return import.meta.env.VITE_DEMO_MODE === 'true' || this.isDemoToken();
  }

  async query(params = {}) {
    // Check if in demo mode (either from .env or from demo button)
    const isDemoMode = this.isInDemoMode();
    
    // In demo mode, try to get from cache first, then generate if needed
    if (isDemoMode) {
      console.log('📊 Demo mode detected: Loading statistics from cache...');
      const statisticsType = params.type || 'business-statistics';
      
      // Try to load from cache first
      try {
        const cached = await db.table('statistics').get(statisticsType);
        if (cached && cached.data) {
          console.log(`✅ Loaded ${statisticsType} from cache:`, cached.data);
          return cached.data;
        }
      } catch (error) {
        console.warn(`⚠️ Could not load ${statisticsType} from cache:`, error);
      }
      
      // If no cache, generate from demo data
      console.log(`📦 No cache found, generating ${statisticsType} from demo data...`);
      if (statisticsType === 'business-statistics') {
        return await this.generateBusinessStatisticsFromDemoData();
      } else if (statisticsType === 'recent-activities') {
        return await this.generateRecentActivitiesFromDemoData();
      }
      
      return null;
    }
    
    try {
      // Determine statistics type from params
      const statisticsType = params.type || 'business-statistics';
      
      // Build the endpoint with businessId-locationId
      const businessId = localStorage.getItem("businessId") || 'B0100001';
      const locationId = localStorage.getItem("locationId") || 'L0100001';
      const endpoint = `/resources/statistics/${businessId}-${locationId}`;
      
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

  async generateBusinessStatisticsFromDemoData() {
    try {
      // Get all demo data
      const [patients, appointments, sales, treatments] = await Promise.all([
        indexedDb.getAll('patients').catch(() => []),
        indexedDb.getAll('appointments').catch(() => []),
        indexedDb.getAll('sales').catch(() => []),
        indexedDb.getAll('treatments').catch(() => [])
      ]);

      // Calculate statistics
      const totalPatients = patients.length;
      const activePatients = patients.filter(p => p.status === 'active').length;
      const totalAppointments = appointments.length;
      
      // Appointment status breakdown
      const appointmentStats = {
        completed: appointments.filter(a => a.status === 'completed').length,
        scheduled: appointments.filter(a => a.status === 'scheduled').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        'in-progress': appointments.filter(a => a.status === 'in-progress').length
      };

      // Revenue calculations
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const completedSales = sales.filter(s => s.status === 'completed');
      const revenueThisMonth = completedSales
        .filter(s => {
          const saleDate = new Date(s.createdAt);
          const now = new Date();
          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, sale) => sum + (sale.total || 0), 0);

      // Monthly revenue data (last 6 months)
      const revenueByMonth = this.generateMonthlyRevenueData(sales);
      
      // Growth calculation (simplified)
      const monthlyGrowth = this.calculateGrowthRate(revenueByMonth);

      const statistics = {
        totalPatients,
        activePatients,
        totalAppointments,
        totalRevenue,
        revenueThisMonth,
        monthlyGrowth,
        appointmentStats,
        revenueByMonth,
        lowStockProducts: await this.getLowStockProductsCount()
      };

      // Store in local database
      await db.table('statistics').put({
        id: 'business-statistics',
        data: statistics,
        timestamp: new Date().toISOString()
      });

      return statistics;
    } catch (error) {
      console.error('Error generating business statistics from demo data:', error);
      // Fallback to basic mock data
      return {
        totalPatients: 0,
        activePatients: 0,
        totalAppointments: 0,
        totalRevenue: 0,
        revenueThisMonth: 0,
        monthlyGrowth: 0,
        appointmentStats: { completed: 0, scheduled: 0, cancelled: 0, 'in-progress': 0 },
        revenueByMonth: [],
        lowStockProducts: 0
      };
    }
  }

  async generateRecentActivitiesFromDemoData() {
    try {
      const [appointments, patients, sales] = await Promise.all([
        indexedDb.getAll('appointments').catch(() => []),
        indexedDb.getAll('patients').catch(() => []),
        indexedDb.getAll('sales').catch(() => [])
      ]);

      const activities = [];

      // Recent appointments
      const recentAppointments = appointments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(appointment => ({
          id: `apt-${appointment.id}`,
          type: 'appointment',
          title: `${appointment.patient?.name || 'Pacient'} - ${appointment.service?.name || 'Serviciu'}`,
          subtitle: `${appointment.date} ${appointment.time} cu ${appointment.doctor?.name || 'Doctor'}`,
          timestamp: appointment.createdAt
        }));

      // Recent patients
      const recentPatients = patients
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .map(patient => ({
          id: `patient-${patient.id}`,
          type: 'patient',
          title: `Pacient nou înregistrat`,
          subtitle: patient.patientName || patient.name,
          timestamp: patient.createdAt
        }));

      // Recent sales
      const recentSales = sales
        .filter(sale => sale.status === 'completed')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .map(sale => ({
          id: `sale-${sale.id}`,
          type: 'payment',
          title: `Plată procesată - ${sale.total} RON`,
          subtitle: `Metodă: ${sale.paymentMethod}`,
          timestamp: sale.createdAt
        }));

      const allActivities = [...recentAppointments, ...recentPatients, ...recentSales]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      // Store in local database
      await db.table('statistics').put({
        id: 'recent-activities',
        data: allActivities,
        timestamp: new Date().toISOString()
      });

      return allActivities;
    } catch (error) {
      console.error('Error generating recent activities from demo data:', error);
      return [];
    }
  }

  generateMonthlyRevenueData(sales) {
    const months = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth = [];
    const now = new Date();
    
    // Generate data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[targetDate.getMonth()];
      
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate.getMonth() === targetDate.getMonth() && 
               saleDate.getFullYear() === targetDate.getFullYear() &&
               sale.status === 'completed';
      });
      
      const revenue = monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const appointments = monthSales.length; // Simplified - in real app would count appointments
      
      revenueByMonth.push({
        month: monthName,
        revenue: Math.round(revenue),
        appointments: appointments
      });
    }
    
    return revenueByMonth;
  }

  calculateGrowthRate(revenueByMonth) {
    if (revenueByMonth.length < 2) return 0;
    
    const current = revenueByMonth[revenueByMonth.length - 1].revenue;
    const previous = revenueByMonth[revenueByMonth.length - 2].revenue;
    
    if (previous === 0) return 0;
    
    return Math.round(((current - previous) / previous) * 100 * 10) / 10; // Round to 1 decimal
  }

  async getLowStockProductsCount() {
    try {
      const products = await indexedDb.getAll('products');
      return products.filter(p => p.stock <= p.reorderLevel).length;
    } catch (error) {
      console.warn('Error getting low stock products count:', error);
      return 0;
    }
  }
}

export default StatisticsDataRepository;
