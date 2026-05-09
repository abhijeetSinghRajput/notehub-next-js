'use server'

import { revalidatePath } from "next/cache";

export async function revalidateNotePath(path: string) {
  if (path) {
    revalidatePath(path);
  }
}

export async function revalidateAll() {
  revalidatePath("/", "layout");
}
