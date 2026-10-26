import { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaHotel } from "react-icons/fa";
import { FiChevronDown, FiLogOut, FiMenu, FiUser, FiX } from "react-icons/fi";
import { UserDataContext } from "../context/UserContext";
import "./Header.css";

function Header() {
    const { user, logout } = useContext(UserDataContext);
    const navigate = useNavigate();
    const location = useLocation();
    const headerRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);

    const tabs = [
        { link: "/", label: "Home", end: true },
        { link: "/hotels", label: "Hotels" },
        { link: "/contact", label: "Contact" },
        { link: "/about", label: "About" },
        ...(user?.role === "admin" ? [{ link: "/admin", label: "Admin" }] : [])
    ];

    useEffect(() => {
        setIsMenuOpen(false);
        setIsAccountOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        function closeOnOutsideClick(event) {
            if (!headerRef.current?.contains(event.target)) setIsAccountOpen(false);
        }
        function closeOnEscape(event) {
            if (event.key === "Escape") {
                setIsAccountOpen(false);
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("pointerdown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, []);

    function handleLogout() {
        setIsAccountOpen(false);
        setIsMenuOpen(false);
        logout();
        navigate("/");
    }

    function accountLinks(onNavigate) {
        return <>
            {user?.role === "admin" && <Link to="/admin" onClick={onNavigate}>Admin dashboard</Link>}
            <Link to="/my-bookings" onClick={onNavigate}>My bookings</Link>
            {user?.role !== "admin" && (user?.isOwner
                ? <Link to="/setup-hotel" onClick={onNavigate}>Manage my hotel</Link>
                : <Link to="/register-hotel" onClick={onNavigate}>List your hotel</Link>)}
        </>;
    }

    const displayName = user?.first_name || user?.name || "Your account";
    const initials = [user?.first_name, user?.last_name].filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || <FiUser aria-hidden="true" />;

    return (
        <header className="site-header" ref={headerRef}>
            <Link to="/" className="site-brand" aria-label="Hotel Booking home">
                <span className="site-brand-mark"><FaHotel aria-hidden="true" /></span>
                <span className="site-brand-name">Hotel<span>Booking</span><small>FIND YOUR PLACE</small></span>
            </Link>

            <nav className="site-nav" aria-label="Main navigation">
                {tabs.map(({ link, label, end }) => <NavLink key={link} to={link} end={end} className={({ isActive }) => `site-nav-link${isActive ? " site-nav-link-active" : ""}`}>{label}</NavLink>)}
            </nav>

            <div className="site-header-actions">
                {user ? <div className="site-account">
                    <button className="site-account-trigger" type="button" aria-haspopup="menu" aria-expanded={isAccountOpen} onClick={() => setIsAccountOpen((open) => !open)}>
                        <span className="site-avatar">{initials}</span>
                        <span className="site-account-name">{displayName}<small>{user.role === "admin" ? "Administrator" : user.isOwner ? "Hotel manager" : "Traveler"}</small></span>
                        <FiChevronDown className={`site-account-chevron${isAccountOpen ? " site-account-chevron-open" : ""}`} aria-hidden="true" />
                    </button>
                    {isAccountOpen && <div className="site-account-menu" role="menu">
                        <div className="site-account-menu-heading"><small>SIGNED IN AS</small><strong>{user.email || displayName}</strong></div>
                        <div className="site-account-menu-links">{accountLinks(() => setIsAccountOpen(false))}</div>
                        <button className="site-account-logout" type="button" role="menuitem" onClick={handleLogout}><FiLogOut aria-hidden="true" /> Sign out</button>
                    </div>}
                </div> : <Link className="site-login-button" to="/login">Sign in <span aria-hidden="true">→</span></Link>}
                <button className="site-menu-toggle" type="button" aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>
                    {isMenuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
                </button>
            </div>

            {isMenuOpen && <div className="site-mobile-panel">
                <nav aria-label="Mobile navigation">
                    {tabs.map(({ link, label, end }) => <NavLink key={link} to={link} end={end} className={({ isActive }) => `site-mobile-link${isActive ? " site-mobile-link-active" : ""}`}>{label}<span aria-hidden="true">→</span></NavLink>)}
                </nav>
                <div className="site-mobile-account">
                    {user ? <>
                        <div className="site-mobile-user"><span className="site-avatar">{initials}</span><span><strong>{displayName}</strong><small>{user.email}</small></span></div>
                        <div className="site-mobile-account-links">{accountLinks(() => setIsMenuOpen(false))}</div>
                        <button className="site-mobile-signout" type="button" onClick={handleLogout}><FiLogOut aria-hidden="true" /> Sign out</button>
                    </> : <Link className="site-mobile-signin" to="/login" onClick={() => setIsMenuOpen(false)}>Sign in to your account <span aria-hidden="true">→</span></Link>}
                </div>
            </div>}
        </header>
    );
}

export default Header;
