import { Navigate } from "react-router-dom"

function NoRouteFound() {
    return <Navigate to="/" />
}

export default NoRouteFound;