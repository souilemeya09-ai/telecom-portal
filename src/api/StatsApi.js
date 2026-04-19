// ── À ajouter dans src/api/api.js ──────────────────────────────

export async function getStatsVente() {
  const res = await api.get("/stats/vente");
  return res.data;
}

export async function getStatsMetier() {
  const res = await api.get("/stats/metier");
  return res.data;
}

export async function getStatsExploit() {
  const res = await api.get("/stats/exploit");
  return res.data;
}

export async function getStatsDsi() {
  const res = await api.get("/stats/dsi");
  return res.data;
}