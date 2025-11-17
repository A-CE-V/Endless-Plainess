import { minify as minifyJs } from 'terser';
import CleanCSS from 'clean-css';

const cssMinifier = new CleanCSS({});


async function compactCode(code, language) {
  // --- ROBUST WEB LANGUAGE MINIFICATION (Terser, CleanCSS) ---
  
  // JavaScript, TypeScript, JSON
  if (['javascript', 'js', 'json', 'typescript', 'ts'].includes(language)) {
    try {
      const result = await minifyJs(code);
      return result.code || code; 
    } catch (e) {
      console.error("Terser minification error:", e);
    }
  }

  // CSS
  if (language === 'css') {
    try {
      const result = cssMinifier.minify(code);
      return result.styles || code;
    } catch (e) {
      console.error("CleanCSS minification error:", e);
    }
  }
  
  
  // Java, Kotlin, C#, C, C++, etc. all share C-style syntax.
  const cStyleLanguages = ['java', 'kotlin', 'csharp', 'c', 'cpp', 'rust', 'go', 'php'];

  if (cStyleLanguages.includes(language) || language === null) {
      let compacted = code
          // 1. Remove C-style (/**/) and C++ style (//) comments safely
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') 
          // 2. Replace all newlines with a single space
          .replace(/(\r\n|\n|\r)/gm, ' ') 
          // 3. Collapse multiple spaces into one
          .replace(/\s+/g, ' ') 
          .trim();

      return compacted;
  }
  
  // FINAL FALLBACK for truly unknown/unhandled languages
  return code.replace(/(\r\n|\n|\r|\s+)/gm, ' ').trim();
}


function uncompactCode(code) {
  let indentLevel = 0;
  let indentedCode = "";
  let i = 0;
  const n = code.length;
  let currentLine = "";
  let inString = false;
  let stringChar = '';
  let inTemplate = false;
  let escapeNext = false;

  while (i < n) {
    const char = code[i];

    // Handle escaping in strings
    if (escapeNext) {
      currentLine += char;
      escapeNext = false;
      i++;
      continue;
    }

    if (inString) {
      currentLine += char;
      if (char === '\\') {
        escapeNext = true;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      } else if (char === '`') {
        inTemplate = !inTemplate;
      }
      i++;
      continue;
    } else if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      currentLine += char;
      i++;
      continue;
    }

    // Handle braces
    if (char === '{' || char === '[') {
      if (currentLine.trim()) {
        indentedCode += '    '.repeat(indentLevel) + currentLine.trim() + '\n';
      }
      indentedCode += '    '.repeat(indentLevel) + char + '\n';
      indentLevel++;
      currentLine = '';
    } else if (char === '}' || char === ']') {
      if (currentLine.trim()) {
        indentedCode += '    '.repeat(indentLevel) + currentLine.trim() + '\n';
      }
      indentLevel = Math.max(0, indentLevel - 1);
      indentedCode += '    '.repeat(indentLevel) + char + '\n';
      currentLine = '';
    } else if (char === ';') {
      currentLine += char;
      indentedCode += '    '.repeat(indentLevel) + currentLine.trim() + '\n';
      currentLine = '';
    } else {
      currentLine += char;
    }

    i++;
  }

  if (currentLine.trim()) {
    indentedCode += '    '.repeat(indentLevel) + currentLine.trim() + '\n';
  }

  return indentedCode.trim();
}



export { compactCode, uncompactCode };