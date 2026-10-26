import "./ManageBookings.css";
import { RxCross2 } from "react-icons/rx";
import { useEffect, useState } from "react";
import api from "../api/api";
import { useContext } from "react";
import { UserDataContext } from "../context/UserContext"

function ManageBookings() {
    // console.log(demoBookingsData)
    const [isPopUpOpen, setIsPopUpOpen] = useState(false);
    const [data, setData] = useState([]);
    const { user } = useContext(UserDataContext);
    const [currentBooking, setCurrentBooking] = useState(-1);
    function bookingStatusClass(status) {
        if (status == "confirmed" || status == "success") {
            return "status-confirmed"
        }
        else if (status == "cancelled") {
            return "status-cancelled"
        }
        else if (status == "refunded") {
            return "status-refunded"
        }
        else {
            return "status-pending"
        }
    }
    async function getData() {
        try {
            const res = await api.get(`/bookings/hotel/${user.hotel}`);
            setData(res?.data?.data);
        }
        catch (err) {
            console.log(err);
            alert(err?.response?.data?.message || "Internal Server Error");
        }
    }
    async function updateBookingStatus(status,id) {
        try {
            const res = await api.put(`/bookings/${id}`,{status});
            if(res.status == 200 || res.status == 201){
                alert("Booking Updated Successfully");
            }
        }
        catch (err) {
            console.log(err);
            alert(err?.response?.data?.message || "Internal Server Error");
        }
    }
    useEffect(() => {
        getData();
    }, [])

    return (
        <>
            {isPopUpOpen && <div className="manage-bookings-pop-up">
                <div className="manage-bookings-pop-up-container">
                    <div className="add-room-pop-up-header">
                        <h2>Booking Details</h2>
                        <span className="close-pop-up">
                            <RxCross2 onClick={() => setIsPopUpOpen(false)} />
                        </span>
                    </div>

                    <div className="manage-booking-grid">
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">Booking Id</span>
                            <span className="manage-booking-column-value">{data[currentBooking]._id}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">User Id</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.user_id?._id}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">User Name</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.user_id?.first_name + " "+data[currentBooking]?.user_id?.last_name}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">User Email</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.user_id?.email}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">User Phone Number</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.user_id?.phone}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">Alternate Phone Number</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.alternate_phone_number}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">Date Of Birth</span>
                            <span className="manage-booking-column-value">{
                                data[currentBooking].user_id?.date_of_birth
                                }</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">Room Name</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.room_id?.name}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">Check In Date</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.check_in_date}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">Check Out Date</span>
                            <span className="manage-booking-column-value">{data[currentBooking].check_out_date}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">Final Amount</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.final_amount}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">Status</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.status}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">Payment Status</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.payment_status}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">Payment Method</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.payment_method}</span>
                        </div>
                        <div className="manage-bookings-columns">
                            <span className="manage-booking-column-label">Transaction Id</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.transaction_id}</span>
                        </div>
                        <div className="manage-bookings-columns special-requests-column">
                            <span className="manage-booking-column-label">Special Requests</span>
                            <span className="manage-booking-column-value">{data[currentBooking]?.special_requests}</span>
                        </div>


                    </div>

                    <div className="manage-bookings-pop-up-footer">
                        <button className="confirm-booking-btn" onClick={()=>{
                            updateBookingStatus("confirmed",data[currentBooking]._id)
                        }}>Confirm Booking</button>
                        <button className="cancel-booking-btn" onClick={()=>{
                            updateBookingStatus("cancelled",data[currentBooking]._id)
                        }}>Cancel Booking</button>
                        <button className="mark-complete-booking-btn" onClick={()=>{
                            updateBookingStatus("completed",data[currentBooking]._id)
                        }}>Mark As Completed</button>
                        <button onClick={() => setIsPopUpOpen(false)} className="close-btn">Close</button>
                    </div>
                </div>
            </div>}

            <section className="manage-bookings">
                <div className="manage-bookings-header">
                    <h1>All Bookings</h1>
                    <div className="manage-bookings-filter">
                        <select>
                            <option value="">All Status</option>
                            <option value="">Accepted</option>
                            <option value="">Confirmed</option>
                            <option value="">Cancelled</option>
                            <option value="">Completed</option>
                        </select>
                        <input type="date" />
                    </div>
                </div>

                <div className="manage-bookings-content">
                    <table className="manage-bookings-table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Guest</th>
                                <th>Room</th>
                                <th>Check-In</th>
                                <th>Check-Out</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                data.map((bookingData, index) => {
                                    return <tr key={index}>
                                        <td>{bookingData._id.substring(0, 8)}...</td>
                                        <td>{bookingData?.user_id?.first_name}</td>
                                        <td>{bookingData?.room_id?.name}</td>
                                        <td>{bookingData.check_in_date}</td>
                                        <td>{bookingData.check_out_date}</td>
                                        <td>{bookingData.final_amount}</td>
                                        <td><span className={bookingStatusClass(bookingData.status)}>{bookingData.status}</span></td>
                                        <td><span className={bookingStatusClass(bookingData.payment_status)}>{bookingData.payment_status}</span></td>
                                        <td><button className="view-booking-btn" onClick={() => {
                                            setIsPopUpOpen(true);
                                            setCurrentBooking(index);
                                        }}>View</button></td>
                                    </tr>
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    )
}

export default ManageBookings