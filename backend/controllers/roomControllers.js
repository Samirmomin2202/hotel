const Room = require("../models/Room");
async function addRoom(req, res) {
    try {
        const data = req.body;
        const image = req.file.filename;
        if(typeof data.bed_type == "string"){
            data.bed_type = JSON.parse(data.bed_type)
        }
        const newRoom = new Room({ ...data, image: image });
        await newRoom.save();
        res.status(201).send({ success: true, message: "Room Added Successfully" });
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: "Internal Server Error" })
    }
}

async function updateRoom(req, res) {
    try {
        const roomId = req.params.id;
        const data = req.body;
        const newFile = req.file?.filename;
        const existingFile = req.body?.existingFile;
        const image = newFile || existingFile;
        if(typeof data.bed_type == "string"){
            data.bed_type = JSON.parse(data.bed_type)
        }
        await Room.findByIdAndUpdate(roomId, { ...data, image: image })
        res.status(200).send({ success: true, message: "Room Updated Successfully" });
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: "Internal Server Error" })
    }
}

async function deleteRoom(req, res) {
    try {
        const roomId = req.params.id;
        await Room.findByIdAndDelete(roomId);
        res.status(200).send({ success: true, message: "Room Deleted Successfully" });
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: "Internal Server Error" })
    }
}

async function getAllRooms(req, res) {
    try {
        const hotelId = req.params.hotelId;
        const allRooms = await Room.find({ hotel_id: hotelId });
        res.status(200).send({ success: true, message: "Success", data: allRooms });
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: "Internal Server Error" })
    }
}

module.exports = { addRoom, updateRoom, deleteRoom, getAllRooms };