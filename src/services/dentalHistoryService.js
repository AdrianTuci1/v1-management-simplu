import { dataFacade } from "../data/DataFacade.js";

/**
 * DentalHistoryService
 * Uses DataFacade for unified resource access
 * Manages dental chart data as a separate 'dental-chart' resource type
 */
class DentalHistoryService {
  constructor() {
    this.resourceType = "dental-chart";
    this.dataFacade = dataFacade;
  }

  /**
   * Fetch full dental history for a patient.
   * Searches for dental-chart resource by patientId field.
   * Returns an array of teeth entries: { toothNumber: number, condition: string, treatments: [] }
   */
  async getDentalHistory(patientId) {
    if (!patientId) return [];

    try {
      // Search for dental chart by patientId using searchByField
      // This searches in data.patientId field via ResourceSearchRepository.searchByCustomField
      const payload = await this.dataFacade.searchByField(
        this.resourceType,
        'patientId',
        String(patientId),
        1 // We only need the first result
      );
      
      console.log(`🦷 Dental chart search for patientId ${patientId}:`, payload);
      
      // If no dental history found, return empty array
      if (!payload || payload.length === 0) {
        console.log(`ℹ️ No dental history found for patient ${patientId}`);
        return [];
      }
      
      // Get the first dental history record (should be only one per patient)
      const dentalHistoryData = payload[0];
      const chartData = dentalHistoryData?.data?.chart || dentalHistoryData?.chart || [];
      
      console.log(`✅ Found dental history with ${chartData.length} teeth for patient ${patientId}`);
      
      // Normalize minimal expected structure for TeethChartTab
      return chartData.map((item) => {
        return {
          toothNumber: Number(item.toothNumber),
          condition: item.condition || "sound",
          treatments: Array.isArray(item.treatments) ? item.treatments : [],
        };
      });
    } catch (error) {
      // If dental history doesn't exist, return empty array
      if (error.status === 404) {
        return [];
      }
      console.error(`❌ Error fetching dental history for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update dental history for a patient.
   * Creates or updates the dental-chart resource linked to the patient.
   * teethUpdates: Array<{ toothNumber: string|number, condition: string, treatments?: [] }>
   */
  async bulkPatchDentalHistory(patientId, teethUpdates) {
    if (!patientId || !Array.isArray(teethUpdates) || teethUpdates.length === 0) return [];

    try {
      // Search for existing dental chart
      const existingRecords = await this.dataFacade.searchByField(
        this.resourceType,
        'patientId',
        String(patientId),
        1
      );
      
      // Get existing chart data
      const existingData = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;
      const existingChart = existingData?.data?.chart || [];
      const updatedChart = [...existingChart];

      // Update or add teeth data
      teethUpdates.forEach(update => {
        const toothNumber = Number(update.toothNumber);
        const existingIndex = updatedChart.findIndex(item => Number(item.toothNumber) === toothNumber);
        
        if (existingIndex >= 0) {
          // MERGE with existing tooth data - don't overwrite everything!
          const existingTooth = updatedChart[existingIndex];
          
          // Merge treatments: use update if it has items, otherwise keep existing
          let mergedTreatments = existingTooth.treatments || [];
          if (Array.isArray(update.treatments) && update.treatments.length > 0) {
            mergedTreatments = update.treatments;
          }
          
          console.log(`🦷 Merging tooth ${toothNumber}:`);
          console.log(`   - Existing tooth:`, existingTooth);
          console.log(`   - Update data:`, update);
          console.log(`   - Update treatments length: ${update.treatments?.length || 0}`);
          console.log(`   - Existing treatments length: ${existingTooth.treatments?.length || 0}`);
          console.log(`   - Merged treatments length: ${mergedTreatments.length}`);
          
          updatedChart[existingIndex] = {
            toothNumber: toothNumber,
            condition: update.condition || existingTooth.condition || "sound",
            treatments: mergedTreatments
          };
          console.log(`🦷 Updated tooth ${toothNumber}:`, updatedChart[existingIndex]);
        } else {
          // Add new tooth
          const toothData = {
            toothNumber: toothNumber,
            condition: update.condition || "sound",
            treatments: Array.isArray(update.treatments) ? update.treatments : []
          };
          updatedChart.push(toothData);
          console.log(`🦷 Added new tooth ${toothNumber}:`, toothData);
        }
      });

      // Prepare data with patientId (IMPORTANT: patientId must be in data field for searchByField to work)
      const dentalHistoryData = {
        ...existingData?.data,  // Preserve any existing data fields
        patientId: String(patientId),  // This will be saved as data.patientId
        chart: updatedChart,
        updatedAt: new Date().toISOString(),
      };

      console.log(`🦷 Saving dental history for patientId ${patientId}:`, dentalHistoryData);
      console.log(`🦷 Final chart to be saved (${updatedChart.length} teeth):`, updatedChart);

      let response;
      const recordId = existingData?.resourceId || existingData?.id;
      
      if (recordId) {
        // Update existing dental chart - use resourceId, not id!
        console.log(`📝 Updating existing dental chart record with resourceId: ${recordId}`);
        response = await this.dataFacade.update(
          this.resourceType,
          recordId,
          { data: dentalHistoryData }
        );
      } else {
        // Create new dental chart
        dentalHistoryData.createdAt = new Date().toISOString();
        console.log(`✨ Creating new dental chart record for patient ${patientId}`);
        response = await this.dataFacade.create(
          this.resourceType,
          { data: dentalHistoryData }
        );
      }
      
      console.log("✅ Save response:", response);
      
      // Return the updated chart data
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
   * Get all treatments from dental history formatted for treatment plan.
   * Extracts treatments from all teeth and returns them in plan-compatible format.
   */
  async getTreatmentsForPlan(patientId) {
    if (!patientId) return [];
    
    try {
      const chartData = await this.getDentalHistory(patientId);
      
      // Extract all treatments from all teeth
      const treatments = [];
      chartData.forEach(tooth => {
        const toothTreatments = tooth.treatments || [];
        toothTreatments.forEach(treatment => {
          treatments.push({
            id: treatment.id || `${tooth.toothNumber}-${Date.now()}`,
            toothNumber: tooth.toothNumber,
            title: treatment.name || treatment.title || "Treatment",
            durationMinutes: treatment.durationMinutes || null,
            price: treatment.price || null,
            notes: treatment.notes || treatment.description || "",
            isFromChart: true,
            treatmentId: treatment.id,
          });
        });
      });
      
      console.log(`✅ Extracted ${treatments.length} treatments from dental history for patient ${patientId}`);
      return treatments;
    } catch (error) {
      console.error("Error extracting treatments from dental history:", error);
      return [];
    }
  }

  /**
   * Delete a specific treatment from a tooth, or the entire tooth if no treatmentId provided.
   */
  async deleteToothHistory(patientId, toothNumber, treatmentId = null) {
    if (!patientId || !toothNumber) return { success: false };

    try {
      // Search for existing dental chart
      const existingRecords = await this.dataFacade.searchByField(
        this.resourceType,
        'patientId',
        String(patientId),
        1
      );
      
      const existingData = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;
      const recordId = existingData?.resourceId || existingData?.id;
      
      if (!existingData || !recordId) {
        console.log(`ℹ️ No dental chart found for patient ${patientId} to delete`);
        return { success: false, message: "Dental chart not found" };
      }
      
      const existingChart = existingData?.data?.chart || [];
      let updatedChart;
      
      console.log(`🗑️ Deleting from dental chart for patient ${patientId}, tooth ${toothNumber}, treatment ${treatmentId || 'all'}`);
      console.log(`🗑️ Using resourceId: ${recordId}`);

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

      // Update dental chart with new chart data
      const updateData = { 
        data: { 
          ...existingData?.data,  // Preserve existing data fields
          patientId: String(patientId),
          chart: updatedChart,
          updatedAt: new Date().toISOString(),
        }
      };
      
      console.log(`🗑️ Updating record ${recordId} with new chart`);
      const response = await this.dataFacade.update(this.resourceType, recordId, updateData);
      return { success: true, response };
    } catch (error) {
      console.error("Failed to delete tooth history:", error);
      return { success: false, error };
    }
  }
}

export default DentalHistoryService;


