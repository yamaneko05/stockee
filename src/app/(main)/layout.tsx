import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { GroupProvider } from "@/contexts/group-context";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <GroupProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl">{children}</main>
      </div>
    </GroupProvider>
  );
}
