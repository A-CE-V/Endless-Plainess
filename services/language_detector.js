import pkg from '@vscode/vscode-languagedetection';
import hljs from "highlight.js";

const { ModelOperations } = pkg;
let vscodeDetector = null;

try {
  vscodeDetector = new ModelOperations();
  console.log("VSCode Language Detector initialized");
} catch (err) {
  console.error("Failed to initialize VSCode detector:", err);
}


async function detectCodeLanguage(text) {
  if (!text || text.trim().length < 3) return null;

  const results = [];

  if (vscodeDetector) {
    try {
    const vscode = await vscodeDetector.runModel(text);
      if (vscode?.length > 0) {
        const top = vscode[0];
        results.push({
          engine: "vscode",
          language: top.languageId,
          confidence: top.confidence,
        });
      }
    } catch (e) {
      console.warn("VSCode detection error:", e.message);
    }
  }

  try {
    const hl = hljs.highlightAuto(text);
    if (hl.language) {
      results.push({
        engine: "highlight.js",
        language: hl.language.toLowerCase(),
        confidence: Math.min(1, hl.relevance / 100),
      });
    }
  } catch (e) {
    console.warn("highlight.js error:", e.message);
  }

  if (results.length === 0) return null;

  results.sort((a, b) => b.confidence - a.confidence);

  return {
    best: results[0].language,
    candidates: results,
  };
}


async function getBestLanguageString(text) {
    const detection = await detectCodeLanguage(text);
    return detection ? detection.best : null;
}

export { detectCodeLanguage, getBestLanguageString };