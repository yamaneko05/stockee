# PC向けレイアウト対応方針

## 概要

スマホ向けに設計されたアプリを、パソコンでも快適に利用できるようにする。
変更は最小限に抑え、シンプルな実装を目指す。

## 方針

### 基本アプローチ

- **中央寄せレイアウト**: コンテンツを画面中央に配置
- **最大幅制限**: `max-w-2xl`（672px）でスマホと同等の幅を維持
- **レスポンシブ対応**: `sm:` ブレークポイント（640px以上）でPC向けスタイルを適用

## 実装内容

### 1. メインレイアウト

**対象ファイル**: `src/app/(main)/layout.tsx`

```tsx
<main className="mx-auto max-w-2xl">{children}</main>
```

### 2. ヘッダー

**対象ファイル**: `src/components/layout/header.tsx`

```tsx
<div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
```

### 3. フォーム（PC向け横並びレイアウト）

**対象ファイル**: `src/components/item/item-form.tsx`

- スマホ: ラベルと入力欄が縦並び
- PC（640px以上）: ラベルと入力欄が横並び（140px + 残り幅）

```tsx
<div className="space-y-2 sm:grid sm:grid-cols-[140px_1fr] sm:items-center sm:gap-4 sm:space-y-0">
  <Label>ラベル</Label>
  <Input />
</div>
```

数値入力フィールドは適切な幅に制限:
- 価格: `sm:max-w-32`
- 在庫数: `sm:w-24`
- 単位: `sm:w-20`
- カテゴリ: `sm:max-w-48`

### 4. ItemCard（ホバー効果）

**対象ファイル**: `src/components/item/item-card.tsx`

```tsx
className="... transition-colors hover:bg-muted/50"
```

- 通常状態: マウスホバーで背景色が薄く変化
- 警告状態: ホバー効果は適用しない（警告色を維持）

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(main)/layout.tsx` | 中央寄せ + 最大幅 |
| `src/components/layout/header.tsx` | 中央寄せ + 最大幅 |
| `src/components/item/item-form.tsx` | 横並びレイアウト + 幅制限 |
| `src/components/item/item-card.tsx` | ホバー効果 |

## 選択理由

1. **シンプル**: 最小限のファイル変更
2. **一貫性**: スマホとPCで同じUI体験
3. **保守性**: 既存コンポーネントへの影響なし
4. **可読性**: 適切な幅で読みやすい

## 将来の拡張（必要に応じて）

- サイドバーナビゲーション
- グリッド表示（カード複数列）
- キーボードショートカット
