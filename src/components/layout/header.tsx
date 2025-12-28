import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupSwitcher } from "./group-switcher";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href={"/"} className="flex items-center">
            <Image
              src="/icon.png"
              alt="icon"
              width={36}
              height={36}
              unoptimized
            />
            <h1 className="text-xl font-bold font-logo">Stockee</h1>
          </Link>
          <GroupSwitcher />
        </div>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <Settings className="h-5 w-5" />
            <span className="sr-only">設定</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
