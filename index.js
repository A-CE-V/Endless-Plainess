import express from "express";
import cors from "cors";

import { verifyApiKey, verifyInternalKey } from "./shared/apiKeyMiddleware.js";
import { enforceLimit } from "./shared/rateLimit.js";

import { compactCode, uncompactCode } from "./services/minifier.js";
import { detectCodeLanguage, getBestLanguageString } from "./services/language_detector.js";
import { formatCode } from "./services/formatter.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors());

// ============================================
// PROTECTED ROUTES (API KEY + CODE LIMIT)
// ============================================

app.post(
  "/detect",
  verifyInternalKey,
  (req, res, next) => enforceLimit(req, res, next, "code"),
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text provided" });
      }

      if (text.length > 20000) {
        return res.status(413).json({
          error: "Text too long",
          maxChars: 20000,
        });
      }

      const detection = await detectCodeLanguage(text);

      if (!detection) {
        return res.json({
          language: "unknown",
          possible: [],
          engines: [],
        });
      }

      res.json({
        language: detection.best,
        possible: detection.candidates.map((c) => c.language),
        engines: detection.candidates,
      });
    } catch (err) {
      console.error("Detection error:", err);
      res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }
);

app.post(
  "/compact",
  verifyApiKey,
  (req, res, next) => enforceLimit(req, res, next, "code"),
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Missing required 'text' field" });
      }

      const language = await getBestLanguageString(text);
      const compactedText = await compactCode(text, language);

      res.json({
        language: language || "unknown",
        originalLength: text.length,
        compactedLength: compactedText.length,
        compactedText,
      });
    } catch (err) {
      console.error("Compaction error:", err);
      res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }
);

app.post("/uncompact",
  verifyApiKey,
  (req, res, next) => enforceLimit(req, res, next, "code"),
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Missing required 'text' field" });
      }

      const language = await getBestLanguageString(text);
      const uncompactedText = uncompactCode(text);
      const formattedText = await formatCode(uncompactedText, language);

      res.json({
        language: language || "unknown",
        originalLength: text.length,
        formattedLength: formattedText.length,
        formattedText: formattedText,
      });
    } catch (err) {
      console.error("Uncompaction error:", err);
      res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }
);


app.post(
  "/format",
  verifyApiKey,
  (req, res, next) => enforceLimit(req, res, next, "code"),
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Missing required 'text' field" });
      }

      const language = await getBestLanguageString(text);
      const formattedText = await formatCode(text, language);

      const wasFormatted = formattedText !== text;

      res.json({
        language: language || "unknown",
        originalLength: text.length,
        formattedLength: formattedText.length,
        formattedText,
        success: wasFormatted,
        message: wasFormatted
          ? "Code formatted successfully."
          : "Language unsupported for robust formatting, returning original text.",
      });
    } catch (err) {
      console.error("Formatting error:", err);
      res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }
);

app.get("/health", (req, res) => {
  res.json({ status: "OK", uptime: process.uptime() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Code Toolbox API running on port ${PORT}`)
);
