import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome, {user.email}
        </h1>
        <p className="mt-2 text-muted-foreground">
          You&apos;re signed in to Pairwise.
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}
