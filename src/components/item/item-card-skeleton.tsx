import { Skeleton } from "@/components/ui/skeleton";

export function ItemCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3">
      {/* 1行目: 品目名 + 数量操作 */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>

      {/* 2行目: カテゴリ + 商品名 + 価格 */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>

      {/* 3行目: 備考（50%の確率で表示を模擬） */}
      <div className="mt-1.5">
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}

export function ItemListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}
