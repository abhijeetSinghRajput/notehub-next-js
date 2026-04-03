// Create one shared base:
import { TocItem } from "@/lib/note/types";

export interface IBase {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// 👤 IUser
export interface IUser extends IBase {
  email: string;
  password?: string; // select: false
  googleId?: string;
  fullName: string;
  userName: string;

  avatar: string;
  cover: string;

  bio: string;
  socials: { url: string }[];

  hasGoogleAuth: boolean;
  role: "user" | "admin";
}

// 📁 ICollection
export interface ICollection extends IBase {
  name: string;
  userId: string | IUser;

  visibility: "public" | "private";
  slug: string;
  notes?: INote[];

  collaborators: string[] | IUser[];
}

// 📝 INote
export interface INote extends IBase {
  name: string;
  content: string;

  // id can be populated to full object.
  collectionId: string | ICollection;
  userId: string | IUser;

  visibility: "public" | "private";
  collaborators: string[] | IUser[];

  slug: string;
  contentUpdatedAt: string;
  tableOfContent: TocItem[];
}

export type PopulatedNote = Omit<INote, "userId" | "collectionId"> & {
  userId: IUser;
  collectionId: ICollection;
};

// 🖼️ IImage
export interface IImage extends IBase {
  userId: string | IUser;

  url: string;
  publicId: string;
}

// 🔐 IOtp
export interface IOtp extends IBase {
  purpose: "signup" | "password_reset" | "email_update";
  email: string;
  otp: string;

  expiresAt: string;
  lastSentAt: string;
}

// 🔎 ISearchIndex
export interface ISearchIndex extends IBase {
  lemma: string;

  notes: {
    noteId: string;
    tf: number;
  }[];
}

// If you want API response types (without internal fields):

export type PublicUser = Pick<
  IUser,
  "userName" | "fullName" | "avatar" | "cover"
>;

export type PublicNote = Pick<
  INote,
  "name" | "slug" | "content" | "contentUpdatedAt"
>;

export interface IPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IGetAllUsersResponse {
  users: IUser[];
  pagination: IPagination;
}
