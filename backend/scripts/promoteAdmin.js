require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function promoteAdmin() {
    const email = process.argv[2]?.trim().toLowerCase();
    if (!email) {
        console.error("Usage: npm run admin:promote -- user@example.com");
        process.exitCode = 1;
        return;
    }
    if (!process.env.MONGODB_URL) {
        console.error("MONGODB_URL is missing from backend/.env");
        process.exitCode = 1;
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URL);
        const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
        if (!user) {
            console.error(`No account found for ${email}. Register that account first, then rerun this command.`);
            process.exitCode = 1;
            return;
        }
        console.log(`Admin access enabled for ${user.email}. Log in with that account to open /admin.`);
    } catch (err) {
        console.error("Unable to promote account:", err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

promoteAdmin();
