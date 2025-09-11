declare module "../../services/dentalHistoryService" {
  export type ToothTreatment = { id: string; name: string; duration?: number };
  export type ToothRecord = { toothNumber: number; condition: string; treatments: ToothTreatment[] };
  export type TeethUpdate = { toothNumber: string | number; condition: string; treatments?: ToothTreatment[] };
  export type PatientChartData = { 
    data: { 
      chart: ToothRecord[] 
    } 
  };

  class DentalHistoryService {
    constructor();
    getDentalHistory(patientId: string): Promise<ToothRecord[]>;
    bulkPatchDentalHistory(patientId: string, teethUpdates: TeethUpdate[]): Promise<ToothRecord[]>;
    deleteToothHistory(patientId: string, toothNumber: string | number, treatmentId?: string): Promise<{ success: boolean; response?: any; error?: any }>;
  }
  export default DentalHistoryService;
}

declare module "@/services/dentalHistoryService" {
  export type ToothTreatment = { id: string; name: string; duration?: number };
  export type ToothRecord = { toothNumber: number; condition: string; treatments: ToothTreatment[] };
  export type TeethUpdate = { toothNumber: string | number; condition: string; treatments?: ToothTreatment[] };
  export type PatientChartData = { 
    data: { 
      chart: ToothRecord[] 
    } 
  };

  class DentalHistoryService {
    constructor();
    getDentalHistory(patientId: string): Promise<ToothRecord[]>;
    bulkPatchDentalHistory(patientId: string, teethUpdates: TeethUpdate[]): Promise<ToothRecord[]>;
    deleteToothHistory(patientId: string, toothNumber: string | number, treatmentId?: string): Promise<{ success: boolean; response?: any; error?: any }>;
  }
  export default DentalHistoryService;
}

declare module "@/services/dentalPlanService" {
  export type DentalPlanItem = {
    id: string;
    toothNumber?: number | null;
    title: string;
    durationMinutes?: number;
    price?: number;
    notes?: string;
  };
  export type DentalPlanData = { 
    items: DentalPlanItem[]; 
    data: { patientId: string } 
  };

  class DentalPlanService {
    constructor();
    getPlan(patientId: string): Promise<DentalPlanItem[]>;
    upsertPlan(patientId: string, items: DentalPlanItem[]): Promise<any[]>;
    generatePdf(patientId: string, items: DentalPlanItem[]): Promise<any>;
    sendToPatient(patientId: string, items: DentalPlanItem[]): Promise<any>;
  }

  export default DentalPlanService;
}

declare module "../../services/dentalPlanService" {
  export type DentalPlanItem = {
    id: string;
    toothNumber?: number | null;
    title: string;
    durationMinutes?: number;
    price?: number;
    notes?: string;
  };
  export type DentalPlanData = { 
    items: DentalPlanItem[]; 
    data: { patientId: string } 
  };

  class DentalPlanService {
    constructor();
    getPlan(patientId: string): Promise<DentalPlanItem[]>;
    upsertPlan(patientId: string, items: DentalPlanItem[]): Promise<any[]>;
    generatePdf(patientId: string, items: DentalPlanItem[]): Promise<any>;
    sendToPatient(patientId: string, items: DentalPlanItem[]): Promise<any>;
  }

  export default DentalPlanService;
}

declare module "@/components/combobox/TreatmentCombobox.jsx" {
  interface TreatmentValue { id: string; name: string; duration?: number }
  interface TreatmentComboboxProps {
    value: string | TreatmentValue | null
    onValueChange: (value: TreatmentValue) => void
    placeholder?: string
    className?: string
  }
  const Component: (props: TreatmentComboboxProps) => any
  export default Component
}


