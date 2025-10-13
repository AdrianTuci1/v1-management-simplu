import { dataFacade } from "../data/DataFacade.js";
import { apiRequest, buildResourcesEndpoint } from "../data/infrastructure/apiClient.js";

/**
 * PlanService
 * Resource type: 'plan'
 * Uses DataFacade for unified resource access
 * Searches plans by patientId using DataFacade search methods
 * Some special endpoints (PDF, send) still use apiRequest directly
 */
class PlanService {
  constructor() {
    this.resourceType = "plan";
    this.dataFacade = dataFacade;
  }

  /**
   * Get the plan for a specific patient.
   * Uses DataFacade search to find plans by patientId field value.
   * 
   * NOTE: To get treatments from dental history, use DentalHistoryService.getTreatmentsForPlan()
   * 
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
      const payload = await this.dataFacade.searchByField(
        this.resourceType,
        'patientId',
        String(patientId),
        1 // We only need the first result
      );
      
      console.log(`📋 Plan search for patientId ${patientId}:`, payload);
      
      // If no plan found, return empty array
      if (!payload || payload.length === 0) {
        console.log(`ℹ️ No plan found for patient ${patientId}`);
        return [];
      }
      
      // Get the first plan (should be only one per patient)
      const planData = payload[0];
      const items = planData?.data?.plan || planData?.plan || [];
      
      console.log(`✅ Found plan with ${items.length} items for patient ${patientId}`);
      
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
      // Prepare data with patientId (IMPORTANT: patientId must be in data field for searchByField to work)
      const planData = {
        patientId: String(patientId),  // This will be saved as data.patientId
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

      console.log(`📋 Saving plan for patientId ${patientId} with ${items.length} items`);

      // Search for existing plan
      const existingPlans = await this.dataFacade.searchByField(
        this.resourceType,
        'patientId',
        String(patientId),
        1
      );
      
      if (existingPlans && existingPlans.length > 0) {
        const existingPlan = existingPlans[0];
        const existingPlanId = existingPlan?.resourceId || existingPlan?.id;
        
        if (existingPlanId) {
          // Update existing plan - use resourceId, not id!
          console.log(`📝 Updating existing plan record with resourceId: ${existingPlanId}`);
          const response = await this.dataFacade.update(
            this.resourceType,
            existingPlanId,
            { data: planData }
          );
          console.log(`✅ Plan updated successfully`);
          return response;
        }
      }
      
      // Create new plan
      console.log(`✨ Creating new plan record for patient ${patientId}`);
      const response = await this.dataFacade.create(
        this.resourceType,
        { data: planData }
      );
      console.log(`✅ Plan created successfully`);
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
      // Search for existing plan
      const existingPlans = await this.dataFacade.searchByField(
        this.resourceType,
        'patientId',
        String(patientId),
        1
      );
      
      if (existingPlans && existingPlans.length > 0) {
        const existingPlan = existingPlans[0];
        const existingPlanId = existingPlan?.resourceId || existingPlan?.id;
        
        if (existingPlanId) {
          console.log(`🗑️ Deleting plan with resourceId: ${existingPlanId}`);
          await this.dataFacade.delete(this.resourceType, existingPlanId);
          return { success: true };
        }
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
