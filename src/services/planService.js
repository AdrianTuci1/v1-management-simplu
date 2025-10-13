import { apiRequest, buildResourcesEndpoint } from "../data/infrastructure/apiClient.js";

/**
 * PlanService
 * Resource type: 'plan'
 * Uses unified resources API: /api/resources/{businessId}-{locationId}
 * Header: X-Resource-Type: plan
 * Searches plans by patientId using: GET /resources/businessId-locationId/search/data-field/patientId?fieldValue={id}&resourceType=plan
 */
class PlanService {
  constructor() {
    this.resourceType = "plan";
  }

  /**
   * Get the plan for a specific patient.
   * Uses the search endpoint to find plans by patientId field value.
   * Returns an array of plan items: {
   *   id: string,
   *   toothNumber?: number | null,
   *   title: string,
   *   durationMinutes?: number,
   *   price?: number,
   *   notes?: string,
   *   isFromChart?: boolean,
   *   treatmentId?: string
   * }
   */
  async getPlan(patientId) {
    if (!patientId) return [];
    
    try {
      const endpoint = buildResourcesEndpoint(`/search/data-field/patientId`);
      const query = new URLSearchParams({ 
        fieldValue: String(patientId)
      }).toString();
      const url = `${endpoint}?${query}`;
      
      const response = await apiRequest(this.resourceType, url, { method: "GET" });
      const payload = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      
      // If no plan found, return empty array
      if (payload.length === 0) {
        return [];
      }
      
      // Get the first plan (should be only one per patient)
      const planData = payload[0];
      const items = planData?.data?.plan || planData?.plan || [];
      
      return items.map((item, index) => ({
        id: String(item.id || `${Date.now()}-${index}`),
        toothNumber: item.toothNumber ?? null,
        title: item.title || "",
        durationMinutes: Number.isFinite(item.durationMinutes) ? item.durationMinutes : null,
        price: Number.isFinite(item.price) ? item.price : null,
        notes: item.notes || "",
        isFromChart: Boolean(item.isFromChart),
        treatmentId: item.treatmentId || null,
      }));
    } catch (error) {
      // If no plan found (404), return empty array
      if (error.status === 404) {
        return [];
      }
      console.error("Error fetching plan:", error);
      throw error;
    }
  }

  /**
   * Create or update the plan for a patient.
   * If plan exists, updates it; otherwise creates a new one.
   */
  async upsertPlan(patientId, items) {
    if (!patientId) return null;
    
    try {
      // First, try to get existing plan
      const existingPlans = await this.getPlan(patientId);
      
      const planData = {
        patientId: String(patientId),
        plan: items.map((item, index) => ({
          id: item.id,
          toothNumber: item.toothNumber,
          title: item.title,
          durationMinutes: item.durationMinutes,
          price: item.price,
          notes: item.notes,
          isFromChart: item.isFromChart || false,
          treatmentId: item.treatmentId,
          order: index, // Preserve order
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingPlans.length > 0) {
        // Update existing plan
        const endpoint = buildResourcesEndpoint(`/search/data-field/patientId`);
        const query = new URLSearchParams({ 
          fieldValue: String(patientId)
        }).toString();
        const searchUrl = `${endpoint}?${query}`;
        
        const searchResponse = await apiRequest(this.resourceType, searchUrl, { method: "GET" });
        const existingPlan = searchResponse?.data?.[0] || searchResponse?.[0];
        
        if (existingPlan?.id) {
          const updateEndpoint = buildResourcesEndpoint(`/${existingPlan.id}`);
          const body = JSON.stringify({ 
            data: planData
          });
          
          const response = await apiRequest(this.resourceType, updateEndpoint, { 
            method: "PUT", 
            body 
          });
          return response;
        }
      }
      
      // Create new plan
      const endpoint = buildResourcesEndpoint("");
      const body = JSON.stringify({ 
        data: planData
      });
      
      const response = await apiRequest(this.resourceType, endpoint, { 
        method: "POST", 
        body 
      });
      return response;
      
    } catch (error) {
      console.error("Error upserting plan:", error);
      throw error;
    }
  }

  /**
   * Delete the plan for a patient.
   */
  async deletePlan(patientId) {
    if (!patientId) return { success: false };
    
    try {
      const endpoint = buildResourcesEndpoint(`/search/data-field/patientId`);
      const query = new URLSearchParams({ 
        fieldValue: String(patientId)
      }).toString();
      const searchUrl = `${endpoint}?${query}`;
      
      const searchResponse = await apiRequest(this.resourceType, searchUrl, { method: "GET" });
      const existingPlan = searchResponse?.data?.[0] || searchResponse?.[0];
      
      if (existingPlan?.id) {
        const deleteEndpoint = buildResourcesEndpoint(`/${existingPlan.id}`);
        await apiRequest(this.resourceType, deleteEndpoint, { method: "DELETE" });
        return { success: true };
      }
      
      return { success: false, message: "Plan not found" };
    } catch (error) {
      console.error("Error deleting plan:", error);
      return { success: false, error };
    }
  }

  /**
   * Generate a PDF for the plan.
   * Returns { pdfUrl?: string, dataUrl?: string }
   */
  async generatePdf(patientId, items) {
    if (!patientId) return { dataUrl: "" };
    
    try {
      const endpoint = buildResourcesEndpoint("/pdf");
      const query = new URLSearchParams({ 
        fieldValue: String(patientId)
      }).toString();
      const url = `${endpoint}?${query}`;
      
      const body = JSON.stringify({ 
        data: {
          patientId: String(patientId),
          plan: items
        }
      });
      
      return await apiRequest(this.resourceType, url, { method: "POST", body });
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  }

  /**
   * Send the plan to the patient (email/SMS per backend implementation).
   */
  async sendToPatient(patientId, items) {
    if (!patientId) return { success: false };
    
    try {
      const endpoint = buildResourcesEndpoint("/send");
      const query = new URLSearchParams({ 
        fieldValue: String(patientId)
      }).toString();
      const url = `${endpoint}?${query}`;
      
      const body = JSON.stringify({ 
        data: {
          patientId: String(patientId),
          plan: items
        }
      });
      
      return await apiRequest(this.resourceType, url, { method: "POST", body });
    } catch (error) {
      console.error("Error sending plan to patient:", error);
      return { success: false, error };
    }
  }
}

export default PlanService;
