import path from "node:path";

export type TrimmedMessage = {
  id: string;
  authorId: string;
  content: string;
  createdTimestamp: number;
  attachmentUrls?: string[];
};

export type Quote = {
  id: string;
  authorId: string;
  createdTimestamp: number;
  link: string;

  sender: string;
  body: string;
  quotee: string;

  quoteeId?: string;
  context?: string;
  attachments?: string[];
};

export const attachmentDir = "public/quote-attachments";
export function getAttachmentPath(quote: TrimmedMessage, attachmentUrl: string): string {
  const downloadURL = new URL(attachmentUrl);
  const filename = downloadURL.pathname.split("/").at(-1);
  const attachmentId = downloadURL.pathname.split("/").at(-2);
  if (!filename || !attachmentId) {
    console.error(`Could not parse filename or attachment ID from URL: ${attachmentUrl}`);
    throw new Error("Failed to parse attachment URL");
  }

  const fileDest = path.join(
    attachmentDir,
    `${quote.id}.${attachmentId}.${filename}`,
  ).replaceAll("\\", "/");

  return fileDest;
}