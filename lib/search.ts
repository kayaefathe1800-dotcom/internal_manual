import { portalDocuments } from "../data/portal-content";
import type { PortalCategory, PortalDocument, SearchResult } from "../types/portal";

const synonymDictionary: Record<string, string[]> = {
  有給: ["有休", "休暇"],
  有休: ["有給", "休暇"],
  交通費: ["通勤費", "旅費"],
  通勤費: ["交通費"],
  遅刻: ["遅刻連絡", "始業遅れ"],
  セットアップ: ["初期設定", "キッティング"],
  在宅勤務: ["リモートワーク", "在宅"],
  経費: ["精算", "立替"]
};

function normalizeText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[。、・（）()「」『』【】［］]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandTerms(query: string) {
  const baseTokens = normalizeText(query)
    .split(" ")
    .filter(Boolean);

  const expanded = new Set<string>(baseTokens);

  for (const token of baseTokens) {
    const matchedKey = Object.keys(synonymDictionary).find((key) => normalizeText(key) === token);
    if (!matchedKey) {
      continue;
    }

    synonymDictionary[matchedKey].forEach((word) => expanded.add(normalizeText(word)));
  }

  if (baseTokens.length > 0) {
    expanded.add(baseTokens.join(""));
  }

  return [...expanded];
}

function bigrams(value: string) {
  const cleaned = normalizeText(value).replace(/\s+/g, "");

  if (cleaned.length <= 1) {
    return [cleaned];
  }

  const grams: string[] = [];

  for (let index = 0; index < cleaned.length - 1; index += 1) {
    grams.push(cleaned.slice(index, index + 2));
  }

  return grams;
}

function diceCoefficient(left: string, right: string) {
  const leftBigrams = bigrams(left);
  const rightBigrams = bigrams(right);

  if (leftBigrams.length === 0 || rightBigrams.length === 0) {
    return 0;
  }

  let overlap = 0;
  const remaining = [...rightBigrams];

  leftBigrams.forEach((gram) => {
    const matchIndex = remaining.indexOf(gram);
    if (matchIndex >= 0) {
      overlap += 1;
      remaining.splice(matchIndex, 1);
    }
  });

  return (2 * overlap) / (leftBigrams.length + rightBigrams.length);
}

function createExcerpt(document: PortalDocument, query: string) {
  const body = document.body.replace(/\s+/g, " ");
  const normalizedBody = normalizeText(body);
  const normalizedQuery = normalizeText(query).replace(/\s+/g, "");
  const hitIndex = normalizedBody.indexOf(normalizedQuery);

  if (hitIndex >= 0) {
    const start = Math.max(0, hitIndex - 28);
    return `${body.slice(start, start + 110).trim()}...`;
  }

  return `${body.slice(0, 110).trim()}...`;
}

function scoreDocument(document: PortalDocument, query: string) {
  const expandedTerms = expandTerms(query);
  const title = normalizeText(document.title);
  const body = normalizeText(document.body);
  const tags = normalizeText(document.tags.join(" "));
  const summary = normalizeText(document.summary);
  const merged = `${title} ${summary} ${body} ${tags}`;

  let score = 0;

  for (const term of expandedTerms) {
    if (!term) {
      continue;
    }

    if (title.includes(term)) {
      score += 48;
    }

    if (summary.includes(term)) {
      score += 22;
    }

    if (body.includes(term)) {
      score += 18;
    }

    if (tags.includes(term)) {
      score += 24;
    }

    score += Math.round(diceCoefficient(term, merged) * 30);
  }

  score += Math.round(diceCoefficient(query, document.title) * 24);
  score += Math.round(diceCoefficient(query, document.summary) * 18);
  score += Math.round(diceCoefficient(query, document.tags.join(" ")) * 16);

  return score;
}

export function searchDocuments(query: string, category?: PortalCategory) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return [];
  }

  return portalDocuments
    .filter((document) => (category ? document.category === category : true))
    .map((document) => {
      const score = scoreDocument(document, normalizedQuery);

      return {
        id: document.id,
        slug: document.slug,
        title: document.title,
        excerpt: createExcerpt(document, normalizedQuery),
        category: document.category,
        updatedAt: document.updatedAt,
        tags: document.tags,
        score
      } satisfies SearchResult;
    })
    .filter((result) => result.score >= 20)
    .sort((left, right) => right.score - left.score || right.updatedAt.localeCompare(left.updatedAt));
}

export function getDocumentBySlug(slug: string) {
  return portalDocuments.find((document) => document.slug === slug) ?? null;
}

export function getDocumentsByCategory(category: PortalCategory) {
  return portalDocuments
    .filter((document) => document.category === category)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getDocumentStats(documents: PortalDocument[]) {
  return {
    total: documents.length,
    manuals: documents.filter((document) => document.category === "manual").length,
    rules: documents.filter((document) => document.category === "rule").length
  };
}

export function getSynonymEntries() {
  return Object.entries(synonymDictionary);
}
