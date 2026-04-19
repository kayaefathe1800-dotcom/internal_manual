# 社内ナレッジポータル MVP
社内マニュアルと就業規則を検索・閲覧するための Next.js MVP です。  
今回はまず、通常検索 + あいまい検索 + 同義語辞書 + 検索結果一覧 UI を実装し、将来 Supabase / AI 検索へ拡張しやすい構成に整理しています。

## 実装済み MVP
- 社員ログイン画面
- 管理者 / 一般社員の権限分けの土台
- トップページ中央の大きな検索窓
- 自然な日本語の検索入力
- タイトル / 本文 / タグを対象にした検索
- あいまい検索
- 同義語辞書
- 検索結果一覧 UI
- よく使う検索語ボタン
- お知らせ表示
- マニュアル一覧ページ
- 就業規則ページ
- PDF 添付資料の表示枠
- スマホ対応のシンプルな日本語 UI

## フォルダ構成
```text
app/
  admin/                 管理者向けトップ
  api/search/            検索 API
  login/                 ログイン画面 + server action
  logout/                ログアウト
  manuals/               マニュアル一覧 / 詳細
  rules/                 就業規則一覧 / 詳細
components/
  search-experience.tsx  検索 UI クライアント
  site-shell.tsx         共通ヘッダー / ナビゲーション
data/
  portal-content.ts      MVP 用の社内文書・お知らせ・人気検索語
lib/
  auth.ts                デモ認証 / 権限判定
  search.ts              検索エンジン・同義語辞書・スコアリング
supabase/
  schema.sql             本番用 DB 初期設計
types/
  portal.ts              型定義
public/samples/
  *.pdf                  PDF 表示確認用サンプル
```

## 画面一覧
1. `/` トップページ
   大きな検索窓、人気検索語、最新のお知らせ、検索結果一覧
2. `/login` ログイン
   社員ログイン、デモ用の役割切り替え
3. `/manuals` マニュアル一覧
   カテゴリ・タグつきの一覧表示
4. `/manuals/[slug]` マニュアル詳細
   本文、更新日、PDF 添付表示
5. `/rules` 就業規則一覧
   就業規則の章一覧
6. `/rules/[slug]` 就業規則詳細
   条文サマリー、PDF 添付表示
7. `/admin` 管理者トップ
   権限付き、コンテンツ件数と運用タスクの確認

## DB 設計
`supabase/schema.sql` に初期案を用意しています。主なテーブルは次の通りです。

- `profiles`
  Supabase Auth の `auth.users` と 1:1。社員名、部署、権限を保持
- `announcements`
  トップのお知らせ
- `documents`
  マニュアル / 就業規則の共通親テーブル
- `document_tags`
  タグマスタ
- `document_tag_maps`
  文書とタグの中間テーブル
- `document_attachments`
  PDF 添付資料
- `search_synonyms`
  同義語辞書
- `popular_queries`
  よく使う検索語

## 検索仕様
- 通常検索: タイトル・本文・タグへの部分一致
- あいまい検索: 正規化テキストに対する bigram 類似度
- 同義語辞書: 例 `有給 = 有休`, `交通費 = 通勤費`
- 結果表示: タイトル、抜粋、カテゴリ、更新日
- 将来拡張: `lib/search.ts` と `/api/search` を差し替えることで AI 検索へ発展しやすい構成

## ローカル起動
```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認します。

## 環境変数
`.env.example` に最低限の想定値を置いています。  
MVP はモックデータで動きますが、本番連携時は Supabase の URL / anon key を設定してください。

## Vercel デプロイ想定
- App Router 構成
- API Route は Vercel Serverless でそのまま動作
- Supabase は環境変数だけで切り替え可能
- 文書データは将来的に Supabase Storage + Postgres へ移行しやすい分離構成
