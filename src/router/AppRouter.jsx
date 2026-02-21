import { Routes, Route } from "react-router-dom";
import App from "../pages/App"
import Dashboard from "../pages/Dashboard";

function AppRouter(){
    return(
    <Routes>
        <Route path="/" element={<App />}></Route>
        <Route path="/dashboard" element={<Dashboard/>}></Route>
    </Routes>
    )
}
export default AppRouter