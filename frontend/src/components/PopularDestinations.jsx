import "./PopularDestinations.css";
import img1 from "../assets/GANGTOK.jpg";
import img2 from "../assets/SRINAGAR.jpg"
import img3 from "../assets/JAIPUR.jpg"
import img4 from "../assets/manali.jpg"
import img5 from "../assets/GULMARG.jpg"
import img6 from "../assets/SHILLONG.jpg"


import { useNavigate } from "react-router-dom";
function PopularDestinations() {
    const destinations = [
        {
            name: "Gangtok",
            imgUrl: img1
        },
        {
            name: "Srinagar",
            imgUrl: img2
        },
        {
            name: "Jaipur",
            imgUrl: img3
        },
        {
            name: "Manali",
            imgUrl: img4
        },
        {
            name: "Gulmarg",
            imgUrl: img5
        },
        {
            name: "Shillong",
            imgUrl: img6
        }
    ]
    const navigate = useNavigate();
    return (
        <section id="destination-section">
            <h1>Popular Destinations</h1>
            <p>Find best hotels in your dream city</p>
            <div id="destination-grid">
                {
                    destinations.map((currDest, index) => {
                        return <div id="destination-card" onClick={() => {
                            navigate(`/hotels?hotelname=${currDest.name}`)
                        }} key={index}>
                            <img src={currDest.imgUrl} alt={currDest.name} loading="lazy" />
                            <h2>{currDest.name}</h2>
                        </div>
                    })
                }
            </div>
        </section>

    )
}

export default PopularDestinations;