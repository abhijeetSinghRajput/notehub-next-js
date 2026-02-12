import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import type { AxiosError } from "axios";

export interface GalleryImage {
  _id: string;
  url: string;
  publicId: string;
}

export interface ImageStoreState {
  galleryImages: GalleryImage[];
  isLoadingImages: boolean;
  getImages: () => Promise<void>;
  uploadImage: (file: File) => Promise<boolean>;
  removeImage: (imageId: string) => Promise<boolean>;
}

export const useImageStore = create<ImageStoreState>((set, get) => ({
  galleryImages: [],
  isLoadingImages: false,

  getImages: async () => {
    set({ isLoadingImages: true });
    try {
      const res = await axiosInstance.get("/images");
      const { images } = res.data as { images: GalleryImage[] };
      set({ galleryImages: images });
    } catch (error) {
      console.error(error);
      throw new Error("Failed to load images");
    } finally {
      set({ isLoadingImages: false });
    }
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosInstance.post("/images/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const { image, message } = res.data as {
        image: GalleryImage;
        message?: string;
      };
      set({ galleryImages: [image, ...get().galleryImages] });
      localStorage.setItem("imageCount", String(get().galleryImages.length));
      toast.success(message || "Image uploaded");
      return true;
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      console.error("Image upload error:\n", error);
      toast.error(err.response?.data?.message || "Failed to upload image");
      return false;
    }
  },

  removeImage: async (imageId) => {
    try {
      const res = await axiosInstance.delete(`/images/${imageId}`);
      const { message } = res.data as { message?: string };
      set((state) => ({
        galleryImages: state.galleryImages.filter((img) => img._id !== imageId),
      }));
      localStorage.setItem("imageCount", String(get().galleryImages.length));
      toast.success(message || "Image removed");
      return true;
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      console.error("Image delete error:\n", error);
      toast.error(err.response?.data?.message || "Failed to delete image");
      return false;
    }
  },
}));
