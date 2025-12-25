# データベース設計

## ER図

```
┌─────────────┐       ┌─────────────┐
│    user     │       │    item     │
├─────────────┤       ├─────────────┤
│ id (PK)     │──────<│ id (PK)     │
│ email       │       │ userId (FK) │
│ name        │       │ name        │
│ ...         │       │ productName │
└─────────────┘       │ price       │
                      │ stock       │
                      │ unit        │
                      │ note        │
                      │ ...         │
                      └─────────────┘
```

## Prismaスキーマ

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  emailVerified Boolean  @default(false)
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  items    Item[]
  sessions Session[]
  accounts Account[]

  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("sessions")
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@map("accounts")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verifications")
}

model Item {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String   // 品目名（例: シャンプー 詰め替え）
  productName String?  // 商品名（例: YOLU カームナイトリペア）
  price       Int?     // 価格（円）
  stock       Int      @default(0) // 在庫数
  unit        String   @default("個") // 単位（個、本、箱など）
  note        String?  // 備考
  order       Int      @default(0) // 表示順（手動並び替え用）
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([userId, order])
  @@map("items")
}
```

## テーブル説明

### users
Better Authが管理するユーザーテーブル

### sessions
Better Authが管理するセッションテーブル

### accounts
Better Authが管理するアカウントテーブル（メール+パスワード用）

### verifications
Better Authが管理する検証トークンテーブル

### items
品目テーブル（アプリ固有）

| カラム | 型 | 説明 |
|--------|------|------|
| id | cuid | 主キー |
| userId | string | ユーザーID（FK） |
| name | string | 品目名 |
| productName | string? | 商品名 |
| price | int? | 価格（円） |
| stock | int | 在庫数（デフォルト: 0） |
| unit | string | 単位（デフォルト: 個） |
| note | string? | 備考 |
| order | int | 表示順（デフォルト: 0） |
