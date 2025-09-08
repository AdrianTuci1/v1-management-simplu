## Patient Booking - Frontend Integration

### Overview

- **base path**: `/patient-booking`
- **required path params**: `:businessId-:locationId` (concatenated with a hyphen)
- **date format**: `YYYY-MM-DD`
- **time format**: `HH:mm` (24h)
- **auth**:
  - **public** (no token): list services, available dates, day slots
  - **protected** (Bearer token): reserve (can be made public if guest booking is desired)

### Endpoints

- **list public services**
  - `GET /patient-booking/services/:businessId-:locationId`
  - query: `page?`, `limit?`
  - returns: `{ success: true, data: Array<Service> }`

- **available dates** (has any free slots)
  - `GET /patient-booking/available-dates/:businessId-:locationId?from=YYYY-MM-DD&to=YYYY-MM-DD&serviceId?=...`
  - returns: `{ success: true, data: string[] }` (dates)

- **day slots** (free time intervals for a day)
  - `GET /patient-booking/day-slots/:businessId-:locationId/:date?serviceId=...`
  - returns: `{ success: true, data: Array<{ start: string; end: string }> }`

- **create reservation**
  - `POST /patient-booking/reserve/:businessId-:locationId`
  - auth: `Authorization: Bearer <token>`
  - body: `{ date, time, serviceId, duration?, customer? }`
  - returns: `{ success: true, message: string, requestId: string }`

### Data contracts

- **Service**
  - shape depends on your stored resource data; controller returns `{ id: resourceId, ...data }`
  - typical example:
```json
{
  "id": "SVC-123",
  "name": "Consultatie",
  "duration": 30,
  "price": 150,
  "public": true
}
```

- **Available dates**
  - array of `YYYY-MM-DD`

- **Slots**
  - array of `{ start: "HH:mm", end: "HH:mm" }`

### Fetch examples (TypeScript)

```ts
const BASE = process.env.API_BASE_URL; // e.g. https://api.example.com
const businessId = "B010001";
const locationId = "L010001";
const bl = `${businessId}-${locationId}`;

// 1) Public services
export async function fetchPublicServices(page = 1, limit = 50) {
  const url = `${BASE}/patient-booking/services/${bl}?page=${page}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

// 2) Available dates in range
export async function fetchAvailableDates(from: string, to: string, serviceId?: string) {
  const url = new URL(`${BASE}/patient-booking/available-dates/${bl}`);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  if (serviceId) url.searchParams.set("serviceId", serviceId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

// 3) Day slots
export async function fetchDaySlots(date: string, serviceId?: string) {
  const url = new URL(`${BASE}/patient-booking/day-slots/${bl}/${date}`);
  if (serviceId) url.searchParams.set("serviceId", serviceId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

// 4) Reserve (requires auth token; if guest bookings are desired, backend can be made Public)
export async function reserveSlot(
  token: string,
  payload: {
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    serviceId: string;
    duration?: number; // minutes
    customer?: { name?: string; email?: string; phone?: string };
  },
) {
  const url = `${BASE}/patient-booking/reserve/${bl}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### UI flow suggestion

1. Pick location: the app should know `businessId` and `locationId`
2. List services: call services endpoint and show only `public` services
3. Pick date range: call available-dates to highlight days with free slots
4. Pick day: call day-slots to list free intervals
5. Pick time: submit reservation with `date`, `time`, `serviceId`, and optional customer details
6. Confirm: show success message using `requestId`

### Timezone guidance

- Each location has a `timezone` in BusinessInfo; display times in that timezone.
- Convert user-selected times to location-local `HH:mm` before calling APIs.
- Always send dates as `YYYY-MM-DD` and times as `HH:mm`.

### Error handling

- 400: conflicts (time no longer available)
- 401: missing/invalid token on `reserve`
- 200 with `{ success: false }`: validation or query errors; display `message`

### Notes for data/indexing

- Services are returned only when `data.public=true`.
- Consider adding a database index for `data->>'public'` to speed up listing (server has an index annotation; actual SQL migration may be required in your environment).


