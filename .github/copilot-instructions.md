## コマンド

### 起動と実行
```bash
npm run setup   # 初回セットアップ（依存インストール + DB初期化）
npm run dev     # フロントエンドとバックエンドの起動
npm run lint    # コードの品質チェック（ESLint）
npm run format  # コードの整形（Prettier）
```

## アーキテクチャ

モノレポ構成
- Frontend (`frontend/src/`)
    - 構成: Vue 3 + TypeScript
    - UI: Bootstrap 5
    - 役割: 画面表示とユーザー操作を担当
- Backend (`backend/src/`)
    - 構成: Express + TypeScript
    - DB: better-sqlite3
    - 役割: APIとDB管理を担当

### APIエンドポイント（`/api/events` 配下）

- `GET /` — イベント一覧（応募数付き）
- `GET /:id` — イベント詳細
- `POST /:id/apply` — 応募 `{ name, email }`
- `GET /:id/applications` — 応募者一覧
- `POST /:id/lottery` — 抽選実行
- `GET /:id/results` — 抽選結果（当選者・落選者）

### DB設計

DBファイル: `backend/lottery.db`

[1] events（イベント情報）

| カラム | 型 | 説明 |
|---|---|---|
| id | INTEGER (PK) | 自動採番 |
| title | TEXT NOT NULL | イベント名 |
| artist | TEXT NOT NULL | アーティスト名 |
| venue | TEXT NOT NULL | 会場 |
| capacity | INTEGER NOT NULL | 当選定員数 |
| lottery_executed | INTEGER DEFAULT 0 | 抽選済みフラグ（0/1） |
| created_at | TEXT | 作成日時（localtime） |

[2] applications（応募情報）

| カラム | 型 | 説明 |
|---|---|---|
| id | INTEGER (PK) | 自動採番 |
| event_id | INTEGER NOT NULL (FK → events.id) | 対象イベント |
| name | TEXT NOT NULL | 応募者名 |
| email | TEXT NOT NULL | メールアドレス |
| status | TEXT DEFAULT 'pending' | 状態（pending / won / lost） |
| applied_at | TEXT | 応募日時（localtime） |

## コーディング規約

### Git Commit
- 事前に lint と format を実施
    - `npm run format`
    - `npm run lint`
- コミットは下記形式の日本語で記述
    - `feat: <機能追加の内容>`
    - `fix: <バグ修正の内容>`
    - `docs: <ドキュメントの内容>`
    - `refactor: <リファクタリングの内容>`

### Pull Request
- `docs/pull_request_template.md` のテンプレートに従って記述する
