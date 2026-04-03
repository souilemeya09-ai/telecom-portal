import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export async function loginApi(email, password) {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return res.data; // { accessToken, refreshToken }
}

export async function refreshApi(refreshToken) {
  const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  return res.data; // { accessToken, refreshToken }
}

export async function logoutApi(refreshToken) {
  await axios.post(`${BASE_URL}/auth/logout`, { refreshToken });
}