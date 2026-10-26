const KnowledgeEntry = require("../models/KnowledgeEntry");

function parseKeywords(value) {
    if (Array.isArray(value)) return value.map((word) => String(word).trim()).filter(Boolean).slice(0, 20);
    return String(value || "").split(",").map((word) => word.trim()).filter(Boolean).slice(0, 20);
}

function entryFields(body) {
    return {
        title: String(body.title || "").trim(),
        question: String(body.question || "").trim(),
        answer: String(body.answer || "").trim(),
        keywords: parseKeywords(body.keywords),
        published: body.published === true || body.published === "true"
    };
}

function isValid(entry) {
    return entry.title && entry.question && entry.answer &&
        entry.title.length <= 120 && entry.question.length <= 300 && entry.answer.length <= 2000;
}

async function listKnowledge(req, res) {
    try {
        const entries = await KnowledgeEntry.find().sort({ updatedAt: -1 }).lean();
        res.status(200).send({ success: true, data: entries });
    } catch (err) {
        console.error("Unable to list chatbot knowledge", err);
        res.status(500).send({ success: false, message: "Unable to load chatbot answers" });
    }
}

async function createKnowledge(req, res) {
    try {
        const fields = entryFields(req.body || {});
        if (!isValid(fields)) {
            return res.status(400).send({ success: false, message: "Title, sample question, and answer are required." });
        }
        const entry = await KnowledgeEntry.create(fields);
        res.status(201).send({ success: true, data: entry });
    } catch (err) {
        console.error("Unable to create chatbot answer", err);
        res.status(500).send({ success: false, message: "Unable to save chatbot answer" });
    }
}

async function updateKnowledge(req, res) {
    try {
        const fields = entryFields(req.body || {});
        if (!isValid(fields)) {
            return res.status(400).send({ success: false, message: "Title, sample question, and answer are required." });
        }
        const entry = await KnowledgeEntry.findByIdAndUpdate(req.params.id, fields, {
            new: true,
            runValidators: true
        }).lean();
        if (!entry) return res.status(404).send({ success: false, message: "Answer not found" });
        res.status(200).send({ success: true, data: entry });
    } catch (err) {
        console.error("Unable to update chatbot answer", err);
        res.status(500).send({ success: false, message: "Unable to update chatbot answer" });
    }
}

async function deleteKnowledge(req, res) {
    try {
        const entry = await KnowledgeEntry.findByIdAndDelete(req.params.id);
        if (!entry) return res.status(404).send({ success: false, message: "Answer not found" });
        res.status(200).send({ success: true, message: "Answer deleted" });
    } catch (err) {
        console.error("Unable to delete chatbot answer", err);
        res.status(500).send({ success: false, message: "Unable to delete chatbot answer" });
    }
}

module.exports = { listKnowledge, createKnowledge, updateKnowledge, deleteKnowledge };
