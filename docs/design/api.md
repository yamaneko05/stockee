# Server Actions 設計

## 方針

- API Routesは認証関連のみ（Better Authが使用）
- データ操作はすべてServer Actionsで実装
- Zodによる入力バリデーション

---

## Server Actions 一覧

### 品目関連

| Action | 説明 | 入力 | 出力 |
|--------|------|------|------|
| `getItems` | 品目一覧取得（order順） | - | `Item[]` |
| `getItem` | 品目詳細取得 | `id` | `Item \| null` |
| `createItem` | 品目作成 | `CreateItemInput` | `Item` |
| `updateItem` | 品目更新 | `id`, `UpdateItemInput` | `Item` |
| `deleteItem` | 品目削除 | `id` | `void` |
| `incrementStock` | 在庫+1 | `id` | `Item` |
| `decrementStock` | 在庫-1 | `id` | `Item` |
| `reorderItems` | 並び替え | `{ id, order }[]` | `void` |

---

## 型定義

```typescript
type CreateItemInput = {
  name: string        // 必須: 品目名
  productName?: string
  price?: number
  stock: number       // 必須: 在庫数
  unit: string        // 必須: 単位
  note?: string
}

type UpdateItemInput = Partial<CreateItemInput>
```

---

## API Routes（認証用のみ）

```
app/api/auth/[...all]/route.ts
```

Better Authが以下を自動ハンドリング:
- `POST /api/auth/sign-up`
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-out`
