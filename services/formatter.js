import prettier from "prettier";

import * as pluginPHP from "@prettier/plugin-php";
import * as pluginJava from "prettier-plugin-java";
import * as pluginKotlin from "prettier-plugin-kotlin";
import * as pluginSh from "prettier-plugin-sh";



const parserMap = {
  javascript: "babel",
  js: "babel",
  json: "json",
  typescript: "babel-ts",
  ts: "babel-ts",
  css: "css",
  html: "html",
  php: "php",
  java: "java",
  kotlin: "kotlin",
  kt: "kotlin",
  sh: "sh",
  bash: "sh",
};



export async function formatCode(code, language) {
  try {
    const parser = parserMap[language];

    if (!parser) {
      return code;
    }

    const formatted = await prettier.format(code, {
      parser,
      plugins: [
        pluginPHP,
        pluginJava,
        pluginKotlin,
        pluginSh
      ],
    });

    return formatted;

  } catch (err) {
    console.error("Prettier format error:", err);
    return code;
  }
}
