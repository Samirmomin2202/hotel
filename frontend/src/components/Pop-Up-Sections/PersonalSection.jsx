import { useContext } from "react"
import { UserDataContext } from "../../context/UserContext";
import { HotelDetailsDataProvider } from "../../context/HotelDetailsContext";
function PersonalSection() {
    const { user } = useContext(UserDataContext);
    const { userBookingData, handleChange } = useContext(HotelDetailsDataProvider)
    return (
        <div className="pop-up-form">
            <form>
                <div className="form-column">
                    <label htmlFor="">Name</label>
                    <input type="text" value={user.name} readOnly />
                </div>
                <div className="form-column">
                    <label htmlFor="">Email</label>
                    <input type="email" value={user.email} readOnly />
                </div>
                <div className="form-column">
                    <label htmlFor="">Phone Number</label>
                    <input type="number" value={user.phone} readOnly />
                </div>
                <div className="form-column">
                    <label htmlFor="alternate_phone_number">Alternate Phone Number</label>
                    <input type="number" value={userBookingData.alternate_phone_number} name="alternate_phone_number" onChange={handleChange} id="alternate_phone_number"/>
                </div>
            </form>
        </div>
    )
}

export default PersonalSection