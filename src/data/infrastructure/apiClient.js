// Simplified API client for unified resources endpoint
import { healthRepository } from '../repositories/HealthRepository.js';

export async function apiRequest(resourceType, endpoint = "", options = {}) {
  // Verifică dacă sistemul poate face cereri
  const healthStatus = healthRepository.getCurrentStatus();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  
  // Blochează cererile doar dacă:
  // 1. Nu este în demo mode
  // 2. Health check-ul a fost executat (lastCheck există)
  // 3. Și sistemul confirmă că nu poate face cereri
  if (!isDemoMode && healthStatus.lastCheck && !healthStatus.canMakeRequests) {
    console.warn('System is offline or server is down. Request blocked.');
    throw new Error('System is offline or server is down');
  }

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

  try {
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

    // Dacă cererea a reușit, actualizează starea de sănătate la 'healthy'
    if (!isDemoMode) {
      healthRepository.markServerHealthy();
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    // Dacă cererea a eșuat, actualizează starea de sănătate la 'unhealthy'
    if (!isDemoMode) {
      console.error('API request failed:', error);
      healthRepository.markServerUnhealthy(error.message);
      
      // Dacă aceasta este prima cerere și a eșuat, blochează cererile ulterioare
      const healthStatus = healthRepository.getCurrentStatus();
      if (!healthStatus.lastCheck || healthStatus.lastCheck === null) {
        console.warn('First API request failed - blocking subsequent requests until server is healthy');
      }
    }
    throw error;
  }
}

export function buildResourcesEndpoint(path = "") {
  const businessId = localStorage.getItem("businessId") || 'B0100001';
  const locationId = localStorage.getItem("locationId") || 'L0100001';

  if (!businessId || !locationId) {
    throw new Error("Business ID and Location ID must be set before accessing resources.");
  }
  const basePath = `/resources/${businessId}-${locationId}`;
  return `${basePath}${path}`;
}

// Separate API client for AI Assistant endpoints (no data wrapping)
export async function aiApiRequest(endpoint, options = {}) {
  // Verifică dacă sistemul poate face cereri
  const healthStatus = healthRepository.getCurrentStatus();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  
  // Blochează cererile doar dacă:
  // 1. Nu este în demo mode
  // 2. Health check-ul a fost executat (lastCheck există)
  // 3. Și sistemul confirmă că nu poate face cereri
  if (!isDemoMode && healthStatus.lastCheck && !healthStatus.canMakeRequests) {
    console.warn('System is offline or server is down. AI API request blocked.');
    throw new Error('System is offline or server is down');
  }

  // Check if endpoint is already a full URL (starts with http:// or https://)
  // If it is, use it as-is. Otherwise, prepend the base URL.
  let url;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    url = endpoint;
  } else {
    const base = import.meta.env.VITE_API_URL || "";
    url = `${base}${endpoint}`;
  }

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

  try {
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

    // Dacă cererea a reușit, actualizează starea de sănătate la 'healthy'
    if (!isDemoMode) {
      healthRepository.markServerHealthy();
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    // Dacă cererea a eșuat, actualizează starea de sănătate la 'unhealthy'
    if (!isDemoMode) {
      console.error('AI API request failed:', error);
      healthRepository.markServerUnhealthy(error.message);
      
      // Dacă aceasta este prima cerere și a eșuat, blochează cererile ulterioare
      const healthStatus = healthRepository.getCurrentStatus();
      if (!healthStatus.lastCheck || healthStatus.lastCheck === null) {
        console.warn('First AI API request failed - blocking subsequent requests until server is healthy');
      }
    }
    throw error;
  }
}