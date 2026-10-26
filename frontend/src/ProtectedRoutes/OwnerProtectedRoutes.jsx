import { useContext } from "react"
import { UserDataContext } from "../context/UserContext"
import { Navigate } from "react-router-dom";

function OwnerProtectedRoutes({ children }) {
    const { user,loading } = useContext(UserDataContext);
    if(loading){
        return <h1>Loading....</h1>
    }
    if (!user || !user?.isOwner) {
        return <Navigate to="/" />
    }
    return children
}

export default OwnerProtectedRoutes;