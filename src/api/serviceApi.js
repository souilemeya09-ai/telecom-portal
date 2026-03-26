const BASE_URL = "http://localhost:8080/api";

const headers = {
    "Content-Type": "application/json",
};

// GET /api/services
export async function getAllServices() {
    const res = await fetch(`${BASE_URL}/services`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch services: ${res.status}`);
    return res.json();
}

// GET /api/services/:id
export async function getServiceById(id) {
    const res = await fetch(`${BASE_URL}/services/${id}`, { headers });
    if (!res.ok) throw new Error(`Service not found: ${res.status}`);
    return res.json();
}

// POST /api/services
export async function createService(dto) {
    const res = await fetch(`${BASE_URL}/services`, {
        method: "POST",
        headers,
        body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(`Failed to create service: ${res.status}`);
    return res.json();
}

// PUT /api/services/:id
export async function updateService(id, dto) {
    const res = await fetch(`${BASE_URL}/services/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(`Failed to update service: ${res.status}`);
    return res.json();
}

// DELETE /api/services/:id
export async function deleteService(id) {
    const res = await fetch(`${BASE_URL}/services/${id}`, {
        method: "DELETE",
        headers,
    });
    if (!res.ok) throw new Error(`Failed to delete service: ${res.status}`);
}