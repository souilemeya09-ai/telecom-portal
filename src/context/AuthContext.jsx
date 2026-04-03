import { createContext, useContext, useEffect, useState } from "react";
import { loginApi, logoutApi } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restaurer la session au montage
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setUser({ username: payload.sub, role: payload.role });
            } catch { localStorage.removeItem("token"); }
        }
        setLoading(false);

        // Écouter la déconnexion forcée par l'intercepteur
        const handleLogout = () => { setUser(null); };
        window.addEventListener("auth:logout", handleLogout);
        return () => window.removeEventListener("auth:logout", handleLogout);
    }, []);

    const login = async (email, password) => {
        const { accessToken, refreshToken, role } = await loginApi(email, password);

        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("role", role);

        // Décoder le JWT pour récupérer les infos user
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        setUser({
            email: payload.sub,   // ton JwtUtil génère avec email comme subject
            role: payload.role,
        });
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        try { if (refreshToken) await logoutApi(refreshToken); } catch { }
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);