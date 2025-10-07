// Create a classic GitHub Project board for this repository and populate it with roadmap issues
// Requires: GITHUB_TOKEN, GITHUB_REPOSITORY

const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_API_URL = 'https://api.github.com' } = process.env;
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) {
  console.error('[setup-board] Missing GITHUB_TOKEN or GITHUB_REPOSITORY');
  process.exit(1);
}

const [owner, repo] = GITHUB_REPOSITORY.split('/');

const headers = {
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.inertia-preview+json', // Projects API
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': '2022-11-28'
};

async function gh(path, init = {}) {
  const res = await fetch(`${GITHUB_API_URL}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`[setup-board] API ${res.status} ${path}: ${txt}`);
  }
  return res.json();
}

async function getOrCreateProject(name = 'Roadmap Board') {
  // list existing projects
  const projects = await gh(`/repos/${owner}/${repo}/projects`);
  const existing = projects.find(p => p.name === name);
  if (existing) return existing;
  return gh(`/repos/${owner}/${repo}/projects`, {
    method: 'POST',
    body: JSON.stringify({ name, body: 'لوحة لإدارة مهام ROADMAP' })
  });
}

async function getOrCreateColumn(projectId, columnName) {
  const cols = await gh(`/projects/${projectId}/columns`);
  const found = cols.find(c => c.name === columnName);
  if (found) return found;
  return gh(`/projects/${projectId}/columns`, {
    method: 'POST',
    body: JSON.stringify({ name: columnName })
  });
}

async function listRoadmapIssues() {
  // Fetch open issues labeled 'roadmap'
  const issues = [];
  let page = 1;
  while (page < 6) {
    const batch = await gh(`/repos/${owner}/${repo}/issues?state=open&labels=${encodeURIComponent('roadmap')}&per_page=100&page=${page}`);
    if (!batch.length) break;
    issues.push(...batch);
    page++;
  }
  // Filter PRs out (issues API can include PRs)
  return issues.filter(i => !i.pull_request).map(i => ({ id: i.id, number: i.number, title: i.title }));
}

async function listColumnCards(columnId) {
  const cards = await gh(`/projects/columns/${columnId}/cards`);
  return cards;
}

async function addIssueCard(columnId, issueId) {
  return gh(`/projects/columns/${columnId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ content_id: issueId, content_type: 'Issue' })
  });
}

async function main() {
  console.log('[setup-board] Creating or locating project board...');
  const project = await getOrCreateProject('Roadmap Board');
  console.log(`[setup-board] Project: ${project.name} (#${project.id})`);

  console.log('[setup-board] Creating columns (Backlog, Doing, Done) if missing...');
  const backlog = await getOrCreateColumn(project.id, 'Backlog');
  await getOrCreateColumn(project.id, 'Doing');
  await getOrCreateColumn(project.id, 'Done');

  console.log('[setup-board] Fetching roadmap issues...');
  const issues = await listRoadmapIssues();
  console.log(`[setup-board] Found ${issues.length} roadmap issues`);

  console.log('[setup-board] Fetching existing cards to avoid duplicates...');
  const existingCards = await listColumnCards(backlog.id);
  const existingIssueIds = new Set(existingCards.filter(c => c.content_url?.includes('/issues/')).map(c => Number(c.content_url.split('/').pop())));

  let added = 0;
  for (const issue of issues) {
    if (existingIssueIds.has(issue.number)) continue;
    try {
      await addIssueCard(backlog.id, issue.id);
      added++;
      console.log(`+ added to Backlog: #${issue.number} ${issue.title}`);
    } catch (e) {
      console.warn(`! failed to add card for #${issue.number}: ${e.message}`);
    }
  }
  console.log(`[setup-board] Added ${added} new cards to Backlog`);
}

main().catch(err => { console.error(err); process.exit(1); });