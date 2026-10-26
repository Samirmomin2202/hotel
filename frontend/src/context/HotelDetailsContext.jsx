import { createContext, useState } from "react"
import api from "../api/api";

export const HotelDetailsDataProvider = createContext();
function HotelDetailsContext({ children }) {
    const [isPopupOpen, setIsPopUpOpen] = useState(false);
    const [currBookingDetails, setCurrBookingDetails] = useState(null);
    const [userBookingData, setUserBookingData] = useState({
        user_id: "",
        hotel_id: "",
        room_id: "",
        check_in_date: "",
        check_out_date: "",
        number_of_guests: "",
        total_amount: "",
        tax_amount: "",
        final_amount: "",
        special_requests: "",
        cancellation_reason: "",
        alternate_phone_number: ""
    });
    function handleChange(e) {
        const label = e.target.name; //special_requests
        const value = e.target.value; //value1
        setUserBookingData({ ...userBookingData, [label]: value });
    }

    async function bookHotel() {
        const res = await api.post("/bookings", {
            hotel_id: userBookingData.hotel_id,
            room_id: userBookingData.room_id,
            check_in_date: userBookingData.check_in_date,
            check_out_date: userBookingData.check_out_date,
            number_of_guests: userBookingData.number_of_guests,
            special_requests: userBookingData.special_requests,
            alternate_phone_number: userBookingData.alternate_phone_number
        });
        return res.data.data;
    }
    return (
        <HotelDetailsDataProvider.Provider value={{ isPopupOpen, setIsPopUpOpen, currBookingDetails, setCurrBookingDetails, userBookingData, setUserBookingData, handleChange, bookHotel }}>
            {children}
        </HotelDetailsDataProvider.Provider>
    )
}

export default HotelDetailsContext;
