// Types for scripts/lint-tokens-lib.mjs (the lint:tokens rules), used by src/test/lint-tokens.test.ts.
export declare const HEX: RegExp;
export declare const FUNC: RegExp;
export declare const PX: RegExp;
export declare const DIM_NUMBER: RegExp;
export declare const STYLE_PROP: RegExp;
export declare function stripComments(text: string, isScript: boolean): string;
export declare function lintFile(rel: string, text: string): string[];
