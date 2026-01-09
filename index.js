import express from "express";
import cors from "cors";


import { compactCode, uncompactCode } from "./services/minifier.js";
import { detectCodeLanguage, getBestLanguageString } from "./services/language_detector.js";
import { formatCode } from "./services/formatter.js";


/**
 * Commit V.3.0.0 - 2026-01-09
 * 
 * ------------------------------
 *  CodeTools Microservice
 * ------------------------------
 * Features:
 *  - Detect, compress, decompress & format code. All in just one api.
 *  - Secured with HMAC authentication middleware [Added on this commit]
 * 
 * 
 */
import { verifyInternalKey } from "./shared/apiKeyMiddleware.js";
import { Readable } from 'stream';

const app = express();

app.use((req, res, next) => {
  let data = [];
  req.on('data', chunk => data.push(chunk));
  req.on('end', () => {
    const buffer = Buffer.concat(data);
    req.rawBody = buffer;

    if (req.headers['content-length'] > 0 || req.headers['transfer-encoding']) {
      const readable = new Readable();
      readable._read = () => {}; 
      readable.push(buffer);
      readable.push(null);
      
      Object.assign(readable, {
        headers: req.headers,
        method: req.method,
        url: req.url,
        rawBody: buffer
      });
      
      req.on = readable.on.bind(readable);
      req.once = readable.once.bind(readable);
      req.emit = readable.emit.bind(readable);
      req.resume = readable.resume.bind(readable);
      req.pause = readable.pause.bind(readable);
      req.pipe = readable.pipe.bind(readable);
      req.unpipe = readable.unpipe.bind(readable);
    }
    next();
  });
});

app.use(cors());
app.use(express.json({ limit: "5mb" }));


// ============================================
// PROTECTED ROUTES (VERIFIED BY GATEWAY'S INTERNAL KEY)
// ============================================

app.post(
  "/detect",
  verifyInternalKey, // Checks for X-Internal-Auth from the Gateway
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text provided" });
      }

      // Keep application-specific content limits here (e.g., max text length)
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
  verifyInternalKey, // Checks for X-Internal-Auth from the Gateway
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
  verifyInternalKey, // Checks for X-Internal-Auth from the Gateway
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
  verifyInternalKey, // Checks for X-Internal-Auth from the Gateway
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