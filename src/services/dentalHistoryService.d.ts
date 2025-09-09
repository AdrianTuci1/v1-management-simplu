export type ToothHistoryEntry = { description: string };
export type ToothRecord = { toothNumber: number; condition: string; history: ToothHistoryEntry[] };
export type TeethUpdate = { toothNumber: string | number; condition: string; history?: ToothHistoryEntry[] };

declare class DentalHistoryService {
  constructor();
  getDentalHistory(patientId: string): Promise<ToothRecord[]>;
  bulkPatchDentalHistory(patientId: string, teethUpdates: TeethUpdate[]): Promise<any[]>;
  deleteToothHistory(patientId: string, toothNumber: string | number): Promise<any>;
}

export default DentalHistoryService;
