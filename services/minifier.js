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


  let formatted = code
    .replace(/;/g, ';\n') // Add newline after semicolon
    .replace(/\{/g, ' {\n') // Add space and newline before opening brace
    .replace(/\}/g, '}\n') // Add newline after closing brace
    .replace(/\)\{/g, ') {\n') // Handle function/condition block start
    .replace(/([a-zA-Z0-9])\{/g, '$1 {\n') // Handle identifiers before opening brace
    .replace(/\n\s*\n/g, '\n'); // Collapse multiple newlines


  formatted.split('\n').forEach(line => {
    line = line.trim();
    if (!line) return; 

    const openingBraceCount = (line.match(/\{/g) || []).length;
    const closingBraceCount = (line.match(/\}/g) || []).length;
    
    if (line.startsWith('}') || line.startsWith(']')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const indentation = '    '.repeat(indentLevel);

    indentedCode += indentation + line + '\n';
    
    if (openingBraceCount > closingBraceCount) {
      indentLevel++;
    }
  });

  return indentedCode.trim();
}

// ... (all functions) ...

export { compactCode, uncompactCode };