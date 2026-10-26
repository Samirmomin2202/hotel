import { useNavigate } from "react-router-dom";
import { FaLocationDot } from "react-icons/fa6";
import { FaStar } from "react-icons/fa";
import { resolveImageUrl } from "../utils/imageUrl";
import fallbackHotelImage from "../assets/hotel1.jpg";
import "./HotelCard.css";

function HotelCard({ data }) {
    const navigate = useNavigate();
    return (
        <article className="hotel-card">
            <div className="hotel-card-image">
                <img
                    src={resolveImageUrl(data.images?.[0]) || fallbackHotelImage}
                    alt={`${data.name} hotel`}
                    loading="lazy"
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackHotelImage;
                    }}
                />
                {data.category && <div className="hotel-card-category">{data.category}</div>}
            </div>
            <div className="hotel-card-data">
                <div className="hotel-card-location">
                    <FaLocationDot />
                    <span>{data.city}, {data.address}</span>
                </div>
                <div className="hotel-card-name"><span>{data.name}</span></div>
                <div className="hotel-card-rating">
                    <span><FaStar /> {data.rating || data.star_rating || "New"}</span>
                </div>
                <div className="hotel-card-price">
                    <p>₹{(Number(data.price) || 0).toLocaleString("en-IN")}</p>
                    <span>/night</span>
                </div>
                <div className="hotel-card-action">
                    <button onClick={() => navigate(`/hotel/${data._id || data.id}`)}>View details</button>
                </div>
            </div>
        </article>
    );
}

export default HotelCard;
