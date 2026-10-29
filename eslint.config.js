import { defineConfig } from "eslint/config"
import plugin from "@stylistic/eslint-plugin"
import parser from "@typescript-eslint/parser"


export default defineConfig({
  files:           [ "lib/*.ts", "public/*.ts" ],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType:  "module",
    parser,
  },
  plugins: {
    "ts": plugin,
  },

  rules: {
    "ts/quotes": [ 1, "double", { allowTemplateLiterals: "always" }],
    "ts/indent": [ 1, 2, {
      SwitchCase:   1,
      ignoredNodes: [
        "VariableDeclarator",
        "TSConditionalType",
        "ConditionalExpression",
        "LogicalExpression",
      ],
    }],
    "ts/comma-dangle": [ 1, "always-multiline" ],
    "semi":            [ 1, "never", { beforeStatementContinuationChars: "always" }],
    "linebreak-style": [ 1, "unix" ],
    "eol-last":        [ 1, "always" ],

    "switch-colon-spacing":  1,
    "rest-spread-spacing":   1,
    "arrow-spacing":         1,
    "block-spacing":         1,
    "comma-spacing":         1,
    "func-call-spacing":     1,
    "keyword-spacing":       2,
    "array-bracket-spacing": [ 1, "always", {
      singleValue:     true,
      objectsInArrays: false,
      arraysInArrays:  false,
    }],
    "object-curly-spacing": [ 1, "always", {
      arraysInObjects:  false,
      objectsInObjects: false,
    }],
    "key-spacing": [ 1, {
      singleLine: { beforeColon: false, afterColon: true, mode: "minimum" },
      multiLine:  { beforeColon: false, afterColon: true },
      align:      { beforeColon: false, afterColon: true, on: "value" },
    }],
    "ts/key-spacing": [ 1, {
      singleLine: { beforeColon: false, afterColon: true, mode: "minimum" },
      multiLine:  { beforeColon: false, afterColon: true },
      align:      { beforeColon: false, afterColon: true, on: "value" },
    }],

    "object-property-newline": [ 1, {
      allowAllPropertiesOnSameLine: true,
    }],
    "ts/member-delimiter-style": [ 1, {
      multiline:          { delimiter: "none", requireLast: true },
      singleline:         { delimiter: "comma", requireLast: false },
      multilineDetection: "brackets",
    }],

    "no-trailing-spaces":            1,
    "no-whitespace-before-property": 1,
    "space-before-blocks":           1,

    "space-infix-ops": [ 1, {
      int32Hint: false,
    }],
    "space-unary-ops": [ 1, {
      words:    true,
      nonwords: false,
    }],
  },
})
