---
applyTo: "backend/**/*.ts"
---

# バックエンド指示

- DB クエリは必ず `db.prepare()` を使う（文字列結合 SQL 禁止）
- 複数の書き込みは `db.transaction()` でまとめる
- エラーレスポンスは `{ error: string }` + 適切な HTTP ステータス
- 共有型は `backend/src/types/index.ts` に定義する
