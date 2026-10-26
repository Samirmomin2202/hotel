import { useContext, useState } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom"
import api from "../api/api";
import { UserDataContext } from "../context/UserContext"
function Login() {
    const [data, setData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { setUser } = useContext(UserDataContext);
    const navigate = useNavigate();

    function handleChange(e) {
        setData({ ...data, [e.target.name]: e.target.value });
        setError("");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setMessage("");
        try {
            const res = await api.post("/auth/login", data);
            if (res?.data?.success) {
                const loggedInUser = res?.data?.data;
                setUser({ ...loggedInUser, isAdmin: loggedInUser.role === "admin", isOwner: loggedInUser.role === "hotel-manager" });
                setMessage("Login successful! Redirecting...");
                setTimeout(() => navigate(loggedInUser.role === "admin" ? "/admin" : "/"), 800);
            }
            else {
                setError(res.data.message || "Login failed");
            }
        }
        catch (err) {
            setError(err?.response?.data?.message || "Invalid credentials, please try again.");
        }
        finally {
            setSubmitting(false);
            setData({ email: "", password: "" });
        }
    }
    return (
        <section id="login-section">
            <form id="login-form" onSubmit={handleSubmit}>
                <h1><span className="auth-brand">🏨</span> Welcome Back</h1>
                <p className="auth-subtitle">Login to your account</p>
                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-success">{message}</div>}
                <div className="login-input-container">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" value={data.email} name="email" onChange={handleChange} placeholder="Enter your email" required />
                </div>
                <div className="login-input-container">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" value={data.password} name="password" onChange={handleChange} placeholder="Enter your password" required />
                </div>
                <div id="login-new-user">
                    <p>New User?</p>
                    <Link to="/register">Register Here</Link>
                </div>
                <div id="login-btn">
                    <button disabled={submitting}>{submitting ? "Logging in..." : "Login"}</button>
                </div>
            </form>
        </section>
    )
}

export default Login
