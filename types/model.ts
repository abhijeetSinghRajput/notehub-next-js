// Create one shared base:
import { Types } from "mongoose";

export interface IBase {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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

  hasGoogleAuth: boolean;
  role: "user" | "admin";
}

// 📁 ICollection
export interface ICollection extends IBase {
  name: string;
  userId: Types.ObjectId;

  visibility: "public" | "private";
  slug: string;

  collaborators: Types.ObjectId[];
}

// 📝 INote
export interface INote extends IBase {
  name: string;
  content: string;

  collectionId: Types.ObjectId;
  userId: Types.ObjectId;

  visibility: "public" | "private";
  collaborators: Types.ObjectId[];

  slug: string;
  contentUpdatedAt: Date;
}

// 🖼️ IImage
export interface IImage extends IBase {
  userId: Types.ObjectId;

  url: string;
  publicId: string;
}

// 🔐 IOtp
export interface IOtp extends IBase {
  purpose: "signup" | "password_reset" | "email_update";
  email: string;
  otp: string;

  expiresAt: Date;
  lastSentAt: Date;
}

// 🔎 ISearchIndex
export interface ISearchIndex extends IBase {
  lemma: string;

  notes: {
    noteId: Types.ObjectId;
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
