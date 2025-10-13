declare module '@/stores/settingsStore' {
  export interface LocationDetails {
    name: string;
    companyName: string;
    address: string;
    phone: string;
    email: string;
    description: string;
    cif: string;
    iban: string;
    banca: string;
    website?: string;
  }

  export interface WorkingHours {
    [day: string]: {
      enabled: boolean;
      start: string;
      end: string;
    };
  }

  export interface Currency {
    code: string;
    name: string;
    symbol: string;
  }

  export interface TaxSettings {
    defaultVAT: number;
    serviceVATRateId: number;
    productVATRateId: number;
    vatRates: Array<{
      id: number;
      name: string;
      rate: number;
      enabled: boolean;
    }>;
  }

  export interface SettingsStore {
    workingHours: WorkingHours;
    locationDetails: LocationDetails;
    currency: Currency;
    taxSettings: TaxSettings;
    language: { code: string; name: string };
    cashRegister: any;
    dataDownload: any;
    stripePayment: any;
    settingsStatus: any;
    updateWorkingHours: (day: string, updates: any) => void;
    updateLocationDetails: (updates: Partial<LocationDetails>) => void;
    updateCurrency: (currency: Currency) => void;
    updateTaxSettings: (updates: any) => void;
    updateLanguage: (language: any) => void;
    updateCashRegister: (updates: any) => void;
    updateDataDownload: (updates: any) => void;
    updateStripePayment: (updates: any) => void;
    getSettingStatus: (settingId: string) => any;
    resetSettings: () => void;
  }

  const useSettingsStore: <T>(selector: (state: SettingsStore) => T) => T;
  export default useSettingsStore;
}

