import { useContext, useEffect, useState } from "react";
import "./UpdateHotelDetails.css";
import api from "../api/api";
import { UserDataContext } from "../context/UserContext"
import { resolveImageUrl } from "../utils/imageUrl";

function UpdateHotelDetails() {
    const { user } = useContext(UserDataContext)
    const [images, setImages] = useState([]);
    const [existingImages,setExistingImages] = useState([]);
    const [data, setData] = useState({
        name: "",
        description: "",
        address: "",
        city: "",
        state: "",
        country: "",
        category: "",
        star_rating: "",
        images: [],
        contact_email: "",
        contact_phone: "",
        check_in_time: "",
        check_out_time: "",
        price: "",
        policies: { cancellation: "", pets: false },
    });
    function handleChange(e) {
        const label = e.target.name;
        let value;
        if (label == "profile_picture_url") {
            value = e.target.files[0];
        }
        else {
            value = e.target.value;
        }
        setData({ ...data, [label]: value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const formData = new FormData();
            for (let i in data) {
                if (i == "policies") {
                    formData.append(i, JSON.stringify(data[i]));
                }
                else if (i == "images") {
                    for (let image of images) {
                        formData.append("images", image);
                    }
                }
                else {
                    formData.append(i, data[i]);
                }
            }
            for(let i of existingImages){
                formData.append("existingImages",i);
            }
            const res = await api.put(`/hotels/hotel/${data._id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.status == 201) {
                alert("Hotel Updated Successfully");
            }
        }
        catch (err) {
            alert(err?.response?.data?.message || "Internal Server Error");
            console.log(err);
        }
    }

    function handleImageChange(e) {
        let currImages = e.target.files;
        const temp = [...images, ...currImages];
        setImages(temp);
        setData({ ...data, images: temp })
    }

    function handleRemoveImage(index) {
        const updatedImages = images.filter((_, ix) => ix != index);
        setImages(updatedImages)
        setData({ ...data, images: updatedImages })
    }

    function handleRemoveExistingImage(index){
        setExistingImages(existingImages.filter((_, ix) => ix != index));
    }

    async function getData() {
        const res = await api.get(`/hotels/user/${user.id}`)
        setData(res.data.data);
        setExistingImages(res?.data?.data?.images);
    }

    useEffect(() => {
        getData();
    }, [])

    return (
        <div className="update-hotel-form-container">
            <form className="update-hotel-form" onSubmit={handleSubmit}>
                <h1>Update Your Hotel</h1>
                <div className="update-hotel-form-section">
                    <h2>Basic Details</h2>
                    <div className="update-hotel-column">
                        <label htmlFor="name">Hotel Name</label>
                        <input type="text" id="name" name="name" value={data.name} onChange={handleChange} />
                    </div>
                    <div className="update-hotel-column">
                        <label htmlFor="category">Hotel Category</label>
                        <select name="category" value={data.category} onChange={handleChange} id="category">
                            <option value="" hidden>Select Hotel Category</option>
                            <option value="resort">Resort</option>
                            <option value="luxury">Luxury</option>
                            <option value="cottage">Cottage</option>
                            <option value="5-star">5-star</option>
                            <option value="budget">Budget</option>
                        </select>
                    </div>
                    <div className="update-hotel-column">
                        <label htmlFor="price">Hotel Average Price</label>
                        <input type="number" name="price" value={data.price} onChange={handleChange} id="price" />
                    </div>
                    <div className="update-hotel-column">
                        <label htmlFor="description">Hotel Description</label>
                        <textarea value={data.description} name="description" id="description" onChange={handleChange}></textarea>
                    </div>
                </div>
                <div className="update-hotel-form-section">
                    <h2>Location Details</h2>
                    <div className="update-hotel-column">
                        <label htmlFor="city">City</label>
                        <input type="text" value={data.city} name="city" onChange={handleChange} id="city" />
                    </div>
                    <div className="update-hotel-column">
                        <label htmlFor="state">State</label>
                        <input type="text" value={data.state} name="state" onChange={handleChange} />
                    </div>
                    <div className="update-hotel-column">
                        <label htmlFor="country">Country</label>
                        <input type="text" name="country" value={data.country} onChange={handleChange} id="country" />
                    </div>
                    <div className="update-hotel-column">
                        <label htmlFor="address">Full Address</label>
                        <textarea name="address" value={data.address} onChange={handleChange} id="address"></textarea>
                    </div>
                </div>
                <div className="update-hotel-form-section">
                    <h2>Hotel Facts</h2>
                    <div className="update-hotel-column">
                        <label htmlFor="check_in_time">Check-In Time</label>
                        <input type="time" value={data.check_in_time} name="check_in_time" onChange={handleChange} id="check_in_time" />
                    </div>
                    <div className="update-hotel-column">
                        <label htmlFor="check_out_time">Check-Out Time</label>
                        <input type="time" value={data.check_out_time} name="check_out_time" id="check_out_time" onChange={handleChange} />
                    </div>
                    <div className="update-hotel-column">
                        <label htmlFor="contact_email">Contact Email</label>
                        <input type="email" value={data.contact_email} name="contact_email" id="contact_email" onChange={handleChange} />
                    </div>
                    <div className="update-hotel-column">
                        <label htmlFor="contact_phone">Contact Phone</label>
                        <input type="number" value={data.contact_phone} name="contact_phone" id="contact_phone" onChange={handleChange} />
                    </div>
                </div>
                <div className="update-hotel-form-section">
                    <h2>Policies</h2>
                    <div className="update-hotel-column">
                        <label htmlFor="cancellation">Cancellation Policy</label>
                        <textarea value={data.policies.cancellation} onChange={(e) => {
                            setData({ ...data, policies: { ...data.policies, cancellation: e.target.value } })
                        }} id="cancellation"></textarea>
                    </div>
                    <div className="update-hotel-pet-section">
                        <input type="checkbox" onChange={(e) => {
                            setData({ ...data, policies: { ...data.policies, pets: e.target.value } })
                        }} id="pets-allowed" value={data.policies.pets} />
                        <label htmlFor="pets-allowed">Pets Allowed</label>
                    </div>
                </div>
                <div className="update-hotel-form-section">
                    <h2>Hotel Images</h2>
                    <div className="update-hotel-column">
                        <input type="file" multiple onChange={(e) => handleImageChange(e)} />
                        <div className="images-preview">
                            {
                                existingImages.map((image,index)=>{
                                   return <div className="image-preview-container" key={index}>
                                        <img src={resolveImageUrl(image)} alt={`${data.name || "Hotel"} image ${index + 1}`} />
                                        <div className="cross-image" onClick={() => handleRemoveExistingImage(index)}>X</div>
                                    </div> 
                                })
                            }
                            {
                                images.map((image, index) => {
                                    return <div className="image-preview-container" key={index}>
                                        <img src={URL.createObjectURL(image)} alt="" />
                                        <div className="cross-image" onClick={() => handleRemoveImage(index)}>X</div>
                                    </div>
                                })
                            }
                        </div>
                    </div>
                </div>
                <div className="update-hotel-submit-form">
                    <button>Submit</button>
                </div>
            </form>
        </div>
    )
}

export default UpdateHotelDetails
