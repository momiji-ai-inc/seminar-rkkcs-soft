## Phase 1: セキュリティ脆弱性（2件）

### 1-A. SQL インジェクション
- **ファイル**: `backend/src/routes/api.ts`
- **変更**: `POST /:id/apply` の INSERT を文字列結合に変更 + 検索用の `GET /:id/applications/search?name=` ルートを追加（文字列結合 SQL）
- **学習ポイント**: prepared statement vs 文字列結合、OWASP Injection

例: 応募エンドポイント
```sh
# メールアドレス欄にSQLインジェクション
curl -X POST http://localhost:3000/api/events/1/apply \
  -H "Content-Type: application/json" \
  -d '{"name": "テスト", "email": "x'\''),(1,'\''攻撃者'\'','\''injected@evil.com"}'
```

結果として、生成されるSQLは以下のようになり、2回も応募ができてしまう。
```sh
INSERT INTO applications (event_id, name, email)
VALUES (1, 'テスト', 'x'),(1,'攻撃者','injected@evil.com')
```

### 1-B. XSS（v-html）
- **ファイル**: `frontend/src/views/AdminPanel.vue`, `frontend/src/views/LotteryResult.vue`
- **変更**: 応募者名の表示を `{{ app.name }}` → `v-html="app.name"` に変更。誤解を招くコメント付き（「名前に装飾タグを使えるようにする」）
- **学習ポイント**: `{{ }}` の自動エスケープ vs `v-html` の危険性

例: 名前欄にスクリプトタグを含むデータを登録
```sh
curl -X POST http://localhost:3000/api/events/1/apply \
  -H "Content-Type: application/json" \
  -d '{"name": "<img src=x onerror=alert(document.cookie)>", "email": "xss@example.com"}'
```

管理パネル (`/admin`) で応募者一覧を表示すると、ブラウザ上でスクリプトが実行される。

---

## Phase 2: コード品質の問題（5件）

### 2-A. `any` 型の乱用
- **ファイル**: `frontend/src/services/api.ts`, `backend/src/routes/api.ts`
- **変更**: 戻り値型や引数を `any` に変更（例: `Promise<Event[]>` → `Promise<any>`）

### 2-B. 未使用の変数・インポート
- **ファイル**: `frontend/src/views/EventDetail.vue`, `backend/src/routes/api.ts`
- **変更**: `watch`, `computed`, `useRouter`, `path`, `fs` 等の未使用 import を追加。未使用の変数も追加

### 2-C. console.log の残存
- **ファイル**: `backend/src/routes/api.ts`, `frontend/src/services/api.ts`
- **変更**: 個人情報（メールアドレス、当選者名）を含む console.log を追加

### 2-D. 一貫性のないエラーハンドリング
- **ファイル**: `backend/src/routes/api.ts`
- **変更**: 一部ルートのエラー形式を変更。`{ error }` → `{ success: false, message }` / `{ errors: [...] }` / 文字列レスポンス等、3種類の異なる形式に

### 2-E. エラーの握りつぶし
- **ファイル**: `backend/src/routes/api.ts`
- **変更**: 抽選実行を try-catch で囲み、エラー時も「成功」レスポンスを返す

例: 抽選処理で内部エラーが発生した場合でも、以下のレスポンスが返る
```json
{ "message": "抽選が完了しました", "total": 0, "winners": 0, "losers": 0 }
```

実際にはDBへの書き込みが失敗しているにもかかわらず、HTTPステータス200で「成功」として返却されるため、フロントエンド側では異常を検知できない。

---

## Phase 3: 冗長・不要なコード（4件）

### 3-A. 重複ヘルパー関数
- **ファイル**: `backend/src/routes/api.ts`
- **変更**: `findEvent` とほぼ同じ `getEventById` を追加（`undefined` vs `null` の返り値の違い）。ルートによって使い分け

### 3-B. デッドコード
- **ファイル**: `backend/src/routes/api.ts`
- **変更**: `res.json()` の後に到達不能コードを追加（メール送信処理、キャッシュ更新）。未使用の `sendConfirmationEmail` 関数も追加

### 3-C. 過度に複雑なロジック
- **ファイル**: `frontend/src/views/LotteryResult.vue`
- **変更**: `oddsText` computed を、ループで配列長を手動カウント + `toFixed()` を文字列分割で再実装する冗長な実装に置き換え

### 3-D. 不要・誤ったコメント
- **ファイル**: `backend/src/routes/api.ts`, `frontend/src/services/api.ts`
- **変更**: コードをそのまま繰り返すだけのコメント、事実と異なるコメントを追加

---

## 変更ファイル一覧

| ファイル | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| `backend/src/routes/api.ts` | 1-A | 2-A, 2-B, 2-C, 2-D, 2-E | 3-A, 3-B, 3-D |
| `frontend/src/views/AdminPanel.vue` | 1-B | - | - |
| `frontend/src/views/LotteryResult.vue` | 1-B | - | 3-C |
| `frontend/src/services/api.ts` | - | 2-A, 2-C | 3-D |
| `frontend/src/views/EventDetail.vue` | - | 2-B | - |
