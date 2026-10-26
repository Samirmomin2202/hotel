import "./About.css";

function About() {
    const stats = [
        { number: "500+", label: "Partner Hotels" },
        { number: "50K+", label: "Happy Travelers" },
        { number: "120+", label: "Destinations" },
        { number: "4.8★", label: "Average Rating" }
    ];

    const features = [
        { icon: "💎", title: "Luxury Stays", description: "Handpicked luxury hotels and resorts for unforgettable experiences." },
        { icon: "🛡️", title: "Best Price Guarantee", description: "We always match or beat the prices to give you the best deals." },
        { icon: "⚡", title: "Instant Booking", description: "Book your favorite room in seconds with our easy checkout." },
        { icon: "🤝", title: "24/7 Support", description: "Our support team is always available to help you anytime, anywhere." }
    ];

    return (
        <section className="about-page">
            <div className="about-hero">
                <h1>About <span>Hotel-Booking</span></h1>
                <p>Your trusted partner for dream stays across India and beyond</p>
            </div>

            <div className="about-content container">
                <div className="about-story">
                    <h2>Who We Are</h2>
                    <p>
                        Hotel-Booking is a modern hotel booking platform built to make finding the perfect stay simple and joyful.
                        From luxury resorts in Rishikesh to cozy cottages in Manali and heritage palaces in Jaipur, we connect
                        travelers with the best hotels at the best prices.
                    </p>
                    <p>
                        Whether you are planning a family holiday, a business trip or a romantic getaway, our platform helps you
                        compare hotels, check live room availability and book instantly — all in one place.
                    </p>
                </div>

                <div className="about-stats">
                    {stats.map((stat, index) => (
                        <div className="about-stat-card" key={index}>
                            <h2>{stat.number}</h2>
                            <p>{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="about-features">
                    <h2>Why Choose Us</h2>
                    <div className="about-features-grid">
                        {features.map((feature, index) => (
                            <div className="about-feature-card" key={index}>
                                <span className="feature-icon">{feature.icon}</span>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default About;
