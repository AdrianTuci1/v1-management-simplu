declare module "../data/infrastructure/apiClient.js" {
  export function apiRequest(resourceType: string, endpoint?: string, options?: any): Promise<any>;
  export function buildResourcesEndpoint(path?: string): string;
}

declare module "../data/infrastructure/apiClient" {
  export function apiRequest(resourceType: string, endpoint?: string, options?: any): Promise<any>;
  export function buildResourcesEndpoint(path?: string): string;
}

declare module "@/data/infrastructure/apiClient.js" {
  export function apiRequest(resourceType: string, endpoint?: string, options?: any): Promise<any>;
  export function buildResourcesEndpoint(path?: string): string;
}


