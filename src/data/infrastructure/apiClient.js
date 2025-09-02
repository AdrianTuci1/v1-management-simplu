// Simplified API client for unified resources endpoint

export async function apiRequest(resourceType, endpoint = "", options = {}) {
  const base = import.meta.env.VITE_API_URL || "";
  const url = `${base}${endpoint}`;

  // Get auth token for all requests except business-info
  let authToken = null;
  if (resourceType !== 'business-info') {
    const savedCognitoData = localStorage.getItem('cognito-data');
    if (savedCognitoData) {
      const userData = JSON.parse(savedCognitoData);
      authToken = userData.access_token || userData.id_token;
    }
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Resource-Type": resourceType,
    ...(authToken && { "Authorization": `Bearer ${authToken}` }),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error(`API error ${response.status}`);
    error.status = response.status;
    error.body = text;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
}

export function buildResourcesEndpoint(path = "") {
  
  
  const businessId = localStorage.getItem("businessId") || 'B0100001';
  const locationId = localStorage.getItem("locationId") || 'L0100001';

  if (!businessId || !locationId) {
    throw new Error("Business ID and Location ID must be set before accessing resources.");
  }
  const basePath = `/api/resources/${businessId}-${locationId}`;
  return `${basePath}${path}`;
}