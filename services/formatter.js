import prettier from "prettier";
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import * as pluginPHP from '@prettier/plugin-php';
import * as pluginJava from 'prettier-plugin-java'; 
import * as pluginKotlin from 'prettier-plugin-kotlin';
import * as pluginSh from 'prettier-plugin-sh';

const execPromise = promisify(exec);


// ------------------------------------------------------
// 1. LANGUAGE ID TO PRETTIER PARSER MAPPING
// ------------------------------------------------------

function getPrettierParser(languageId) {
    if (!languageId) return null;

    languageId = languageId.toLowerCase();

    switch (languageId) {
        case 'js':
        case 'javascript':
        case 'json':
            return 'babel'; 
        case 'ts':
        case 'typescript':
            return 'typescript';
        case 'css':
        case 'scss':
        case 'less':
            return 'css';
        case 'html':
            return 'html';
        case 'php':
            return 'php';
        case 'java':
            return 'java';
        case 'kotlin':
        case 'kt':
            return 'kotlin';
        case 'sh':
        case 'bash':
            return 'shell-script';
            
        default:
            return null;
    }
}

// ------------------------------------------------------
// 2. CORE FORMATTING FUNCTION
// ------------------------------------------------------

async function formatCode(code, languageId) {
    languageId = languageId ? languageId.toLowerCase() : null;

   if (languageId === 'python' || languageId === 'py') {
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.py`);

        try {
            await fs.writeFile(tempFilePath, code, 'utf8');

            await execPromise(`black --quiet ${tempFilePath}`);
            
            const formattedCode = await fs.readFile(tempFilePath, 'utf8');

            return formattedCode;

        } catch (error) {
            console.error("Black formatting error:", error.stderr || error.message);

            return code; 
        } finally {

            try {
                await fs.unlink(tempFilePath);
            } catch(e) {
                console.warn(`Failed to clean up temp file: ${tempFilePath}`, e.message);
            }
        }
    }


    const parser = getPrettierParser(languageId);

    if (!parser) {
        return code;
    }
    
    const options = {
        parser: parser,
        plugins: [
            pluginPHP, 
            pluginJava, 
            pluginKotlin, 
            pluginSh
        ],
        tabWidth: 4,
        semi: true,
        singleQuote: true,
        printWidth: 100
    };

    try {
        const formattedCode = await prettier.format(code, options);
        return formattedCode;
    } catch (error) {
        console.error(`Prettier formatting error for ${languageId}:`, error.message);
        return code; 
    }
}

export { formatCode };