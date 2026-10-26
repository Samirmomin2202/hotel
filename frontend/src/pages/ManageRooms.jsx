import "./ManageRooms.css";
import { LuUsers } from "react-icons/lu";
import { FaBed, FaEdit } from "react-icons/fa";
import { FaRegMap } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { useState } from "react";
import { useEffect } from "react";
import api from "../api/api"
import { resolveImageUrl } from "../utils/imageUrl";
import { UserDataContext } from "../context/UserContext"
import { useContext } from "react";
function ManageRooms() {
    const [isPopUpOpen, setIsPopUpOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [existingFile, setExistingFile] = useState("");
    const [roomsData, setRoomsData] = useState([]);
    const [data, setData] = useState({
        name: "",
        description: "",
        base_price: "",
        total_rooms: "",
        capacity: "",
        size_sqft: "",
        bed_type: { King: "", Queen: "", Twin: "" },
        image: ""
    })
    const { user } = useContext(UserDataContext);
    async function getData() {
        const res = await api.get(`/room/${user.hotel}`);
        setRoomsData(res.data?.data);
    }

    function handleChange(e) {
        const label = e.target.name;
        let value;
        if (label == "image") {
            value = e.target.files[0];
        }
        else {
            value = e.target.value;
        }
        setData({ ...data, [label]: value });
    }

    useEffect(() => {
        getData();
    }, [])

    async function handleSubmit() {
        try {
            const formData = new FormData();
            for (let i in data) {
                if (i == "bed_type") {
                    formData.append(i, JSON.stringify(data[i]));
                }
                else {
                    formData.append(i, data[i]);
                }
            }
            if (!isEditMode) {
                formData.append("hotel_id", user.hotel);
            }
            if (isEditMode) {
                formData.append("existingFile", existingFile);
                const res = await api.put(`/room/${data._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                if (res.status == 200) {
                    alert("Room Updated Successfully");
                }
            }
            else {
                const res = await api.post("/room", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                if (res.status == 201) {
                    alert("Room Added Successfully");
                }
            }
        }
        catch (err) {
            alert(err?.response?.data?.message || "Internal Server Error");
            console.log(err);
        }
    }
    function getBedNames(bed_types) {
        let ans = "";
        let arr = Object.entries(bed_types);
        for (let i of arr) {
            if (i[1] > 0) {
                ans += `${i[1]} ${i[0]} Bed + `
            }
        }
        ans = ans.substring(0, ans.length - 2);
        return ans;
    }

    async function handleDeleteRoom(room){
        const id = room._id;
        try{
            const res = await api.delete(`/room/${id}`);
            if (res.status == 200) {
                    alert("Room Deleted Successfully");
                }
        }
        catch (err) {
            alert(err?.response?.data?.message || "Internal Server Error");
            console.log(err);
        }
    }
    return (
        <>
            {isPopUpOpen && <div className="add-room-pop-up">
                <div className="add-room-pop-up-container">
                    <div className="add-room-pop-up-header">
                        <h2>{isEditMode ? "Edit Room" : "Add Room"}</h2>
                        <span className="close-pop-up">
                            <RxCross2 onClick={() => setIsPopUpOpen(false)} />
                        </span>
                    </div>

                    <form className="add-room-form-grid">
                        <div className="add-room-form-columns">
                            <label htmlFor="name">Hotel Name</label>
                            <input type="text" id="name" name="name" value={data.name} onChange={handleChange} />
                        </div>
                        <div className="add-room-form-columns">
                            <label htmlFor="price">Base Price</label>
                            <input type="number" id="price" value={data.base_price} name="base_price" onChange={handleChange} />
                        </div>
                        <div className="add-room-form-columns">
                            <label htmlFor="total_rooms">Total Rooms</label>
                            <input type="number" value={data.total_rooms} id="total_rooms" name="total_rooms" onChange={handleChange} />
                        </div>
                        <div className="add-room-form-columns">
                            <label htmlFor="capacity">Capacity</label>
                            <input type="number" value={data.capacity} name="capacity" id="capacity" onChange={handleChange} />
                        </div>
                        <div className="add-room-form-columns">
                            <label htmlFor="size_sqft">Size (in sqfeet)</label>
                            <input type="number" value={data.size_sqft} name="size_sqft" id="size_sqft" onChange={handleChange} />
                        </div>
                        <div className="add-room-form-columns">
                            <label htmlFor="description">Description</label>
                            <textarea value={data.description} name="description" id="description" onChange={handleChange}></textarea>
                        </div>
                        <div className="add-room-bed">
                            <label htmlFor="">Beds Configuration</label>
                            <div className="add-room-form-columns">
                                <label htmlFor="king_bed">King Beds</label>
                                <input type="number" value={data.bed_type.King} id="king_bed" onChange={(e) => {
                                    setData({ ...data, bed_type: { ...data.bed_type, King: e.target.value } })
                                }} />
                            </div>
                            <div className="add-room-form-columns">
                                <label htmlFor="queen_bed">Queen Beds</label>
                                <input type="number" onChange={(e) => {
                                    setData({ ...data, bed_type: { ...data.bed_type, Queen: e.target.value } })
                                }} id="queen_bed" value={data.bed_type.Queen} />
                            </div>
                            <div className="add-room-form-columns">
                                <label htmlFor="twin_bed">Twin Beds</label>
                                <input type="number" onChange={(e) => {
                                    setData({ ...data, bed_type: { ...data.bed_type, Twin: e.target.value } })
                                }} value={data.bed_type.Twin} id="twin_bed" />
                            </div>
                        </div>
                        <div className="add-room-form-columns">
                            <label htmlFor="image">Image</label>
                            <input type="file" onChange={(e) => {
                                setExistingFile("");
                                handleChange(e)
                            }} name="image" id="image" />
                        </div>
                    </form>

                    <div className="add-room-pop-up-footer">
                        <button onClick={handleSubmit}>Submit</button>
                        <button onClick={() => setIsPopUpOpen(false)}>Cancel</button>
                    </div>
                </div>
            </div>}

            <section className="manage-rooms">
                <div className="manage-rooms-header">
                    <h1>Manage Rooms</h1>
                    <div className="add-room-btn">
                        <button onClick={() => {
                            setIsEditMode(false)
                            setIsPopUpOpen(true)
                        }}>Add Room</button>
                    </div>
                </div>

                <div className="manage-rooms-rooms-grid">
                    {
                        roomsData.map((roomData, index) => {
                            return <div className="room-card" key={index}>
                                <div className="room-image">
                                    <img src={resolveImageUrl(roomData.image)} alt={roomData.name || "Room"} />
                                </div>
                                <div className="room-details">
                                    <div className="room-header">
                                        <h3>{roomData?.name}</h3>
                                        <div className="room-info">
                                            <div>
                                                <span><LuUsers /></span>
                                                <span>{roomData.capacity} Adults</span>
                                            </div>
                                            <div>
                                                <span><FaBed /></span>
                                                <span>
                                                    {
                                                        getBedNames(roomData.bed_type)
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <span><FaRegMap /></span>
                                                <span>{roomData.size_sqft} sq feet</span>
                                            </div>
                                        </div>
                                        <div className="room-description">
                                            {roomData.description}
                                        </div>
                                    </div>
                                    <div className="room-footer">
                                        <div className="room-price"><span>₹{roomData.base_price}</span>
                                            <span>/ night</span>
                                        </div>
                                        <div className="manage-room-book-btn">
                                            <FaEdit className="edit-room-btn" onClick={() => {
                                                setData({ ...roomData, image: "" });
                                                setExistingFile(roomData.image);
                                                setIsEditMode(true)
                                                setIsPopUpOpen(true)
                                            }} />
                                            <MdDelete className="delete-room-btn" onClick={()=>handleDeleteRoom(roomData)}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        })
                    }
                </div>
            </section>
        </>
    )
}

export default ManageRooms;
