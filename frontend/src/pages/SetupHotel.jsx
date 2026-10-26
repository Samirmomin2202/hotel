import { Link, Outlet } from "react-router-dom";
import OwnerProtectedRoutes from "../ProtectedRoutes/OwnerProtectedRoutes";
import "./SetupHotel.css";
import { useContext, useState } from "react";
import { UserDataContext } from "../context/UserContext";
import defaultUserImage from "../assets/default-avatar-image.png"
import { GiHamburgerMenu } from "react-icons/gi";
import { RxCross2 } from "react-icons/rx";
function SetupHotel() {
    const { user, logout } = useContext(UserDataContext);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    return (
        <OwnerProtectedRoutes>
            <section className="setup-hotel">
                <div className={`sidebar ${!isMobileSidebarOpen && "sidebar-close"}`}>
                    <div className="sidebar-close-btn">
                        <RxCross2 onClick={() => setIsMobileSidebarOpen(false)} />
                    </div>
                    <div className="sidebar-header">
                        <h1>Hotel-Booking</h1>
                        <div className="sidebar-links">
                            <div className="sidebar-link">
                                <Link to="/setup-hotel">Update Hotel Detials</Link>
                            </div>
                            <div className="sidebar-link">
                                <Link to="/setup-hotel/manage-rooms">Manage Rooms</Link>
                            </div>
                            <div className="sidebar-link">
                                <Link to="/setup-hotel/manage-bookings">Manage Bookings</Link>
                            </div>
                            <div className="sidebar-link">
                                <div onClick={logout}>Logout</div>
                            </div>
                        </div>
                    </div>
                    <div className="sidebar-footer">
                        <div className="owner-details">
                            <div className="owner-image">
                                <img src={user?.profileImg || defaultUserImage} alt={user?.name} />
                            </div>
                            <div className="owner-name">
                                <span>{user?.name}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mobile-sidebar-icon"><GiHamburgerMenu onClick={() => setIsMobileSidebarOpen(true)} /></div>
                <div className="content">
                    <Outlet />
                </div>
            </section>
        </OwnerProtectedRoutes>
    )
}

export default SetupHotel;