import { marked } from "marked";

/**
 * Convert markdown strings to HTML objects to be used with React's dangerouslySetInnerHTML
 * @param text - The markdown string to be converted
 * @returns - { __html: string } object to be used with React's dangerouslySetInnerHTML
 */
const md = (text: string): TrustedHTML => {
  console.log(marked.parseInline(text));
  return { __html: marked.parseInline(text) };
};

export default md;