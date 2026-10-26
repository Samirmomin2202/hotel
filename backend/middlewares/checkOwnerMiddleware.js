// function to check that current login user is hotel owner or not.
function checkOwnerMiddleware(req, res, next) {
    try {
        const userData = req.user;
        if (!(userData.role == "hotel-manager")) {
            return res.status(403).send({ success: false, message: "Hotel manager access required" });
        }
        next()
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
}
module.exports = checkOwnerMiddleware;
