"use server";

import { getSupabase } from "@lead-engine/shared";
import { revalidatePath } from "next/cache";

export async function createCampaign(
  _prev: { error: string },
  formData: FormData
) {
  const name = formData.get("name") as string;
  const target_category = formData.get("target_category") as string;
  const target_location = formData.get("target_location") as string;
  const email_template = formData.get("email_template") as string;

  if (!name || !target_category || !target_location || !email_template) {
    return { error: "All fields are required" };
  }

  const { error } = await getSupabase().from("campaigns").insert({
    name,
    target_category,
    target_location,
    email_template,
    status: "draft",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/campaigns");
  return { error: "" };
}
