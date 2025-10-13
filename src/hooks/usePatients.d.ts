declare module '@/hooks/usePatients' {
  export interface Patient {
    id?: string;
    name?: string;
    patientName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    cnp?: string;
    address?: string;
    city?: string;
    gender?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
  }

  export interface PatientStats {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  }

  export interface UsePatients {
    patients: Patient[];
    loading: boolean;
    error: string | null;
    stats: PatientStats;
    loadPatients: () => Promise<void>;
    loadPatientsPaginated: (page?: number, limit?: number) => Promise<void>;
    searchPatients: (query: string, limit?: number) => Promise<void>;
    getPatientById: (id: string) => Promise<Patient>;
    addPatient: (patient: Partial<Patient>) => Promise<void>;
    updatePatient: (id: string, patient: Partial<Patient>) => Promise<void>;
    deletePatient: (id: string) => Promise<void>;
    patientManager: any;
  }

  export function usePatients(): UsePatients;
}

