import { Routes, Route, Navigate } from "react-router-dom";
import App from "../pages/App"
import Dashboard from "../pages/Dashboard";
import { useState } from "react"; // <--- ADD THIS IMPORT

function AppRouter() {
    const [token, setToken] = useState(localStorage.getItem('token'));

    const handleLogin = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken); // This triggers the re-render!
    };
    return (
        <Routes>
            <Route
                path="/"
                element={token ? <Navigate to="/dashboard" replace /> : <App onLogin={handleLogin} />}
            />
            <Route
                path="/dashboard"
                element={token ? <Dashboard /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
export default AppRouter