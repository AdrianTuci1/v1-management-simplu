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
      authToken = userData.id_token || userData.access_token;
    }
  }

  // Auto-wrap body data in {data: ...} structure for all requests with body
  let processedOptions = { ...options };
  if (options.body) {
    try {
      // Try to parse the body as JSON
      const bodyData = JSON.parse(options.body);
      
      // Only wrap if it's not already wrapped in a data property
      if (bodyData && typeof bodyData === 'object' && !bodyData.hasOwnProperty('data')) {
        processedOptions.body = JSON.stringify({ data: bodyData });
      }
    } catch (e) {
      // If body is not valid JSON, wrap it as is
      processedOptions.body = JSON.stringify({ data: options.body });
    }
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Resource-Type": resourceType,
    ...(authToken && { "Authorization": `Bearer ${authToken}` }),
    ...(processedOptions.headers || {}),
  };

  const response = await fetch(url, {
    ...processedOptions,
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

// Separate API client for AI Assistant endpoints (no data wrapping)
export async function aiApiRequest(endpoint, options = {}) {
  const base = import.meta.env.VITE_API_URL || "";
  const url = `${base}${endpoint}`;

  // Get auth token
  let authToken = null;
  const savedCognitoData = localStorage.getItem('cognito-data');
  if (savedCognitoData) {
    const userData = JSON.parse(savedCognitoData);
    authToken = userData.id_token || userData.access_token;
  }

  const headers = {
    "Content-Type": "application/json",
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