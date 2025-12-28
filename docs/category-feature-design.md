# カテゴリ分類機能 設計書

## 概要

品目（Item）をカテゴリで分類し、フィルタリングできる機能を追加する。

## 設計方針

| 項目 | 方針 |
|------|------|
| カテゴリ管理範囲 | グループごと、または個人で独自のカテゴリを管理 |
| 品目へのカテゴリ割り当て | 1品目につき1カテゴリのみ |
| 階層構造 | なし（フラット） |

## データベース設計

### Categoryモデル

```prisma
model Category {
  id        String   @id @default(cuid())
  name      String
  color     String?  // 表示色（例: "#3b82f6"）
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  // グループ用カテゴリの場合
  groupId String?
  group   Group?  @relation(fields: [groupId], references: [id], onDelete: Cascade)

  // 個人用カテゴリの場合
  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items Item[]

  // グループ内またはユーザー内でユニーク
  @@unique([groupId, name])
  @@unique([userId, name])
  @@map("category")
}
```

**ルール:**
- `groupId`と`userId`はどちらか一方のみ設定される（排他的）
- グループのカテゴリ: `groupId`が設定され、`userId`はnull
- 個人のカテゴリ: `userId`が設定され、`groupId`はnull

### Itemモデル（変更）

```prisma
model Item {
  // ... 既存フィールド

  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
}
```

### Groupモデル（変更）

```prisma
model Group {
  // ... 既存フィールド

  categories Category[]
}
```

### Userモデル（変更）

```prisma
model User {
  // ... 既存フィールド

  categories Category[]
}
```

## API設計

### Server Actions

| アクション | 説明 |
|-----------|------|
| `getCategories(groupId?)` | カテゴリ一覧を取得（groupIdがnullの場合は個人カテゴリ） |
| `createCategory(data, groupId?)` | カテゴリを作成（groupIdがnullの場合は個人カテゴリ） |
| `updateCategory(categoryId, data)` | カテゴリを更新 |
| `deleteCategory(categoryId)` | カテゴリを削除（品目のcategoryIdはnullに） |
| `reorderCategories(items, groupId?)` | カテゴリの並び順を更新 |

### バリデーションスキーマ

```typescript
// src/lib/validations/category.ts
export const createCategorySchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
```

## UI設計

### 1. カテゴリ管理画面

#### グループ用カテゴリ

**パス**: `/groups/[groupId]`（グループ設定画面内）

**機能**:
- カテゴリ一覧表示
- カテゴリ追加（名前、色）
- カテゴリ編集
- カテゴリ削除
- ドラッグ&ドロップで並び替え

#### 個人用カテゴリ

**パス**: `/settings`（設定画面内）

**機能**:
- グループ用と同じ機能を個人向けに提供

### 2. 品目フォーム変更

**ファイル**: `src/components/item/item-form.tsx`

**変更内容**:
- カテゴリ選択ドロップダウンを追加
- カテゴリ未選択も許可（任意項目）
- グループ選択時はグループのカテゴリ、未選択時は個人のカテゴリを表示

### 3. 在庫一覧のフィルタリング

**ファイル**: `src/components/item/item-list.tsx`

**変更内容**:
- カテゴリフィルタータブ/チップを追加
- 「すべて」「未分類」+ 各カテゴリで絞り込み
- グループ選択時はグループのカテゴリ、未選択時は個人のカテゴリでフィルタリング

## ファイル構成

```
src/
├── actions/
│   └── category.ts          # カテゴリ関連のServer Actions
├── lib/validations/
│   └── category.ts          # バリデーションスキーマ
├── app/(main)/
│   └── groups/
│       └── [groupId]/
│           └── categories/
│               └── page.tsx  # カテゴリ管理画面
├── components/
│   └── category/
│       ├── category-list.tsx     # カテゴリ一覧
│       ├── category-form.tsx     # カテゴリ追加/編集フォーム
│       └── category-filter.tsx   # フィルター用コンポーネント
```

## 実装順序

1. **DBスキーマ更新**
   - Categoryモデル追加
   - Itemモデルにcategory関連追加
   - マイグレーション実行

2. **バックエンド**
   - バリデーションスキーマ作成
   - Server Actions実装

3. **カテゴリ管理画面**
   - カテゴリ一覧・追加・編集・削除
   - 並び替え機能

4. **品目フォーム更新**
   - カテゴリ選択UIを追加

5. **フィルタリング機能**
   - 在庫一覧画面にフィルターUI追加
   - フィルタリングロジック実装

## 補足

### カテゴリ色のプリセット

ユーザーが選びやすいよう、プリセットカラーを用意する:

```typescript
const CATEGORY_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];
```

### カテゴリ削除時の挙動

- カテゴリを削除しても品目は削除されない
- 該当品目のcategoryIdはnullになる（未分類扱い）
