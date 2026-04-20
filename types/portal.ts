export type UserRole = "admin" | "employee";

export type PortalUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
};

export type PortalCategory = "manual" | "rule";

export type PortalDocument = {
  id: string;
  slug: string;
  category: PortalCategory;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  updatedAt: string;
  attachmentTitle?: string;
  attachmentUrl?: string;
};

export type Announcement = {
  id: string;
  label: string;
  title: string;
  body: string;
  publishedAt: string;
};

export type SearchResult = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: PortalCategory;
  updatedAt: string;
  tags: string[];
  score: number;
};

export type StoredFileRecord = {
  id: string;
  fileName: string;
  url: string;
  createdAt: string;
};
