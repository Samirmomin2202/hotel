import { useContext } from "react"
import { HotelDetailsDataProvider } from "../../context/HotelDetailsContext"

function StayDetailsSections() {
    const { userBookingData, handleChange } = useContext(HotelDetailsDataProvider)
    return (
        <div className="pop-up-form">
            <form>
                <div className="form-column">
                    <label htmlFor="check_in_date">Check-In Date</label>
                    <input type="date" value={userBookingData.check_in_date} name="check_in_date" onChange={handleChange} id="check_in_date" />
                </div>
                <div className="form-column">
                    <label htmlFor="check_out_date">Check-Out Date</label>
                    <input type="date" value={userBookingData.check_out_date} name="check_out_date" id="check_out_date" onChange={handleChange}/>
                </div>
                <div className="form-column">
                    <label htmlFor="number_of_guests">Number Of People</label>
                    <input type="number" value={userBookingData.number_of_guests} name="number_of_guests" id="number_of_guests" onChange={handleChange}/>
                </div>
                <div className="form-column">
                    <label htmlFor="special_requests">Special Requests</label>
                    <textarea value={userBookingData.special_requests} name="special_requests" id="special_requests" onChange={handleChange}></textarea>
                </div>
            </form>
        </div>
    )
}

export default StayDetailsSections