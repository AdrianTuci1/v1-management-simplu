import { apiRequest, buildResourcesEndpoint } from "../data/infrastructure/apiClient.js";

/**
 * DentalHistoryService
 * Uses unified resources API: /api/resources/{businessId}-{locationId}
 * Header: X-Resource-Type: dental-chart
 * resource_id refers to the patient's resource_id
 */
class DentalHistoryService {
  constructor() {
    this.resourceType = "dental-chart";
  }

  /**
   * Fetch full dental history for a patient.
   * Returns an array of teeth entries: { toothNumber: number, condition: string, history: [{ description: string }] }
   */
  async getDentalHistory(patientId) {
    if (!patientId) return [];
    const endpoint = buildResourcesEndpoint("");
    const query = new URLSearchParams({ resource_id: String(patientId) }).toString();
    const url = `${endpoint}?${query}`;

    const response = await apiRequest(this.resourceType, url, { method: "GET" });
    const payload = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    // Normalize minimal expected structure for TeethChartTab
    return payload.map((item) => {
      const data = item?.data && typeof item.data === "object" ? item.data : item;
      return {
        toothNumber: Number(data.toothNumber),
        condition: data.condition || "sound",
        history: Array.isArray(data.history) ? data.history : [],
      };
    });
  }

  /**
   * Bulk update dental history for a patient.
   * teethUpdates: Array<{ toothNumber: string|number, condition: string, history?: { description: string }[] }>
   */
  async bulkPatchDentalHistory(patientId, teethUpdates) {
    if (!patientId || !Array.isArray(teethUpdates) || teethUpdates.length === 0) return [];
    const endpoint = buildResourcesEndpoint("");
    const query = new URLSearchParams({ resource_id: String(patientId) }).toString();
    const url = `${endpoint}?${query}`;

    const body = JSON.stringify({ updates: teethUpdates });
    const response = await apiRequest(this.resourceType, url, { method: "PATCH", body });
    const payload = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    return payload;
  }

  /**
   * Optional: delete a tooth entry from history.
   */
  async deleteToothHistory(patientId, toothNumber) {
    if (!patientId || !toothNumber) return { success: false };
    const endpoint = buildResourcesEndpoint("");
    const query = new URLSearchParams({ resource_id: String(patientId), toothNumber: String(toothNumber) }).toString();
    const url = `${endpoint}?${query}`;
    const response = await apiRequest(this.resourceType, url, { method: "DELETE" });
    return response;
  }
}

export default DentalHistoryService;


