import { useState } from "react";
import { FaArrowRight, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaRegPaperPlane } from "react-icons/fa";
import "./Contact.css";

const contactInfo = [
    { icon: <FaMapMarkerAlt aria-hidden="true" />, title: "Visit us", value: "M.G. Road, New Delhi, India", href: "https://maps.google.com/?q=M.G.+Road,+New+Delhi,+India" },
    { icon: <FaPhoneAlt aria-hidden="true" />, title: "Give us a call", value: "+91 98765 43210", href: "tel:+919876543210" },
    { icon: <FaEnvelope aria-hidden="true" />, title: "Send an email", value: "support@hotelbooking.com", href: "mailto:support@hotelbooking.com" }
];

function Contact() {
    const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
    const [notice, setNotice] = useState("");

    function handleChange(event) {
        setNotice("");
        setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        const subject = encodeURIComponent(formData.subject.trim() || "Hotel Booking enquiry");
        const body = encodeURIComponent(`Name: ${formData.name.trim()}\nEmail: ${formData.email.trim()}\n\n${formData.message.trim()}`);
        setNotice("Your email app should open with your message ready to send.");
        window.location.href = `mailto:support@hotelbooking.com?subject=${subject}&body=${body}`;
    }

    return (
        <main className="contact-page">
            <section className="contact-hero">
                <div className="contact-hero-orbit contact-hero-orbit-one" aria-hidden="true" />
                <div className="contact-hero-orbit contact-hero-orbit-two" aria-hidden="true" />
                <div className="contact-hero-inner">
                    <span className="contact-eyebrow"><span /> WE’RE HERE TO HELP</span>
                    <h1>Let’s make your<br /><span>next stay easier.</span></h1>
                    <p>Questions about a booking or need help planning? Send us a note and our team will be glad to help.</p>
                </div>
            </section>

            <section className="contact-content" aria-label="Contact Hotel Booking">
                <div className="contact-sidebar">
                    <div className="contact-sidebar-heading">
                        <span className="contact-section-kicker">GET IN TOUCH</span>
                        <h2>We’d love to<br />hear from you.</h2>
                        <p>Choose the way that works best for you. We’re happy to help with your hotel booking questions.</p>
                    </div>

                    <div className="contact-methods">
                        {contactInfo.map((item) => (
                            <a className="contact-method" href={item.href} key={item.title} target={item.title === "Visit us" ? "_blank" : undefined} rel={item.title === "Visit us" ? "noreferrer" : undefined}>
                                <span className="contact-method-icon">{item.icon}</span>
                                <span className="contact-method-copy"><small>{item.title}</small><strong>{item.value}</strong></span>
                                <FaArrowRight className="contact-method-arrow" aria-hidden="true" />
                            </a>
                        ))}
                    </div>

                    <div className="contact-sidebar-note">
                        <span className="contact-note-mark"><FaRegPaperPlane aria-hidden="true" /></span>
                        <p><strong>Already have a reservation?</strong><br />Keep your booking reference nearby so we can help you faster.</p>
                    </div>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="contact-form-heading">
                        <div><span className="contact-section-kicker">SEND A MESSAGE</span><h2>How can we help?</h2></div>
                        <span className="contact-form-mark" aria-hidden="true"><FaRegPaperPlane /></span>
                    </div>
                    {notice && <div className="contact-notice" role="status">{notice}</div>}
                    <div className="contact-form-row">
                        <div className="contact-input-group">
                            <label htmlFor="contact-name">Your name</label>
                            <input autoComplete="name" type="text" id="contact-name" name="name" placeholder="e.g. Alex Morgan" maxLength={100} value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="contact-input-group">
                            <label htmlFor="contact-email">Email address</label>
                            <input autoComplete="email" type="email" id="contact-email" name="email" placeholder="you@example.com" maxLength={160} value={formData.email} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="contact-input-group">
                        <label htmlFor="contact-subject">What’s this about?</label>
                        <select id="contact-subject" name="subject" value={formData.subject} onChange={handleChange} required>
                            <option value="" disabled>Select a topic</option>
                            <option value="Booking question">Booking question</option>
                            <option value="Change or cancellation">Change or cancellation</option>
                            <option value="Payment question">Payment question</option>
                            <option value="Hotel information">Hotel information</option>
                            <option value="Other enquiry">Something else</option>
                        </select>
                    </div>
                    <div className="contact-input-group">
                        <div className="contact-message-label"><label htmlFor="contact-message">Your message</label><span>{formData.message.length}/1000</span></div>
                        <textarea id="contact-message" name="message" rows="5" maxLength={1000} placeholder="Tell us a little about how we can help..." value={formData.message} onChange={handleChange} required />
                    </div>
                    <div className="contact-form-footer">
                        <p>Your email app will open with this message ready to send.</p>
                        <button type="submit" className="contact-submit">Continue to email <FaArrowRight aria-hidden="true" /></button>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default Contact;
