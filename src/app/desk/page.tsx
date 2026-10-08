"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RundownDesk from "@/components/RundownDesk/RundownDesk";
import { signOut, useHydrated, useUser } from "@/lib/auth";

export default function DeskPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useUser();

  useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  if (!user) return null;

  return <RundownDesk username={user} onLogout={signOut} />;
}
