export interface User {
  email: string;
  token: string;
}

export interface LinkItem {
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string[];
  createdAt: string;
}

export interface ProcessedLinkData {
  title: string;
  summary:string;
  tags: string[];
}