// Calculate how closely a file matches the user's search text.
// A higher value means the filename/tags are more relevant to the query.
function calculateRelevance(file, query) {
  if (!query) return 0;

  const q = query.toLowerCase().trim();
  const name = (file.filename || "").toLowerCase();
  const tags = (file.tags || []).map((tag) => String(tag).toLowerCase());

  let score = 0;

  // Exact filename is the strongest match.
  if (name === q) score += 100;
  // A filename beginning with the query is also highly relevant.
  else if (name.startsWith(q)) score += 60;
  // A query appearing anywhere in the filename is a normal match.
  else if (name.includes(q)) score += 35;

  // Tags also contribute to relevance.
  for (const tag of tags) {
    if (tag === q) score += 50;
    else if (tag.includes(q)) score += 25;
  }

  return score;
}

// Calculate the final ranking score used for search results.
// The score combines text relevance, popularity and file recency.
function calculateScore(file, query) {
  // 1. Filename/tag relevance.
  const relevance = calculateRelevance(file, query);

  // 2. Popularity based on views.
  // log10 prevents files with thousands of views from completely dominating
  // the relevance score. The contribution is capped at 25 points.
  const popularity = Math.min(Math.log10((file.viewCount || 0) + 1) * 10, 25);

  // 3. Calculate how many days old the file is.
  const ageDays = Math.max(
    0,
    (Date.now() - new Date(file.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // 4. Newer files receive more points. The maximum is 20 points and the
  // recency contribution reaches zero after 20 days.
  const recency = Math.max(0, 20 - Math.min(ageDays, 20));

  // 5. Combine all three factors and round the result to two decimals.
  return Number((relevance + popularity + recency).toFixed(2));
}

module.exports = { calculateRelevance, calculateScore };
