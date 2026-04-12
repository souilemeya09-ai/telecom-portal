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

// ── Request interceptor : injecter le token ──────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor : refresh automatique sur 401 ───────
let isRefreshing = false;
let pendingQueue = []; // requêtes en attente pendant le refresh

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ignorer si c'est déjà une tentative de refresh ou une route auth
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Mettre en file d'attente les autres requêtes pendant le refresh
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefresh = localStorage.getItem("refreshToken");
      if (!storedRefresh) throw new Error("Pas de refresh token");

      const { accessToken, refreshToken } = await refreshApi(storedRefresh);

      // Sauvegarder les nouveaux tokens
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Débloquer la file d'attente
      processQueue(null, accessToken);

      // Rejouer la requête originale
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError, null);

      // Refresh échoué → déconnexion forcée
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.dispatchEvent(new Event("auth:logout"));

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

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
// export const getOffres = async () => {
//   const res = await api.get("/offres");
//   return res.data;
// };

// export const createOffre = async (offre) => {
//   const res = await api.post("/offres", offre);
//   return res.data;
// };

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

// export async function getPlansTarifaires() {
//   const res = await api.get(`${BASE_URL}/plans-tarifaires`, {
//     headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//   });
//   return res.data;
// }


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


// ── À ajouter dans src/api/api.js ──────────────────────────────

// GET /api/promotions
export async function getPromotions() {
  const res = await api.get("/promotions");
  return res.data;
}

// GET /api/promotions/:id
export async function getPromotionById(id) {
  const res = await api.get(`/promotions/${id}`);
  return res.data;
}

// GET /api/promotions/statut/:statut
export async function getPromotionsByStatut(statut) {
  const res = await api.get(`/promotions/statut/${statut}`);
  return res.data;
}

// POST /api/promotions
export async function createPromotion(dto) {
  const res = await api.post("/promotions", dto);
  return res.data;
}

// PUT /api/promotions/:id/valider?validateurId=1
export async function validerPromotion(id, validateurId) {
  const res = await api.put(`/promotions/${id}/valider`, null, {
    params: { validateurId },
  });
  return res.data;
}

// PUT /api/promotions/:id/rejeter?validateurId=1
export async function rejeterPromotion(id, validateurId) {
  const res = await api.put(`/promotions/${id}/rejeter`, null, {
    params: { validateurId },
  });
  return res.data;
}

// PUT /api/promotions/:id/activer
export async function activerPromotion(id) {
  const res = await api.put(`/promotions/${id}/activer`);
  return res.data;
}

// PUT /api/promotions/:id/suspendre
export async function suspendrePromotion(id) {
  const res = await api.put(`/promotions/${id}/suspendre`);
  return res.data;
}


// ── À ajouter dans src/api/api.js ──────────────────────────────

// ── Services ─────────────────────────────────────────────────
export async function getServices() {
  const res = await api.get("/services");
  return res.data;
}
export async function createService(dto) {
  const res = await api.post("/services", dto);
  return res.data;
}
export async function updateService(id, dto) {
  const res = await api.put(`/services/${id}`, dto);
  return res.data;
}
export async function deleteService(id) {
  const res = await api.delete(`/services/${id}`);
  return res.data;
}

// ── Offres ───────────────────────────────────────────────────
export async function getOffres() {
  const res = await api.get("/offres");
  return res.data;
}
export async function getOffreById(id) {
  const res = await api.get(`/offres/${id}`);
  return res.data;
}
export async function createOffre(dto) {
  const res = await api.post("/offres", dto);
  return res.data;
}
export async function updateOffre(id, dto) {
  const res = await api.put(`/offres/${id}`, dto);
  return res.data;
}
export async function deleteOffre(id) {
  const res = await api.delete(`/offres/${id}`);
  return res.data;
}

// PUT /api/offres/:offreId/services  — ajouter des services
export async function ajouterServicesOffre(offreId, serviceIds) {
  const res = await api.put(`/offres/${offreId}/services`, serviceIds);
  return res.data;
}

// DELETE /api/offres/:offreId/services/:serviceId  — retirer un service
export async function retirerServiceOffre(offreId, serviceId) {
  const res = await api.delete(`/offres/${offreId}/services/${serviceId}`);
  return res.data;
}

// ── À ajouter dans src/api/api.js ──────────────────────────────

// GET /api/plans-tarifaires
export async function getPlansTarifaires() {
  const res = await api.get("/plans-tarifaires");
  return res.data;
}

// GET /api/plans-tarifaires/:id
export async function getPlanTarifaireById(id) {
  const res = await api.get(`/plans-tarifaires/${id}`);
  return res.data;
}

// POST /api/plans-tarifaires
export async function createPlanTarifaire(dto) {
  const res = await api.post("/plans-tarifaires", dto);
  return res.data;
}

// PUT /api/plans-tarifaires/:id
export async function updatePlanTarifaire(id, dto) {
  const res = await api.put(`/plans-tarifaires/${id}`, dto);
  return res.data;
}

// DELETE /api/plans-tarifaires/:id
export async function deletePlanTarifaire(id) {
  const res = await api.delete(`/plans-tarifaires/${id}`);
  return res.data;
}


// POST /api/souscriptions/contrat/:contratId/promotion/:promotionId
export async function souscrirePromotion(contratId, promotionId) {
  const res = await api.post(
    `/souscriptions/contrat/${contratId}/promotion/${promotionId}`
  );
  return res.data;
}
 
// GET /api/souscriptions/contrat/:contratId
export async function getSouscriptionsByContrat(contratId) {
  const res = await api.get(`/souscriptions/contrat/${contratId}`);
  return res.data;
}
 
// GET /api/souscriptions/promotion/:promotionId
export async function getSouscriptionsByPromotion(promotionId) {
  const res = await api.get(`/souscriptions/promotion/${promotionId}`);
  return res.data;
}