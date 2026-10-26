import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header";
import UserContext from "./context/UserContext";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Hotels from "./pages/Hotels";
import HotelDetails from "./pages/HotelDetails";
import NoRouteFound from "./pages/NoRouteFound";
import HotelDetailsContext from "./context/HotelDetailsContext";
import RegisterHotel from "./pages/RegisterHotel";
import MyBookings from "./pages/MyBookings";
import SetupHotel from "./pages/SetupHotel";
import UpdateHotelDetails from "./pages/UpdateHotelDetails";
import ManageRooms from "./pages/ManageRooms";
import ManageBookings from "./pages/ManageBookings";
import Register from "./pages/Register";
import HotelsDataContext from "./context/HotelsDataContext";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProtectedRoutes from "./ProtectedRoutes/AdminProtectedRoutes";
import ChatbotWidget from "./components/ChatbotWidget";
import BookingSuccess from "./pages/BookingSuccess";

function App() {
  const currLocation = useLocation();
  const isOwnerRoute = currLocation.pathname.includes("setup-hotel");
  const isAdminRoute = currLocation.pathname.startsWith("/admin");
  return <UserContext>
    <div>
      {!isOwnerRoute && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/hotels" element={
          <HotelsDataContext>
            <Hotels />
          </HotelsDataContext>
        } />

        <Route path="/hotel/:id" element={
          <HotelDetailsContext>
            <HotelDetails />
          </HotelDetailsContext>} />
        <Route path="/register-hotel" element={<RegisterHotel />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/booking/success/:id" element={<BookingSuccess />} />
        <Route path="/admin" element={<AdminProtectedRoutes><AdminDashboard /></AdminProtectedRoutes>} />

        {/* Owner Routes  */}
        <Route path="/setup-hotel" element={<SetupHotel />}>
          <Route path="" element={<UpdateHotelDetails />} />
          <Route path="manage-rooms" element={<ManageRooms />} />
          <Route path="manage-bookings" element={<ManageBookings />} />
        </Route>

        {/* Default Route  */}
        <Route path="*" element={<NoRouteFound />} />
      </Routes>
      {!isAdminRoute && <Footer />}
      <ChatbotWidget />
    </div>
  </UserContext>
}

export default App;
