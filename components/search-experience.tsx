"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { authFetch } from "../lib/auth-client";
import type { PortalCategory, SearchResult } from "../types/portal";

type SearchResponse = {
  query: string;
  total: number;
  results: SearchResult[];
  error?: string;
};

type Props = {
  popularQueries: string[];
};

export function SearchExperience({ popularQueries }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PortalCategory | "all">("all");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void runSearch("有給の取り方", "all");
  }, []);

  async function runSearch(nextQuery: string, nextCategory: PortalCategory | "all") {
    const trimmed = nextQuery.trim();
    setQuery(nextQuery);

    if (!trimmed) {
      setResults([]);
      setSearchedQuery("");
      return;
    }

    const response = await authFetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: trimmed,
        category: nextCategory
      })
    });

    const data = (await response.json()) as SearchResponse;

    if (!response.ok) {
      throw new Error(data.error ?? "検索に失敗しました。");
    }

    setResults(data.results);
    setSearchedQuery(data.query);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      void runSearch(query, selectedCategory);
    });
  }

  function handlePopularQuery(value: string) {
    startTransition(() => {
      void runSearch(value, selectedCategory);
    });
  }

  function handleCategoryChange(value: PortalCategory | "all") {
    setSelectedCategory(value);
    startTransition(() => {
      void runSearch(query, value);
    });
  }

  return (
    <section className="search-panel">
      <div className="search-grid">
        <div className="search-main">
          <div className="page-heading">
            <div>
              <p className="section-label">検索</p>
              <h2>必要な情報をすぐに見つける</h2>
            </div>
            <span className="muted-text">通常検索 + あいまい検索 + 同義語辞書</span>
          </div>

          <form className="search-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="portal-search">
              検索キーワード
            </label>
            <input
              id="portal-search"
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例: 有給の取り方 / 交通費の精算方法 / 在宅勤務の申請"
            />

            <div className="search-actions">
              <button type="submit" className="submit-button" disabled={isPending || !query.trim()}>
                {isPending ? "検索中..." : "検索する"}
              </button>
              <select
                className="select-input"
                value={selectedCategory}
                onChange={(event) => handleCategoryChange(event.target.value as PortalCategory | "all")}
                aria-label="カテゴリで絞り込む"
              >
                <option value="all">すべて</option>
                <option value="manual">マニュアル</option>
                <option value="rule">就業規則</option>
              </select>
            </div>
          </form>

          <div>
            <p className="search-summary">よく使う検索語</p>
            <div className="chip-row">
              {popularQueries.map((term) => (
                <button key={term} type="button" className="chip-button" onClick={() => handlePopularQuery(term)}>
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className="search-results">
            {searchedQuery ? (
              <p className="search-summary">「{searchedQuery}」の検索結果: {results.length} 件</p>
            ) : (
              <p className="search-summary">検索語を入力すると結果が表示されます。</p>
            )}

            {results.length > 0 ? (
              results.map((result) => (
                <article key={result.id} className="search-result-card">
                  <div className="result-headline">
                    <div>
                      <div className="result-meta">
                        <span className={result.category === "manual" ? "result-category is-manual" : "result-category is-rule"}>
                          {result.category === "manual" ? "マニュアル" : "就業規則"}
                        </span>
                        <span>更新日 {result.updatedAt}</span>
                      </div>
                      <h3>{result.title}</h3>
                    </div>
                    <Link
                      href={result.category === "manual" ? `/manuals/${result.slug}` : `/rules/${result.slug}`}
                      className="ghost-link"
                    >
                      詳細を見る
                    </Link>
                  </div>
                  <p>{result.excerpt}</p>
                  <div className="search-tags">
                    {result.tags.map((tag) => (
                      <span key={`${result.id}-${tag}`} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            ) : searchedQuery ? (
              <div className="empty-state">
                <strong>該当する文書が見つかりませんでした。</strong>
                <p>言い換えや短いキーワードでも検索できます。例: 「有休」「通勤費」「在宅」</p>
              </div>
            ) : (
              <div className="empty-state">
                <strong>自然な日本語で検索できます。</strong>
                <p>例: 「有給の取り方」「交通費の精算」「在宅勤務の申請手順」</p>
              </div>
            )}
          </div>
        </div>

        <aside className="surface-panel">
          <div className="section-heading">
            <div>
              <p className="section-label">検索の特長</p>
              <h2>MVP の仕様</h2>
            </div>
          </div>

          <div className="document-list">
            <div className="document-list-card">
              <h3>通常検索</h3>
              <p>タイトル、本文、タグを横断して部分一致検索します。</p>
            </div>
            <div className="document-list-card">
              <h3>あいまい検索</h3>
              <p>表記ゆれや少し曖昧な入力にも対応できるよう、類似度スコアを使っています。</p>
            </div>
            <div className="document-list-card">
              <h3>同義語辞書</h3>
              <p>有給 = 有休、交通費 = 通勤費 など、社内でよくある言い換えに対応します。</p>
            </div>
            <div className="document-list-card">
              <h3>AI 検索を見据えた構成</h3>
              <p>検索 UI と検索 API を分離しているため、将来的にベクトル検索や生成 AI に差し替えやすい設計です。</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
