# 複数ユーザー共有機能 設計書（シンプル版）

## 1. 概要

### 目的
家族やルームメイトと日用品の在庫情報を共有できるようにする。

### 設計方針
- **招待リンクのみ**でグループ参加（メール送信なし）
- ロールは **owner / member** の2種類のみ
- Better-auth Organization プラグインは使わず、シンプルに自前実装

---

## 2. データベース設計

### 追加テーブル

```prisma
// 共有グループ
model Group {
  id         String   @id @default(cuid())
  name       String
  inviteCode String   @unique @default(cuid()) // 招待用コード
  createdAt  DateTime @default(now())

  ownerId String
  owner   User   @relation("GroupOwner", fields: [ownerId], references: [id], onDelete: Cascade)

  members GroupMember[]
  items   Item[]

  @@map("group")
}

// グループメンバー
model GroupMember {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  groupId String
  group   Group  @relation(fields: [groupId], references: [id], onDelete: Cascade)

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@map("group_member")
}
```

### 既存テーブルの変更

```prisma
model User {
  // 既存フィールド...

  ownedGroups  Group[]       @relation("GroupOwner")
  groupMembers GroupMember[]

  @@map("user")
}

model Item {
  // 既存フィールド...

  // userIdをオプショナルに変更
  userId  String?
  user    User?   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // グループIDを追加
  groupId String?
  group   Group?  @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@map("item")
}
```

---

## 3. アクセス制御

### ロール

| ロール | 説明 |
|--------|------|
| owner | グループ作成者。グループ削除、招待リンク再生成が可能 |
| member | 一般メンバー。品目の全操作が可能 |

### 権限

| 操作 | owner | member |
|------|-------|--------|
| グループ削除 | ✓ | - |
| 招待リンク再生成 | ✓ | - |
| メンバー削除 | ✓ | - |
| グループ脱退 | - | ✓ |
| 品目の全操作 | ✓ | ✓ |

---

## 4. 機能設計

### 4.1 グループ作成
1. ユーザーがグループ名を入力して作成
2. 作成者が自動的にownerになる
3. 招待用コード（inviteCode）が自動生成される

### 4.2 グループ参加（招待リンク）
```
招待リンク形式: /join/[inviteCode]

フロー:
1. ownerが招待リンクをコピーしてLINE等で共有
2. 受け取った人がリンクを開く
3. ログイン済み → 即座にグループに参加
4. 未ログイン → ログイン/サインアップ後に参加
```

### 4.3 グループ切り替え
- ヘッダーでグループを切り替え
- 選択中のグループはlocalStorageに保存
- 「個人」と各グループを切り替え可能

### 4.4 品目の所属
```
1. 個人品目: userId != null, groupId == null
2. グループ品目: userId == null, groupId != null
```

---

## 5. UI設計

### 5.1 ヘッダー

```
+--------------------------------------------------+
| Stockee          [個人 ▼]                 [設定] |
+--------------------------------------------------+

ドロップダウン:
+------------------+
| ✓ 個人           |
|   田中家         |
|------------------|
| + グループ作成    |
+------------------+
```

### 5.2 画面一覧

| パス | 説明 |
|------|------|
| /groups/new | グループ作成 |
| /groups/[id] | グループ設定（招待リンク表示、メンバー一覧） |
| /join/[code] | グループ参加 |

---

## 6. 実装計画

### Step 1: データベース
- Prismaスキーマ更新
- マイグレーション実行

### Step 2: グループ基本機能
- グループ作成 Server Action
- グループ参加 Server Action
- グループ脱退/削除 Server Action

### Step 3: UI
- ヘッダーにグループ切り替え追加
- グループ作成画面
- グループ設定画面（招待リンク、メンバー一覧）
- グループ参加画面

### Step 4: 品目の対応
- Item Server Actionsをgroupに対応
- 品目一覧のフィルタリング更新

---

## 7. セキュリティ

- 招待コードはCUID（推測困難）
- グループ操作時はメンバーシップを確認
- ownerのみがグループ削除・メンバー削除可能
