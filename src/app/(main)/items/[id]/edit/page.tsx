import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/item/item-form";
import { getItem } from "@/actions/item";

type EditItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { id } = await params;
  const item = await getItem(id);

  if (!item) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">戻る</span>
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">品目を編集</h1>
      </div>

      <div className="p-4">
        <ItemForm item={item} />
      </div>
    </div>
  );
}
