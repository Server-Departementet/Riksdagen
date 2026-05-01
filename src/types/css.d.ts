// Declare the CSS module types for TypeScript
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
