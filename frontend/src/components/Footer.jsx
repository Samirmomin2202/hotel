import "./Footer.css";
import { Link } from "react-router-dom"
import { FaInstagram } from "react-icons/fa6";
import { FaWhatsapp } from "react-icons/fa";
import { FaFacebook } from "react-icons/fa";
function Footer() {
    return (
        <footer>
            <div id="footer-container">
                <div className="footer-columns">
                    <h3>🏨 Hotel-Booking</h3>
                    <p>Your trusted hotel booking partner where you can find luxury and comfortable hotels anytime</p>
                    <div className="social-links">
                        <Link to="#">
                            <FaInstagram className="social-icon" />
                        </Link>
                        <Link to="#">
                            <FaWhatsapp className="social-icon" />
                        </Link>
                        <Link to="#">
                            <FaFacebook className="social-icon" />
                        </Link>
                    </div>
                </div>
                <div className="footer-columns">
                    <h4>Quick Links</h4>
                    <div className="footer-links">
                        <div>
                            <Link to="/">Home</Link>
                        </div>
                        <div>
                            <Link to="/hotels">Hotels</Link>
                        </div>
                        <div>
                            <Link to="/about">About</Link>
                        </div>
                        <div>
                            <Link to="/contact">Contact</Link>
                        </div>
                    </div>
                </div>
                <div className="footer-columns">
                    <h4>Support</h4>
                    <div className="footer-links">
                        <div>
                            <Link to="#">Help Center</Link>
                        </div>
                        <div>
                            <Link to="#">Privacy Policy</Link>
                        </div>
                        <div>
                            <Link to="#">Terms And Conditions</Link>
                        </div>
                        <div>
                            <Link to="#">Cancellation Policy</Link>
                        </div>
                    </div>
                </div>
            </div>
            <div id="footer-bottom">
                <p>© {new Date().getFullYear()} Hotel-Booking. All rights reserved</p>
            </div>
        </footer>
    )
}

export default Footer;