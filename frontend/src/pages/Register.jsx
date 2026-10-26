import { useState } from "react";
import "./Register.css";
import { Link, useNavigate } from "react-router-dom"
import api from "../api/api";
function Register() {
    const navigate = useNavigate();
    const [data, setData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        date_of_birth: "",
        profile_picture_url: null
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function handleChange(e) {
        const label = e.target.name;
        let value;
        if (label == "profile_picture_url") {
            value = e.target.files[0];
        }
        else {
            value = e.target.value;
        }
        setData({ ...data, [label]: value });
        setError("");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const formData = new FormData();
            for (let key in data) {
                if (key == "profile_picture_url" && data[key]) {
                    formData.append(key, data[key]);
                }
                else if (key != "profile_picture_url") {
                    formData.append(key, data[key]);
                }
            }
            const res = await api.post("/auth/register", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res?.data?.success) {
                alert("User Registered Successfully");
                navigate("/login");
            }
            else {
                setError(res?.data?.message || "Registration failed");
            }
        }
        catch (err) {
            setError(err?.response?.data?.message || "Internal Server Error");
        }
        finally {
            setSubmitting(false);
        }
    }

    return (
        <section id="register-section">
            <form id="register-form" onSubmit={handleSubmit}>
                <h1><span className="auth-brand">🏨</span> Create Account</h1>
                <p className="auth-subtitle">Join us and start booking amazing stays</p>
                {error && <div className="auth-error">{error}</div>}
                <div className="register-input-container">
                    <label htmlFor="fname">First Name</label>
                    <input type="text" id="fname" value={data.first_name} name="first_name" onChange={handleChange} placeholder="John" required />
                </div>
                <div className="register-input-container">
                    <label htmlFor="lname">Last Name</label>
                    <input type="text" id="lname" value={data.last_name} name="last_name" onChange={handleChange} placeholder="Doe" required />
                </div>
                <div className="register-input-container">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" value={data.email} name="email" onChange={handleChange} placeholder="you@example.com" required />
                </div>
                <div className="register-input-container">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" value={data.password} name="password" onChange={handleChange} placeholder="Min 6 characters" required />
                </div>
                <div className="register-input-container">
                    <label htmlFor="phone">Phone</label>
                    <input type="tel" id="phone" name="phone" value={data.phone} onChange={handleChange} placeholder="10 digit number" required />
                </div>
                <div className="register-input-container">
                    <label htmlFor="dob">Date Of Birth</label>
                    <input type="date" id="dob" name="date_of_birth" value={data.date_of_birth} onChange={handleChange} required />
                </div>
                <div className="register-input-container profile-image-input">
                    <label htmlFor="profile">Profile Image</label>
                    <input type="file" id="profile" name="profile_picture_url" accept="image/*" onChange={handleChange} required />
                </div>
                <div id="register-new-user">
                    <p>Already Registered?</p>
                    <Link to="/login">Login Here</Link>
                </div>
                <div id="register-btn">
                    <button disabled={submitting}>{submitting ? "Registering..." : "Register"}</button>
                </div>
            </form>
        </section>
    )
}

export default Register