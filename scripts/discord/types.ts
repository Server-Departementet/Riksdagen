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
