import { revalidatePath } from "next/cache";

export function revalidateHome() {
  revalidatePath("/");
}

export function revalidateAppShell() {
  revalidatePath("/", "layout");
}

export function revalidateGroup(groupId: string) {
  revalidatePath("/");
  revalidatePath(`/groups/${groupId}`);
}

export function revalidatePost(postId: string) {
  revalidatePath(`/posts/${postId}`);
}

export function revalidateMyPosts() {
  revalidatePath("/me/posts");
}
