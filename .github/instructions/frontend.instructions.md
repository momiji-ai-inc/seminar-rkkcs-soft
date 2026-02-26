---
applyTo: "frontend/**/*.{ts,vue}"
---

# フロントエンド指示

- `<script setup lang="ts">` を使用する（Options API 禁止）
- API 呼び出しは `@/services/api.ts` の関数を使う（axios 直接呼び出し禁止）
- 共有型は `@/types` からインポートする
- UI は Bootstrap 5 のユーティリティクラスを優先する
