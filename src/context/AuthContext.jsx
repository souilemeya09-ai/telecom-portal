import { createContext, useContext, useEffect, useState } from "react";
import { fetchMeApi, loginApi, logoutApi } from "../api/authApi";

const AuthContext = createContext(null);

function decodeTokenUser(token) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
        id: payload.id || payload.userId || null,
        email: payload.sub,
        username: payload.username || payload.sub,
        role: payload.role,
    };
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const restoreSession = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                if (!cancelled) setLoading(false);
                return;
            }

            try {
                const fallbackUser = decodeTokenUser(token);
                const me = await fetchMeApi(token).catch(() => fallbackUser);
                const nextUser = {
                    ...fallbackUser,
                    ...me,
                    id: me.id || me.userId || fallbackUser.id,
                    role: me.role || fallbackUser.role,
                };
                localStorage.setItem("userId", String(nextUser.id ?? ""));
                if (!cancelled) setUser(nextUser);
            } catch {
                localStorage.removeItem("token");
                localStorage.removeItem("userId");
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        restoreSession();

        // Écouter la déconnexion forcée par l'intercepteur
        const handleLogout = () => {
            localStorage.removeItem("userId");
            setUser(null);
        };
        window.addEventListener("auth:logout", handleLogout);
        return () => {
            cancelled = true;
            window.removeEventListener("auth:logout", handleLogout);
        };
    }, []);

    const login = async (email, password) => {
        const { accessToken, refreshToken, role } = await loginApi(email, password);

        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("role", role);

        const fallbackUser = decodeTokenUser(accessToken);
        const me = await fetchMeApi(accessToken).catch(() => fallbackUser);
        const nextUser = {
            ...fallbackUser,
            ...me,
            id: me.id || me.userId || fallbackUser.id,
            role: me.role || fallbackUser.role || role,
        };

        localStorage.setItem("userId", String(nextUser.id ?? ""));
        setUser(nextUser);
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        try {
            if (refreshToken) await logoutApi(refreshToken);
        } catch {
            // La session locale doit quand même être nettoyée.
        }
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userId");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
