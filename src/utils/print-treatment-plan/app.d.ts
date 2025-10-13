declare module '@/utils/print-treatment-plan/app' {
  export interface TreatmentPlanItem {
    id: string;
    toothNumber?: number | null;
    title: string;
    durationMinutes?: number | null;
    price?: number | null;
    notes?: string;
    isFromChart?: boolean;
  }

  export interface TreatmentPlanData {
    clinic: {
      name: string;
      address: string;
      city: string;
      email: string;
      phone: string;
      website?: string;
      cui?: string;
    };
    patient: {
      name: string;
      dateOfBirth?: string;
      phone?: string;
      email?: string;
      cnp?: string;
    };
    plan: {
      date: string;
      expiryDate?: string;
      doctorName?: string;
      clinicLocation?: string;
    };
    treatments: TreatmentPlanItem[];
    labels: {
      title: string;
      patientInfo: string;
      planDate: string;
      expiryDate: string;
      doctor: string;
      toothNumber: string;
      treatment: string;
      duration: string;
      price: string;
      notes: string;
      source: string;
      total: string;
      estimatedTotal: string;
      footer: string;
      fromChart: string;
      manual: string;
      generalTreatment: string;
    };
  }

  export function printTreatmentPlanPDF(treatmentPlanData: TreatmentPlanData): void;
}

