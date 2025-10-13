declare interface TreatmentPlanItem {
    id: string;
    toothNumber?: number | null;
    title: string;
    durationMinutes?: number | null;
    price?: number | null;
    notes?: string;
    isFromChart?: boolean;
}

declare interface TreatmentPlanData {
    // Informații clinică (sender)
    clinic: {
        name: string;
        address: string;
        city: string;
        email: string;
        phone: string;
        website?: string;
        cui?: string;
    },
    // Informații pacient
    patient: {
        name: string;
        dateOfBirth?: string;
        phone?: string;
        email?: string;
        cnp?: string;
    },
    // Informații plan
    plan: {
        date: string;
        expiryDate?: string;
        doctorName?: string;
        clinicLocation?: string;
    },
    // Tratamente
    treatments: TreatmentPlanItem[],
    // Labels pentru traducere
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
    }
}

export declare function printTreatmentPlanPDF(treatmentPlanData: TreatmentPlanData): void;

