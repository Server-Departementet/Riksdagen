import { marked } from "marked";

/**
 * Convert markdown strings to HTML objects to be used with React's dangerouslySetInnerHTML
 * @param text - The markdown string to be converted
 * @returns - { __html: TrustedHTML } object to be used with React's dangerouslySetInnerHTML
 */
const md = (text: string): { __html: TrustedHTML } => {
  return { __html: marked.parseInline(text) };
};

export default md;