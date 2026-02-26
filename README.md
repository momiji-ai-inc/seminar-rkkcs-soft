# ライブ抽選アプリ

ライブチケットの抽選を行う Web アプリケーション。
ユーザーがイベントに応募し、管理者が抽選を実行して当選者を決定する。

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | Vue 3 + TypeScript、Bootstrap 5 |
| バックエンド | Express + TypeScript |
| データベース | SQLite（better-sqlite3）|

## セットアップ

```bash
npm run setup   # 依存インストール + DB 初期化
npm run dev     # 起動（バックエンド :3000 / フロントエンド :8080）
```

## フォルダ構成

```
├── backend/src/
│   ├── index.ts            # Express サーバー
│   ├── database.ts         # SQLite 接続・スキーマ定義
│   ├── routes/api.ts       # REST API（/api/events 配下）
│   ├── seed.ts             # シードデータ投入
│   └── types/index.ts      # 型定義
├── frontend/src/
│   ├── views/              # ページ（EventList, EventDetail, AdminPanel, LotteryResult）
│   ├── components/         # 共通コンポーネント（Navbar, EventCard, ApplicationForm, LotteryAnimation）
│   ├── services/api.ts     # API クライアント
│   ├── router/index.ts     # ルーティング定義
│   └── types/index.ts      # 型定義
└── docs/                   # ドキュメント
```

## 画面フロー

```mermaid
flowchart LR
    EventList["イベント一覧<br>/"]
    EventDetail["イベント詳細<br>/events/:id"]
    LotteryResult["抽選結果<br>/events/:id/results"]
    AdminPanel["管理者画面<br>/admin"]

    EventList -->|イベント選択| EventDetail
    EventDetail -->|結果確認| LotteryResult
    AdminPanel -->|抽選実行| LotteryResult
```

## API フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant B as バックエンド
    participant DB as SQLite

    U->>F: イベント一覧を表示
    F->>B: GET /api/events
    B->>DB: SELECT events
    DB-->>B: イベントデータ
    B-->>F: イベント一覧（応募数付き）

    U->>F: イベントに応募
    F->>B: POST /api/events/:id/apply
    B->>DB: INSERT INTO applications
    DB-->>B: OK
    B-->>F: 応募完了

    U->>F: 抽選を実行（管理者）
    F->>B: POST /api/events/:id/lottery
    B->>DB: UPDATE applications（当選/落選）
    DB-->>B: OK
    B-->>F: 抽選結果

    U->>F: 結果を確認
    F->>B: GET /api/events/:id/results
    B->>DB: SELECT applications
    DB-->>B: 当選者・落選者
    B-->>F: 結果表示
```
