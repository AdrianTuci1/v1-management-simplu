import { apiRequest, buildResourcesEndpoint } from "../data/infrastructure/apiClient.js";

/**
 * DentalHistoryService
 * Uses unified resources API: /api/resources/{businessId}-{locationId}
 * Header: X-Resource-Type: patient
 * Stores dental chart data in the patient's resource data field
 */
class DentalHistoryService {
  constructor() {
    this.resourceType = "patient";
  }

  /**
   * Fetch full dental history for a patient.
   * Returns an array of teeth entries: { toothNumber: number, condition: string, history: [{ description: string }] }
   */
  async getDentalHistory(patientId) {
    if (!patientId) return [];
    const endpoint = buildResourcesEndpoint(`/${patientId}`);

    try {
      const response = await apiRequest(this.resourceType, endpoint, { method: "GET" });
      const patientData = response?.data || response;
      
      // Extract chart data from patient's data field
      if (!patientData || !patientData.data || !patientData.data.chart) {
        return [];
      }
      
      const chartData = patientData.data.chart;
      // Normalize minimal expected structure for TeethChartTab
      return chartData.map((item) => {
        return {
          toothNumber: Number(item.toothNumber),
          condition: item.condition || "sound",
          treatments: Array.isArray(item.treatments) ? item.treatments : [],
        };
      });
    } catch (error) {
      // If patient doesn't exist or has no chart data, return empty array
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Bulk update dental history for a patient.
   * teethUpdates: Array<{ toothNumber: string|number, condition: string, history?: { description: string }[] }>
   */
  async bulkPatchDentalHistory(patientId, teethUpdates) {
    if (!patientId || !Array.isArray(teethUpdates) || teethUpdates.length === 0) return [];
    const endpoint = buildResourcesEndpoint(`/${patientId}`);

    try {
      // Get existing patient data first
      const existingResponse = await apiRequest(this.resourceType, endpoint, { method: "GET" });
      const existingData = existingResponse?.data || existingResponse;
      
      console.log("GET patient response:", existingResponse);
      console.log("Existing patient data:", existingData);
      
      // Merge existing chart data with updates
      const existingChart = existingData?.data?.chart || [];
      const updatedChart = [...existingChart];
      
      console.log("Existing chart:", existingChart);
      
      // Update or add teeth data
      teethUpdates.forEach(update => {
        const toothNumber = Number(update.toothNumber);
        const existingIndex = updatedChart.findIndex(item => Number(item.toothNumber) === toothNumber);
        
        const toothData = {
          toothNumber: toothNumber,
          condition: update.condition || "sound",
          treatments: Array.isArray(update.treatments) ? update.treatments : []
        };
        
        if (existingIndex >= 0) {
          updatedChart[existingIndex] = toothData;
        } else {
          updatedChart.push(toothData);
        }
      });

      // Update patient data with new chart
      const body = JSON.stringify({ 
        data: { 
          ...existingData?.data,
          chart: updatedChart
        }
      });
      
      const response = await apiRequest(this.resourceType, endpoint, { method: "PATCH", body });
      
      console.log("PATCH response:", response);
      
      // Return the updated chart data we already have (updatedChart)
      // since the response might not contain the chart data in the expected format
      return updatedChart.map((item) => {
        return {
          toothNumber: Number(item.toothNumber),
          condition: item.condition || "sound",
          treatments: Array.isArray(item.treatments) ? item.treatments : [],
        };
      });
    } catch (error) {
      console.error("Failed to update dental history:", error);
      throw error;
    }
  }


  /**
   * Delete a specific treatment from a tooth, or the entire tooth if no treatmentId provided.
   */
  async deleteToothHistory(patientId, toothNumber, treatmentId = null) {
    if (!patientId || !toothNumber) return { success: false };
    const endpoint = buildResourcesEndpoint(`/${patientId}`);

    try {
      // Get existing patient data first
      const existingResponse = await apiRequest(this.resourceType, endpoint, { method: "GET" });
      const existingData = existingResponse?.data || existingResponse;
      
      const existingChart = existingData?.data?.chart || [];
      let updatedChart;

      if (treatmentId) {
        // Delete specific treatment from tooth
        updatedChart = existingChart.map(item => {
          if (Number(item.toothNumber) === Number(toothNumber)) {
            return {
              ...item,
              treatments: (item.treatments || []).filter(treatment => treatment.id !== treatmentId)
            };
          }
          return item;
        });
      } else {
        // Delete entire tooth entry
        updatedChart = existingChart.filter(item => Number(item.toothNumber) !== Number(toothNumber));
      }

      // Update patient data with new chart
      const body = JSON.stringify({ 
        data: { 
          ...existingData?.data,
          chart: updatedChart
        }
      });
      
      const response = await apiRequest(this.resourceType, endpoint, { method: "PATCH", body });
      return { success: true, response };
    } catch (error) {
      console.error("Failed to delete tooth history:", error);
      return { success: false, error };
    }
  }
}

export default DentalHistoryService;


