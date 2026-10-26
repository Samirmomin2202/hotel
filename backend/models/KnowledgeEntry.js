const mongoose = require("mongoose");

const knowledgeEntrySchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 120 },
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, trim: true, maxlength: 2000 },
    keywords: [{ type: String, trim: true, maxlength: 40 }],
    published: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("KnowledgeEntry", knowledgeEntrySchema);
