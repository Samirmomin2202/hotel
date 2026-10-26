import { createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiBarChart2, FiCalendar, FiCreditCard, FiDownload, FiFileText, FiGrid, FiHome,
    FiLogOut, FiMenu, FiMessageSquare, FiRefreshCw, FiTrash2, FiUsers, FiX
} from "react-icons/fi";
import api from "../api/api";
import { UserDataContext } from "../context/UserContext";
import "./AdminDashboard.css";

const navItems = [
    { id: "overview", label: "Overview", icon: FiGrid },
    { id: "users", label: "Users", icon: FiUsers },
    { id: "hotels", label: "Hotels", icon: FiHome },
    { id: "bookings", label: "Bookings", icon: FiCalendar },
    { id: "reports", label: "Reports", icon: FiBarChart2 },
    { id: "chatbot", label: "Chatbot answers", icon: FiMessageSquare },
    { id: "payments", label: "Payments", icon: FiCreditCard }
];

const roleLabels = {
    customer: "Customer",
    "hotel-manager": "Hotel manager",
    admin: "Admin"
};
const bookingStatuses = ["pending", "confirmed", "cancelled", "completed"];
const paymentStatuses = ["pending", "success", "failed", "refunded"];
const emptyKnowledgeForm = { title: "", question: "", answer: "", keywords: "", published: false };
const emptyHotelForm = {
    name: "", description: "", address: "", city: "", state: "", country: "India", zip_code: "",
    category: "budget", star_rating: "3", price: "", images: "", amenities: "wifi, ac",
    contact_email: "", contact_phone: "", check_in_time: "14:00", check_out_time: "11:00",
    cancellation: "", pets: false, is_active: true
};

function formatCurrency(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function fullName(user) {
    if (!user || typeof user === "string") return "Guest";
    return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "Guest";
}

function dateInputValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function xmlEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
    })[character]);
}

function buildExcelWorkbook(sheets) {
    const worksheets = sheets.map(({ name, rows }) => `<Worksheet ss:Name="${xmlEscape(name)}"><Table>${rows.map((row) => `<Row>${row.map((value) => {
        const type = typeof value === "number" && Number.isFinite(value) ? "Number" : "String";
        return `<Cell><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`;
    }).join("")}</Row>`).join("")}</Table></Worksheet>`).join("");
    return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${worksheets}</Workbook>`;
}

function buildReportPdf(report) {
    const safe = (value) => String(value ?? "").normalize("NFKD").replace(/[^\x20-\x7E]/g, "?").replace(/[()\\]/g, "\\$&").slice(0, 100);
    const commands = [];
    const text = (x, y, value, size = 11, color = "0.12 0.18 0.28") => {
        commands.push(`${color} rg BT /F1 ${size} Tf ${x} ${y} Td (${safe(value)}) Tj ET`);
    };
    const line = (x1, y1, x2, y2, color = "0.86 0.89 0.93") => commands.push(`${color} RG 0.7 w ${x1} ${y1} m ${x2} ${y2} l S`);
    const bar = (x, y, width, color = "0.20 0.47 0.91") => commands.push(`${color} rg ${x} ${y} ${Math.max(1, width)} 11 re f`);

    text(48, 792, "Hotel Booking System - Admin Report", 20, "0.10 0.17 0.29");
    text(48, 772, `Period: ${report.period}`, 10, "0.39 0.45 0.54");
    const metrics = [
        [`Bookings: ${report.bookings.length}`, 48],
        [`Paid revenue: INR ${report.paidRevenue.toFixed(2)}`, 180],
        [`Hotels: ${report.hotels}`, 370],
        [`Users: ${report.users}`, 485]
    ];
    metrics.forEach(([label, x]) => text(x, 738, label, 10));
    line(48, 724, 547, 724);

    text(48, 702, "Booking status", 13, "0.10 0.17 0.29");
    let y = 680;
    const maxStatus = Math.max(1, ...report.statuses.map((item) => item.count));
    report.statuses.forEach((item) => {
        text(48, y, item.label, 10);
        bar(150, y - 2, 250 * item.count / maxStatus);
        text(414, y, String(item.count), 10);
        y -= 20;
    });
    y -= 10;
    text(48, y, "Paid revenue by month (INR)", 13, "0.10 0.17 0.29");
    y -= 24;
    const maxRevenue = Math.max(1, ...report.monthly.map((item) => item.revenue));
    report.monthly.forEach((item) => {
        text(48, y, item.label, 9);
        bar(115, y - 2, 285 * item.revenue / maxRevenue, "0.34 0.68 0.57");
        text(410, y, item.revenue.toFixed(0), 9);
        y -= 18;
    });
    line(48, y - 4, 547, y - 4);
    text(48, y - 22, "Latest bookings", 13, "0.10 0.17 0.29");
    y -= 42;
    report.bookings.slice(0, 12).forEach((booking) => {
        text(48, y, `${new Date(booking.createdAt).toLocaleDateString()} | ${fullName(booking.user_id)} | ${booking.hotel_id?.name || "Hotel"} | INR ${Number(booking.final_amount || 0).toFixed(2)} | ${booking.status}/${booking.payment_status}`, 8);
        y -= 15;
    });

    const stream = commands.join("\n");
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
}

function AdminDashboard() {
    const { user, logout } = useContext(UserDataContext);
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [overview, setOverview] = useState(null);
    const [users, setUsers] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [hotelForm, setHotelForm] = useState(emptyHotelForm);
    const [hotelEditorOpen, setHotelEditorOpen] = useState(false);
    const [editingHotelId, setEditingHotelId] = useState("");
    const [savingHotel, setSavingHotel] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [knowledge, setKnowledge] = useState([]);
    const [ragStatus, setRagStatus] = useState({ connected: false, authenticationConfigured: false, queryField: "message" });
    const [knowledgeForm, setKnowledgeForm] = useState(emptyKnowledgeForm);
    const [editingKnowledgeId, setEditingKnowledgeId] = useState("");
    const [savingKnowledge, setSavingKnowledge] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [updatingRecord, setUpdatingRecord] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [reportStart, setReportStart] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 5, 1);
        return dateInputValue(date);
    });
    const [reportEnd, setReportEnd] = useState(() => dateInputValue(new Date()));

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [overviewResponse, usersResponse, hotelsResponse, bookingsResponse, knowledgeResponse, ragResponse] = await Promise.all([
                api.get("/admin/overview"),
                api.get("/admin/users"),
                api.get("/admin/hotels"),
                api.get("/admin/bookings"),
                api.get("/admin/chatbot/knowledge"),
                api.get("/admin/chatbot/status")
            ]);
            setOverview(overviewResponse.data.data);
            setUsers(usersResponse.data.data);
            setHotels(hotelsResponse.data.data);
            setBookings(bookingsResponse.data.data);
            setKnowledge(knowledgeResponse.data.data);
            setRagStatus(ragResponse.data.data);
        } catch (err) {
            setError(err?.response?.data?.message || "Could not load the admin dashboard.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const query = searchQuery.trim().toLowerCase();
    const filteredUsers = useMemo(() => users.filter((person) =>
        !query || `${person.first_name} ${person.last_name} ${person.email} ${person.role}`.toLowerCase().includes(query)
    ), [users, query]);
    const filteredHotels = useMemo(() => hotels.filter((hotel) =>
        !query || `${hotel.name} ${hotel.city} ${hotel.country} ${hotel.created_by?.email || ""}`.toLowerCase().includes(query)
    ), [hotels, query]);
    const filteredBookings = useMemo(() => bookings.filter((booking) =>
        !query || `${fullName(booking.user_id)} ${booking.user_id?.email || ""} ${booking.hotel_id?.name || ""} ${booking.status} ${booking.payment_status}`.toLowerCase().includes(query)
    ), [bookings, query]);
    const report = useMemo(() => {
        const start = reportStart ? new Date(`${reportStart}T00:00:00`) : null;
        const end = reportEnd ? new Date(`${reportEnd}T23:59:59.999`) : null;
        const selectedBookings = bookings.filter((booking) => {
            const created = new Date(booking.createdAt || 0);
            return (!start || created >= start) && (!end || created <= end);
        });
        const statuses = ["pending", "confirmed", "completed", "cancelled"].map((label) => ({
            label,
            count: selectedBookings.filter((booking) => booking.status === label).length
        }));
        const months = [];
        if (start && end && start <= end) {
            const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
            const finalMonth = new Date(end.getFullYear(), end.getMonth(), 1);
            while (cursor <= finalMonth && months.length < 18) {
                months.push({
                    key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
                    label: cursor.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
                    bookings: 0,
                    revenue: 0
                });
                cursor.setMonth(cursor.getMonth() + 1);
            }
        }
        const monthByKey = new Map(months.map((month) => [month.key, month]));
        for (const booking of selectedBookings) {
            const date = new Date(booking.createdAt || 0);
            const month = monthByKey.get(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
            if (!month) continue;
            month.bookings += 1;
            if (booking.payment_status === "success") month.revenue += Number(booking.final_amount || 0);
        }
        return {
            bookings: selectedBookings,
            statuses,
            monthly: months,
            paidRevenue: selectedBookings.filter((booking) => booking.payment_status === "success")
                .reduce((total, booking) => total + Number(booking.final_amount || 0), 0),
            period: `${reportStart || "Beginning"} to ${reportEnd || "Today"}`
        };
    }, [bookings, reportStart, reportEnd]);

    async function changeRole(userId, role) {
        setUpdatingRecord(userId);
        setNotice("");
        setError("");
        try {
            const response = await api.patch(`/admin/users/${userId}/role`, { role });
            setUsers((current) => current.map((person) => person._id === userId ? response.data.data : person));
            setNotice("User role updated.");
        } catch (err) {
            setError(err?.response?.data?.message || "Could not update this user role.");
        } finally {
            setUpdatingRecord("");
        }
    }

    async function deleteUser(person) {
        const name = fullName(person);
        if (!window.confirm(`Delete ${name} (${person.email})? Their reviews will be removed. Booking history will be retained without the account link.`)) return;
        setUpdatingRecord(person._id);
        setNotice("");
        setError("");
        try {
            await api.delete(`/admin/users/${person._id}`);
            setUsers((current) => current.filter((item) => item._id !== person._id));
            setOverview((current) => current ? { ...current, users: Math.max(0, Number(current.users || 0) - 1) } : current);
            setNotice(`Account for ${name} deleted.`);
        } catch (err) {
            setError(err?.response?.data?.message || "Could not delete this account.");
        } finally {
            setUpdatingRecord("");
        }
    }

    async function changeBooking(bookingId, field, value) {
        setUpdatingRecord(bookingId);
        setNotice("");
        setError("");
        try {
            const response = await api.patch(`/admin/bookings/${bookingId}`, { [field]: value });
            setBookings((current) => current.map((booking) => booking._id === bookingId ? response.data.data : booking));
            setNotice("Booking updated.");
        } catch (err) {
            setError(err?.response?.data?.message || "Could not update this booking.");
        } finally {
            setUpdatingRecord("");
        }
    }

    function openHotelEditor(hotel = null) {
        setEditingHotelId(hotel?._id || "");
        setHotelForm(hotel ? {
            name: hotel.name || "",
            description: hotel.description || "",
            address: hotel.address || "",
            city: hotel.city || "",
            state: hotel.state || "",
            country: hotel.country || "",
            zip_code: hotel.zip_code || "",
            category: hotel.category || "budget",
            star_rating: String(hotel.star_rating || 3),
            price: String(hotel.price ?? ""),
            images: (hotel.images || []).join("\n"),
            amenities: Object.entries(hotel.amenities || {}).filter(([, enabled]) => enabled).map(([name]) => name).join(", "),
            contact_email: hotel.contact_email || "",
            contact_phone: hotel.contact_phone || "",
            check_in_time: hotel.check_in_time || "",
            check_out_time: hotel.check_out_time || "",
            cancellation: hotel.policies?.cancellation || "",
            pets: Boolean(hotel.policies?.pets),
            is_active: hotel.is_active !== false
        } : emptyHotelForm);
        setHotelEditorOpen(true);
        setNotice("");
        setError("");
    }

    async function saveHotel(event) {
        event.preventDefault();
        setSavingHotel(true);
        setError("");
        setNotice("");
        const payload = {
            ...hotelForm,
            images: hotelForm.images.split(/\r?\n|,/).map((image) => image.trim()).filter(Boolean),
            policies: { cancellation: hotelForm.cancellation, pets: hotelForm.pets }
        };
        try {
            const response = editingHotelId
                ? await api.put(`/admin/hotels/${editingHotelId}`, payload)
                : await api.post("/admin/hotels", payload);
            setHotels((current) => editingHotelId
                ? current.map((hotel) => hotel._id === editingHotelId ? response.data.data : hotel)
                : [response.data.data, ...current]);
            setHotelEditorOpen(false);
            setEditingHotelId("");
            setHotelForm(emptyHotelForm);
            setNotice(editingHotelId ? "Hotel details updated." : "Hotel added.");
        } catch (err) {
            setError(err?.response?.data?.message || "Could not save this hotel.");
        } finally {
            setSavingHotel(false);
        }
    }

    async function toggleHotelActive(hotel) {
        const nextIsActive = hotel.is_active === false;
        try {
            const response = await api.put(`/admin/hotels/${hotel._id}`, {
                ...hotel,
                is_active: nextIsActive
            });
            setHotels((current) => current.map((item) => item._id === hotel._id ? response.data.data : item));
            setNotice(nextIsActive ? "Hotel is now visible to guests." : "Hotel is now hidden from guests.");
            setError("");
        } catch (err) {
            setError(err?.response?.data?.message || "Could not update hotel visibility.");
        }
    }

    async function removeHotel(hotel) {
        if (!window.confirm(`Delete ${hotel.name}? This also removes its rooms. Hotels with bookings cannot be deleted.`)) return;
        try {
            await api.delete(`/admin/hotels/${hotel._id}`);
            setHotels((current) => current.filter((item) => item._id !== hotel._id));
            setNotice("Hotel deleted.");
            setError("");
        } catch (err) {
            setError(err?.response?.data?.message || "Could not delete this hotel.");
        }
    }

    function startKnowledgeEdit(entry) {
        setEditingKnowledgeId(entry._id);
        setKnowledgeForm({
            title: entry.title,
            question: entry.question,
            answer: entry.answer,
            keywords: (entry.keywords || []).join(", "),
            published: entry.published
        });
        setNotice("");
        setError("");
    }

    function resetKnowledgeForm() {
        setEditingKnowledgeId("");
        setKnowledgeForm(emptyKnowledgeForm);
    }

    async function saveKnowledge(event) {
        event.preventDefault();
        setSavingKnowledge(true);
        setNotice("");
        setError("");
        const payload = {
            ...knowledgeForm,
            keywords: knowledgeForm.keywords.split(",").map((word) => word.trim()).filter(Boolean)
        };
        try {
            const response = editingKnowledgeId
                ? await api.put(`/admin/chatbot/knowledge/${editingKnowledgeId}`, payload)
                : await api.post("/admin/chatbot/knowledge", payload);
            setKnowledge((current) => editingKnowledgeId
                ? current.map((entry) => entry._id === editingKnowledgeId ? response.data.data : entry)
                : [response.data.data, ...current]);
            setNotice(editingKnowledgeId ? "Chat answer updated." : "Chat answer added.");
            resetKnowledgeForm();
        } catch (err) {
            setError(err?.response?.data?.message || "Could not save this chat answer.");
        } finally {
            setSavingKnowledge(false);
        }
    }

    async function deleteKnowledge(entry) {
        if (!window.confirm(`Delete “${entry.title}” from chatbot answers?`)) return;
        setError("");
        setNotice("");
        try {
            await api.delete(`/admin/chatbot/knowledge/${entry._id}`);
            setKnowledge((current) => current.filter((item) => item._id !== entry._id));
            if (editingKnowledgeId === entry._id) resetKnowledgeForm();
            setNotice("Chat answer deleted.");
        } catch (err) {
            setError(err?.response?.data?.message || "Could not delete this chat answer.");
        }
    }

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    function selectSection(section) {
        setActiveSection(section);
        setSidebarOpen(false);
        setSearchQuery("");
        setError("");
        setNotice("");
    }

    function renderOverview() {
        const stats = [
            { label: "Registered users", value: overview?.users ?? 0, icon: FiUsers, tone: "blue" },
            { label: "Hotels", value: overview?.hotels ?? 0, icon: FiHome, tone: "violet" },
            { label: "Bookings", value: overview?.bookings ?? 0, icon: FiCalendar, tone: "orange" },
            { label: "Booking value", value: formatCurrency(overview?.revenue), icon: FiGrid, tone: "green" }
        ];
        return <>
            <div className="admin-stats">
                {stats.map(({ label, value, icon: Icon, tone }) => <article className="admin-stat-card" key={label}>
                    <span className={`admin-stat-icon admin-stat-${tone}`}>{createElement(Icon)}</span>
                    <div><span>{label}</span><strong>{loading ? "—" : value}</strong></div>
                </article>)}
            </div>
            <section className="admin-panel">
                <div className="admin-section-heading">
                    <div><h2>Recent bookings</h2><p>Latest booking activity across all hotels.</p></div>
                    <button className="admin-text-button" onClick={() => selectSection("bookings")}>View all bookings</button>
                </div>
                <div className="admin-table-wrap"><table className="admin-table">
                    <thead><tr><th>Guest</th><th>Hotel</th><th>Dates</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>{bookings.slice(0, 6).map((booking) => <tr key={booking._id}>
                        <td>{fullName(booking.user_id)}</td>
                        <td>{booking.hotel_id?.name || "Hotel unavailable"}</td>
                        <td>{booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "—"}</td>
                        <td>{formatCurrency(booking.final_amount)}</td>
                        <td><span className={`admin-status admin-status-${booking.status}`}>{booking.status}</span></td>
                    </tr>)}</tbody>
                </table>{!loading && bookings.length === 0 && <p className="admin-empty">No bookings yet.</p>}</div>
            </section>
            <div className="admin-overview-bottom">
                <section className="admin-panel admin-summary-panel">
                    <h2>Platform snapshot</h2>
                    <p>{users.filter((person) => person.role === "hotel-manager").length} hotel managers are registered.</p>
                    <p>{knowledge.filter((entry) => entry.published).length} chatbot answers are published to users.</p>
                    <button className="admin-text-button" onClick={() => selectSection("chatbot")}>Manage chatbot answers</button>
                </section>
                <section className="admin-panel admin-summary-panel">
                    <h2>Admin access</h2>
                    <p>Review accounts, hotel listings, bookings, and the help answers shown to users.</p>
                    <button className="admin-text-button" onClick={() => selectSection("users")}>Manage accounts</button>
                    <button className="admin-text-button" onClick={() => selectSection("reports")}>View reports</button>
                </section>
            </div>
        </>;
    }

    function renderUsers() {
        return <section className="admin-panel">
            <div className="admin-section-heading"><div><h2>All accounts</h2><p>Change roles or remove accounts. Passwords are never exposed.</p></div><span>{filteredUsers.length} accounts</span></div>
            <div className="admin-table-wrap"><table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Access role</th><th>Actions</th></tr></thead>
                <tbody>{filteredUsers.map((person) => <tr key={person._id}>
                    <td>{fullName(person)}</td><td>{person.email}</td>
                    <td>{person.createdAt ? new Date(person.createdAt).toLocaleDateString() : "—"}</td>
                    <td><select aria-label={`Role for ${person.email}`} value={person.role} disabled={updatingRecord === person._id} onChange={(event) => changeRole(person._id, event.target.value)}>
                        {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select></td>
                    <td><button className="admin-delete-user" type="button" disabled={updatingRecord === person._id || String(user?._id) === String(person._id)} title={String(user?._id) === String(person._id) ? "You cannot delete your own account" : `Delete ${person.email}`} aria-label={`Delete account ${person.email}`} onClick={() => deleteUser(person)}><FiTrash2 aria-hidden="true" /><span>Delete</span></button></td>
                </tr>)}</tbody>
            </table>{!loading && filteredUsers.length === 0 && <p className="admin-empty">No matching accounts.</p>}</div>
        </section>;
    }

    function renderHotels() {
        return <section className="admin-panel">
            <div className="admin-section-heading"><div><h2>All hotels</h2><p>Create listings, edit details, or hide hotels from guest search.</p></div><div className="admin-hotel-heading-actions"><span>{filteredHotels.length} hotels</span><button className="admin-primary-button" onClick={() => openHotelEditor()}>Add hotel</button></div></div>
            {hotelEditorOpen && <div className="admin-hotel-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHotelEditorOpen(false); }}>
                <form className="admin-hotel-editor" onSubmit={saveHotel}>
                    <div className="admin-hotel-editor-heading"><div><h2>{editingHotelId ? "Edit hotel" : "Add a hotel"}</h2><p>Enter the listing details shown to guests.</p></div><button type="button" aria-label="Close hotel editor" onClick={() => setHotelEditorOpen(false)}>×</button></div>
                    <div className="admin-hotel-form-grid">
                        <label>Hotel name<input required maxLength={120} value={hotelForm.name} onChange={(event) => setHotelForm({ ...hotelForm, name: event.target.value })} /></label>
                        <label>Category<select value={hotelForm.category} onChange={(event) => setHotelForm({ ...hotelForm, category: event.target.value })}><option value="budget">Budget</option><option value="luxury">Luxury</option><option value="resort">Resort</option><option value="cottage">Cottage</option><option value="5-star">5-star</option></select></label>
                        <label className="admin-hotel-form-wide">Description<textarea rows={3} value={hotelForm.description} onChange={(event) => setHotelForm({ ...hotelForm, description: event.target.value })} /></label>
                        <label className="admin-hotel-form-wide">Street address<input value={hotelForm.address} onChange={(event) => setHotelForm({ ...hotelForm, address: event.target.value })} /></label>
                        <label>City<input required value={hotelForm.city} onChange={(event) => setHotelForm({ ...hotelForm, city: event.target.value })} /></label>
                        <label>State<input value={hotelForm.state} onChange={(event) => setHotelForm({ ...hotelForm, state: event.target.value })} /></label>
                        <label>Country<input required value={hotelForm.country} onChange={(event) => setHotelForm({ ...hotelForm, country: event.target.value })} /></label>
                        <label>Postal code<input value={hotelForm.zip_code} onChange={(event) => setHotelForm({ ...hotelForm, zip_code: event.target.value })} /></label>
                        <label>Average price per night (₹)<input type="number" min="0" required value={hotelForm.price} onChange={(event) => setHotelForm({ ...hotelForm, price: event.target.value })} /></label>
                        <label>Star rating<select value={hotelForm.star_rating} onChange={(event) => setHotelForm({ ...hotelForm, star_rating: event.target.value })}>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} star{rating > 1 ? "s" : ""}</option>)}</select></label>
                        <label>Contact email<input type="email" value={hotelForm.contact_email} onChange={(event) => setHotelForm({ ...hotelForm, contact_email: event.target.value })} /></label>
                        <label>Contact phone<input type="tel" value={hotelForm.contact_phone} onChange={(event) => setHotelForm({ ...hotelForm, contact_phone: event.target.value })} /></label>
                        <label>Check-in time<input type="time" value={hotelForm.check_in_time} onChange={(event) => setHotelForm({ ...hotelForm, check_in_time: event.target.value })} /></label>
                        <label>Check-out time<input type="time" value={hotelForm.check_out_time} onChange={(event) => setHotelForm({ ...hotelForm, check_out_time: event.target.value })} /></label>
                        <label className="admin-hotel-form-wide">Image URLs<textarea rows={2} placeholder="One image URL per line" value={hotelForm.images} onChange={(event) => setHotelForm({ ...hotelForm, images: event.target.value })} /></label>
                        <label className="admin-hotel-form-wide">Amenities<input placeholder="wifi, pool, spa, ac, restaurant" value={hotelForm.amenities} onChange={(event) => setHotelForm({ ...hotelForm, amenities: event.target.value })} /></label>
                        <label className="admin-hotel-form-wide">Cancellation policy<textarea rows={2} value={hotelForm.cancellation} onChange={(event) => setHotelForm({ ...hotelForm, cancellation: event.target.value })} /></label>
                        <label className="admin-hotel-checkbox"><input type="checkbox" checked={hotelForm.pets} onChange={(event) => setHotelForm({ ...hotelForm, pets: event.target.checked })} />Pets allowed</label>
                        <label className="admin-hotel-checkbox"><input type="checkbox" checked={hotelForm.is_active} onChange={(event) => setHotelForm({ ...hotelForm, is_active: event.target.checked })} />Visible to guests</label>
                    </div>
                    <div className="admin-hotel-editor-actions"><button type="button" className="admin-secondary-button" onClick={() => setHotelEditorOpen(false)}>Cancel</button><button className="admin-primary-button" disabled={savingHotel}>{savingHotel ? "Saving…" : editingHotelId ? "Save changes" : "Create hotel"}</button></div>
                </form>
            </div>}
            <div className="admin-table-wrap"><table className="admin-table">
                <thead><tr><th>Hotel</th><th>Location</th><th>Rating</th><th>From</th><th>Owner</th><th>Visibility</th><th>Actions</th></tr></thead>
                <tbody>{filteredHotels.map((hotel) => <tr key={hotel._id}>
                    <td><strong>{hotel.name || "Unnamed hotel"}</strong></td>
                    <td>{[hotel.city, hotel.country].filter(Boolean).join(", ") || "—"}</td>
                    <td>{hotel.star_rating || "—"} {hotel.star_rating ? "★" : ""}</td>
                    <td>{formatCurrency(hotel.price)}</td>
                    <td>{hotel.created_by?.email || "Unknown owner"}</td>
                    <td><span className={`admin-hotel-visibility ${hotel.is_active === false ? "admin-hotel-hidden" : ""}`}>{hotel.is_active === false ? "Hidden" : "Visible"}</span></td>
                    <td><div className="admin-hotel-row-actions"><button onClick={() => openHotelEditor(hotel)}>Edit</button><button onClick={() => toggleHotelActive(hotel)}>{hotel.is_active === false ? "Show" : "Hide"}</button><button onClick={() => removeHotel(hotel)}>Delete</button></div></td>
                </tr>)}</tbody>
            </table>{!loading && filteredHotels.length === 0 && <p className="admin-empty">No matching hotels. Use Add hotel to create the first listing.</p>}</div>
        </section>;
    }

    function renderBookings() {
        return <section className="admin-panel">
            <div className="admin-section-heading"><div><h2>All bookings</h2><p>Review and update booking and payment statuses.</p></div><span>{filteredBookings.length} bookings</span></div>
            <div className="admin-table-wrap"><table className="admin-table admin-bookings-table">
                <thead><tr><th>Guest</th><th>Hotel</th><th>Stay</th><th>Guests</th><th>Total</th><th>Booking status</th><th>Payment</th><th>Gateway mode</th></tr></thead>
                <tbody>{filteredBookings.map((booking) => <tr key={booking._id}>
                    <td>{fullName(booking.user_id)}<small>{booking.user_id?.email || ""}</small></td>
                    <td>{booking.hotel_id?.name || "Hotel unavailable"}<small>{booking.room_id?.name || ""}</small></td>
                    <td>{booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "—"}<small>to {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : "—"}</small></td>
                    <td>{booking.number_of_guests || "—"}</td><td>{formatCurrency(booking.final_amount)}</td>
                    <td><select aria-label={`Booking status for ${fullName(booking.user_id)}`} disabled={updatingRecord === booking._id} value={booking.status || "pending"} onChange={(event) => changeBooking(booking._id, "status", event.target.value)}>
                        {bookingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select></td>
                    <td><select aria-label={`Payment status for ${fullName(booking.user_id)}`} disabled={updatingRecord === booking._id} value={booking.payment_status || "pending"} onChange={(event) => changeBooking(booking._id, "payment_status", event.target.value)}>
                        {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select></td>
                    <td>{booking.payment_mode ? `${booking.payment_mode} mode` : booking.payment_method || "—"}</td>
                </tr>)}</tbody>
            </table>{!loading && filteredBookings.length === 0 && <p className="admin-empty">No matching bookings.</p>}</div>
        </section>;
    }

    function renderChatbot() {
        return <section className="admin-panel admin-knowledge-panel">
            <div className="admin-section-heading"><div><h2>Chatbot answers</h2><p>Use your NexaDesk RAG assistant for replies, with local hotel answers as a fallback when no API URL is set.</p></div><span className={`admin-rag-status ${ragStatus.connected ? "admin-rag-status-connected" : ""}`}>{ragStatus.connected ? "RAG API ready" : "Local knowledge only"}</span></div>
            <div className="admin-rag-connection-note"><strong>RAG connection</strong><span>Chat endpoint: <code>{ragStatus.endpointConfigured ? "Configured" : "Not configured"}</code></span><span>Integration key: {ragStatus.authenticationConfigured ? "Configured on backend" : "Not configured"}</span><small>Set RAG_API_URL=http://localhost:8000 and RAG_API_KEY in backend/.env. Create a non-revoked integration key in NexaDesk. Keep it on the backend, never in browser code.</small></div>
            <form className="admin-knowledge-form" onSubmit={saveKnowledge}>
                <label>Answer title<input maxLength={120} required value={knowledgeForm.title} onChange={(event) => setKnowledgeForm({ ...knowledgeForm, title: event.target.value })} placeholder="Booking changes" /></label>
                <label>Example question<input maxLength={300} required value={knowledgeForm.question} onChange={(event) => setKnowledgeForm({ ...knowledgeForm, question: event.target.value })} placeholder="Can I change my booking dates?" /></label>
                <label className="admin-knowledge-wide">Answer<textarea maxLength={2000} required rows={4} value={knowledgeForm.answer} onChange={(event) => setKnowledgeForm({ ...knowledgeForm, answer: event.target.value })} placeholder="Write the answer guests should receive…" /></label>
                <label>Keywords<input value={knowledgeForm.keywords} onChange={(event) => setKnowledgeForm({ ...knowledgeForm, keywords: event.target.value })} placeholder="date change, modify, booking" /></label>
                <label className="admin-publish-toggle"><input type="checkbox" checked={knowledgeForm.published} onChange={(event) => setKnowledgeForm({ ...knowledgeForm, published: event.target.checked })} />Publish for users</label>
                <div className="admin-knowledge-actions"><button className="admin-primary-button" type="submit" disabled={savingKnowledge}>{savingKnowledge ? "Saving…" : editingKnowledgeId ? "Save changes" : "Add answer"}</button>
                    {editingKnowledgeId && <button className="admin-secondary-button" type="button" onClick={resetKnowledgeForm}>Cancel edit</button>}</div>
            </form>
            <div className="admin-knowledge-list">{knowledge.map((entry) => <article className="admin-knowledge-card" key={entry._id}>
                <div className="admin-knowledge-card-copy"><div className="admin-knowledge-card-title"><h3>{entry.title}</h3><span className={entry.published ? "admin-published" : "admin-draft"}>{entry.published ? "Published" : "Draft"}</span></div>
                    <p className="admin-knowledge-question">{entry.question}</p><p>{entry.answer}</p>{!!entry.keywords?.length && <small>Keywords: {entry.keywords.join(", ")}</small>}
                </div><div className="admin-knowledge-card-actions"><button type="button" onClick={() => startKnowledgeEdit(entry)}>Edit</button><button type="button" onClick={() => deleteKnowledge(entry)}>Delete</button></div>
            </article>)}{!loading && knowledge.length === 0 && <p className="admin-empty">Add an answer so the chatbot can help guests.</p>}</div>
        </section>;
    }

    function renderPayments() {
        const paidBookings = bookings.filter((booking) => booking.payment_status === "success");
        const paymentTotal = paidBookings.reduce((sum, booking) => sum + Number(booking.final_amount || 0), 0);
        return <section className="admin-panel admin-payments-panel">
            <div className="admin-section-heading"><div><h2>Payment records</h2><p>Payment status and Razorpay references saved with bookings.</p></div><span className="admin-payment-mode-pill">{paidBookings.length} paid</span></div>
            <div className="admin-payment-summary">
                <article><span>Successful payments</span><strong>{paidBookings.length}</strong></article>
                <article><span>Total collected</span><strong>{formatCurrency(paymentTotal)}</strong></article>
                <article><span>Awaiting payment</span><strong>{bookings.filter((booking) => booking.payment_status === "pending").length}</strong></article>
            </div>
            <div className="admin-table-wrap"><table className="admin-table admin-payments-table">
                <thead><tr><th>Date</th><th>Guest</th><th>Hotel</th><th>Amount</th><th>Status</th><th>Method</th><th>Payment reference</th><th>Order reference</th></tr></thead>
                <tbody>{[...bookings].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map((booking) => <tr key={booking._id}>
                    <td>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "—"}</td>
                    <td>{fullName(booking.user_id)}<small>{booking.user_id?.email || ""}</small></td>
                    <td>{booking.hotel_id?.name || "Hotel unavailable"}<small>{booking.room_id?.name || ""}</small></td>
                    <td>{formatCurrency(booking.final_amount)}</td>
                    <td><span className={`admin-payment-status admin-payment-status-${booking.payment_status || "pending"}`}>{booking.payment_status || "pending"}</span></td>
                    <td>{booking.payment_method || "—"}{booking.payment_mode ? <small>{booking.payment_mode} mode</small> : null}</td>
                    <td className="admin-payment-reference">{booking.transaction_id || "Not paid"}</td>
                    <td className="admin-payment-reference">{booking.razorpay_order_id || "—"}</td>
                </tr>)}</tbody>
            </table>{!loading && bookings.length === 0 && <p className="admin-empty">No payment records yet. Completed checkouts will appear here.</p>}</div>
        </section>;
    }

    function renderReports() {
        const maxStatus = Math.max(1, ...report.statuses.map((item) => item.count));
        const maxRevenue = Math.max(1, ...report.monthly.map((item) => item.revenue));

        function exportExcel() {
            const bookingRows = report.bookings.map((booking) => [
                booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "",
                booking._id,
                fullName(booking.user_id),
                booking.hotel_id?.name || "Hotel unavailable",
                booking.room_id?.name || "",
                booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "",
                booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : "",
                Number(booking.number_of_guests || 0),
                Number(booking.final_amount || 0),
                booking.status || "pending",
                booking.payment_status || "pending"
            ]);
            const workbook = buildExcelWorkbook([
                { name: "Summary", rows: [["Hotel booking report"], ["Period", report.period], ["Bookings", report.bookings.length], ["Paid revenue (INR)", report.paidRevenue], ["Hotels", hotels.length], ["Users", users.length]] },
                { name: "Booking status", rows: [["Status", "Bookings"], ...report.statuses.map((item) => [item.label, item.count])] },
                { name: "Monthly trend", rows: [["Month", "Bookings", "Paid revenue (INR)"], ...report.monthly.map((item) => [item.label, item.bookings, Number(item.revenue.toFixed(2))])] },
                { name: "Booking records", rows: [["Created", "Booking ID", "Guest", "Hotel", "Room", "Check-in", "Check-out", "Guests", "Total (INR)", "Booking status", "Payment status"], ...bookingRows] }
            ]);
            downloadFile(`hotel-report-${reportStart}-to-${reportEnd}.xls`, workbook, "application/vnd.ms-excel;charset=utf-8");
        }

        function exportPdf() {
            const pdf = buildReportPdf({ ...report, hotels: hotels.length, users: users.length });
            downloadFile(`hotel-report-${reportStart}-to-${reportEnd}.pdf`, pdf, "application/pdf");
        }

        return <section className="admin-reports">
            <div className="admin-panel admin-report-toolbar">
                <div><h2>Booking and revenue reports</h2><p>Reports are calculated from the current admin records.</p></div>
                <div className="admin-report-actions"><button className="admin-secondary-button" type="button" onClick={exportExcel}><FiDownload /> Export Excel</button><button className="admin-primary-button" type="button" onClick={exportPdf}><FiFileText /> Download PDF</button></div>
            </div>
            <div className="admin-panel admin-report-filters">
                <label>From<input type="date" value={reportStart} max={reportEnd || undefined} onChange={(event) => setReportStart(event.target.value)} /></label>
                <label>To<input type="date" value={reportEnd} min={reportStart || undefined} onChange={(event) => setReportEnd(event.target.value)} /></label>
                <span>{report.bookings.length} bookings in selected period</span>
            </div>
            <div className="admin-report-stats">
                <article><span>Bookings</span><strong>{loading ? "—" : report.bookings.length}</strong></article>
                <article><span>Paid revenue</span><strong>{loading ? "—" : formatCurrency(report.paidRevenue)}</strong></article>
                <article><span>Successful payments</span><strong>{loading ? "—" : report.bookings.filter((booking) => booking.payment_status === "success").length}</strong></article>
                <article><span>Hotels / users</span><strong>{loading ? "—" : `${hotels.length} / ${users.length}`}</strong></article>
            </div>
            <div className="admin-report-charts">
                <section className="admin-panel admin-report-chart">
                    <div className="admin-section-heading"><div><h2>Bookings by status</h2><p>Distribution for the selected period.</p></div><FiBarChart2 /></div>
                    <div className="admin-status-chart">{report.statuses.map((item) => <div className="admin-status-chart-row" key={item.label}>
                        <span>{item.label}</span><div className="admin-chart-track"><i className={`admin-chart-bar admin-chart-${item.label}`} style={{ width: `${item.count / maxStatus * 100}%` }} /></div><strong>{item.count}</strong>
                    </div>)}</div>
                </section>
                <section className="admin-panel admin-report-chart">
                    <div className="admin-section-heading"><div><h2>Paid revenue by month</h2><p>Only successful payments are counted.</p></div><FiCreditCard /></div>
                    <div className="admin-month-chart">{report.monthly.map((item) => <div className="admin-month-chart-item" key={item.key} title={`${item.bookings} bookings`}>
                        <strong>{formatCurrency(item.revenue)}</strong><div className="admin-month-bar-track"><i style={{ height: `${Math.max(3, item.revenue / maxRevenue * 100)}%` }} /></div><span>{item.label}</span>
                    </div>)}</div>
                    {!report.monthly.length && <p className="admin-empty">Choose a valid date range to show the monthly chart.</p>}
                </section>
            </div>
            <section className="admin-panel admin-report-table-panel">
                <div className="admin-section-heading"><div><h2>Report booking records</h2><p>Booking and payment status for the selected period.</p></div><span>{report.bookings.length} records</span></div>
                <div className="admin-table-wrap"><table className="admin-table">
                    <thead><tr><th>Date</th><th>Guest</th><th>Hotel</th><th>Amount</th><th>Booking status</th><th>Payment</th></tr></thead>
                    <tbody>{report.bookings.slice(0, 25).map((booking) => <tr key={booking._id}>
                        <td>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "—"}</td><td>{fullName(booking.user_id)}</td><td>{booking.hotel_id?.name || "Hotel unavailable"}</td><td>{formatCurrency(booking.final_amount)}</td>
                        <td><span className={`admin-status admin-status-${booking.status}`}>{booking.status}</span></td><td><span className={`admin-payment-status admin-payment-status-${booking.payment_status}`}>{booking.payment_status || "pending"}</span></td>
                    </tr>)}</tbody>
                </table>{!report.bookings.length && <p className="admin-empty">No bookings in this date range.</p>}{report.bookings.length > 25 && <p className="admin-report-limit">Showing the latest 25 here. Exports include all {report.bookings.length} matching records.</p>}</div>
            </section>
        </section>;
    }

    const activeItem = navItems.find((item) => item.id === activeSection) || navItems[0];
    const ActiveIcon = activeItem.icon;
    const sectionContent = {
        overview: renderOverview,
        users: renderUsers,
        hotels: renderHotels,
        bookings: renderBookings,
        reports: renderReports,
        chatbot: renderChatbot,
        payments: renderPayments
    }[activeSection];

    return (
        <main className="admin-shell">
            {sidebarOpen && <button className="admin-sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
            <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`}>
                <div className="admin-sidebar-brand"><span className="admin-brand-mark">R</span><div><strong>Roomify</strong><small>ADMIN PANEL</small></div><button className="admin-sidebar-close" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><FiX /></button></div>
                <p className="admin-nav-label">WORKSPACE</p>
                <nav className="admin-side-nav" aria-label="Admin dashboard sections">
                    {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeSection === id ? "admin-nav-item admin-nav-item-active" : "admin-nav-item"} onClick={() => selectSection(id)}>
                        {createElement(Icon)}<span>{label}</span>{id === "chatbot" && knowledge.filter((entry) => entry.published).length > 0 && <small>{knowledge.filter((entry) => entry.published).length}</small>}
                    </button>)}
                </nav>
                <div className="admin-sidebar-bottom"><div className="admin-profile"><span className="admin-profile-avatar">{(user?.name || "A").trim().charAt(0).toUpperCase()}</span><div><strong>{user?.name || "Administrator"}</strong><small>Administrator</small></div></div>
                    <button className="admin-logout-button" onClick={handleLogout}><FiLogOut /><span>Sign out</span></button>
                </div>
            </aside>

            <section className="admin-workspace">
                <header className="admin-topbar"><button className="admin-mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><FiMenu /></button>
                    <div className="admin-breadcrumb"><span>Admin</span><b>/</b><strong><ActiveIcon />{activeItem.label}</strong></div>
                    <div className="admin-topbar-actions">{["users", "hotels", "bookings"].includes(activeSection) && <label className="admin-search"><span>⌕</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Search ${activeSection}…`} /></label>}
                        <button className="admin-icon-action" aria-label="Refresh dashboard" onClick={loadDashboard} disabled={loading}><FiRefreshCw className={loading ? "admin-spin" : ""} /></button>
                    </div>
                </header>
                <div className="admin-content"><div className="admin-page-heading"><div><p className="admin-eyebrow">ROOMIFY CONTROL PANEL</p><h1>{activeItem.label}</h1><p>{activeSection === "overview" ? "A clear view of your hotel booking platform." : `Manage ${activeItem.label.toLowerCase()} across the platform.`}</p></div>
                    <span className="admin-date-label">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                    {error && <div className="admin-message admin-error" role="alert">{error}</div>}{notice && <div className="admin-message admin-success" role="status">{notice}</div>}
                    {sectionContent()}
                </div>
            </section>
        </main>
    );
}

export default AdminDashboard;
