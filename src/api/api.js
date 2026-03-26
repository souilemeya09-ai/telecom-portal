import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

// ✅ Instance axios propre
const api = axios.create({
  baseURL: BASE_URL,
});

// ✅ Ajouter automatiquement le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== AUTH ====================

export const register = async (username, email, password, role) => {
  const res = await api.post("/auth/register", {
    username,
    email,
    password,
    role,
  });
  return res.data;
};

export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data; // { token, role }
};

// ==================== USERS ====================

export const getUsers = async (page = 0, size = 5) => {
  const res = await api.get(`/users?page=${page}&size=${size}`);
  return res.data;
};

export const deleteUser = async (id) => {
  await api.delete(`/users/${id}`);
};

export const editUser = async (id, user) => {
  await api.put(`/users/${id}`, user);
};

export const addUser = async (user) => {
  const res = await api.post(`/users`, user);
  return res.data;
};

export const toggleUserStatus = async (id) => {
  const res = await api.put(`/users/${id}/toggle-actif`);
  return res.data;
};

// ==================== CLIENTS ====================

export const getClients = async () => {
  const res = await api.get("/clients");
  return res.data;
};

// POST /api/clients  (multipart)
export async function createClient(formData) {
  const res = await api.post(`${BASE_URL}/clients`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  return res.data;
}
// PUT /api/clients/:id  (multipart)
export async function updateClient(id, formData) {
  const res = await api.put(`${BASE_URL}/clients/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
}

export const deleteClient = async (id) => {
  const res = await api.delete(`/clients/${id}`);
  return res.data;
};

// ==================== OFFRES ====================
export const getOffres = async () => {
  const res = await api.get("/offres");
  return res.data;
};

export const createOffre = async (offre) => {
  const res = await api.post("/offres", offre);
  return res.data;
};

// ==================== CONTRATS ====================

export const getContrats = async () => {
  const res = await api.get("/contrats");
  return res.data;
};

export const getContratById = async (id) => {
  const res = await api.get(`/contrats/${id}`);
  return res.data;
};

export const getContratsByClient = async (clientId) => {
  const res = await api.get(`/contrats/client/${clientId}`);
  return res.data;
};

export const createContrat = async (data) => {
  const res = await api.post("/contrats", data);
  return res.data;
};

export const updateContrat = async (id, data) => {
  const res = await api.put(`/contrats/${id}`, data);
  return res.data;
};

export const resilierContrat = async (id) => {
  const res = await api.put(`/contrats/${id}/resilier`);
  return res.data;
};

// DELETE /api/contrats/:id
export async function deleteContrat(id) {
  const res = await api.delete(`${BASE_URL}/contrats/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}

export const addOffreToContrat = async (contratId, offreId) => {
  const res = await api.put(`/contrats/${contratId}/add-offre/${offreId}`);
  return res.data;
};

export async function getPlansTarifaires() {
  const res = await api.get(`${BASE_URL}/plans-tarifaires`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}


// GET /api/reclamations
export async function getReclamations() {
  const res = await api.get(`${BASE_URL}/reclamations`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}

// GET /api/reclamations/:id
export async function getReclamationById(id) {
  const res = await api.get(`${BASE_URL}/reclamations/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}

// GET /api/reclamations/client/:clientId
export async function getReclamationsByClient(clientId) {
  const res = await api.get(`${BASE_URL}/reclamations/client/${clientId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}

// POST /api/reclamations
export async function createReclamation(dto) {
  const res = await api.post(`${BASE_URL}/reclamations`, dto, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}

// PUT /api/reclamations/:id
export async function updateReclamation(id, dto) {
  const res = await api.put(`${BASE_URL}/reclamations/${id}`, dto, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}

// PATCH /api/reclamations/:id/statut?statut=EN_COURS
export async function changerStatutReclamation(id, statut) {
  const res = await api.patch(
    `${BASE_URL}/reclamations/${id}/statut`,
    null,
    {
      params: { statut },
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }
  );
  return res.data;
}

// DELETE /api/reclamations/:id
export async function deleteReclamation(id) {
  const res = await api.delete(`${BASE_URL}/reclamations/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}