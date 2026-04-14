"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  return redirect("/app/dashboard");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return redirect(`/auth/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  return redirect("/auth/onboarding");
}

export async function updateOnboarding(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/sign-in");
  }

  const workspaceData = {
    user_id: user.id,
    workspace_name: formData.get("workspaceName") as string,
    business_type: formData.get("businessType") as string,
    offer: formData.get("offer") as string,
    ideal_customer_profile: formData.get("icp") as string,
    target_region: formData.get("targetRegion") as string,
    primary_goal: formData.get("primaryGoal") as string,
    outreach_tone: formData.get("brandTone") as string,
    onboarding_completed: true,
  };

  const { error } = await supabase
    .from("workspaces")
    .upsert(workspaceData);

  if (error) {
    return redirect(`/auth/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  return redirect("/app/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return redirect("/auth/sign-in");
}
