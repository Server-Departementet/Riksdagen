import { marked } from "marked";

/**
 * Convert markdown strings to HTML objects to be used with React's dangerouslySetInnerHTML
 * @param text - The markdown string to be converted
 * @returns - { __html: TrustedHTML } object to be used with React's dangerouslySetInnerHTML
 */
const md = (text: string): { __html: TrustedHTML } => {
  const html: string = marked.parseInline(text) as string;

  const wrapper = `<span class="markdown-parsed">${html}</span>`;

  // Return the HTML object
  return { __html: wrapper };
};

export default md;