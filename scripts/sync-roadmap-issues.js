// Sync ROADMAP.md tasks (checkbox items) into GitHub issues
// Usage in CI: runs with GITHUB_TOKEN and GITHUB_REPOSITORY
// Minimal duplicate avoidance: skip if an open issue with the same title exists

import fs from 'node:fs';
import path from 'node:path';

const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_API_URL = 'https://api.github.com' } = process.env;
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) {
  console.error('[sync-roadmap] Missing GITHUB_TOKEN or GITHUB_REPOSITORY');
  process.exit(1);
}

const [owner, repo] = GITHUB_REPOSITORY.split('/');

const roadmapPath = path.resolve(process.cwd(), 'ROADMAP.md');
if (!fs.existsSync(roadmapPath)) {
  console.error('[sync-roadmap] ROADMAP.md not found');
  process.exit(1);
}

const md = fs.readFileSync(roadmapPath, 'utf8');

// Parse sections and tasks
const lines = md.split(/\r?\n/);
let section = null;
const tasks = [];
for (const line of lines) {
  const secMatch = line.match(/^##\s+(.+)$/);
  if (secMatch) {
    section = secMatch[1].trim();
    continue;
  }
  const taskMatch = line.match(/^\s*-\s*\[( |x|X)\]\s+(.+?)\s*$/);
  if (taskMatch) {
    const done = taskMatch[1].toLowerCase() === 'x';
    const title = taskMatch[2].replace(/`/g, '').trim();
    tasks.push({ title, section, done });
  }
}

if (!tasks.length) {
  console.log('[sync-roadmap] No tasks found');
  process.exit(0);
}

const headers = {
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': '2022-11-28'
};

async function gh(path, init = {}) {
  const res = await fetch(`${GITHUB_API_URL}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`[sync-roadmap] API ${res.status} ${path}: ${txt}`);
  }
  return res.json();
}

async function listOpenIssues() {
  const out = [];
  let page = 1;
  while (page < 6) { // up to 500 issues
    const data = await gh(`/repos/${owner}/${repo}/issues?state=open&per_page=100&page=${page}`);
    if (!data.length) break;
    out.push(...data);
    page++;
  }
  return out.map(i => ({ number: i.number, title: i.title }));
}

async function createIssue({ title, section }) {
  const body = `تم إنشاء هذه التذكرة تلقائياً من ROADMAP\n\nالقسم: ${section || 'غير محدد'}\n\nانظر: [ROADMAP.md](./ROADMAP.md)`;
  const labels = ['roadmap'];
  if (section) labels.push(section);
  return gh(`/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    body: JSON.stringify({ title, body, labels })
  });
}

async function main() {
  console.log(`[sync-roadmap] Found ${tasks.length} tasks in ROADMAP.md`);
  const openIssues = await listOpenIssues();
  const openTitles = new Set(openIssues.map(i => i.title.trim()));

  let created = 0;
  for (const t of tasks) {
    if (t.done) continue; // skip completed tasks
    if (openTitles.has(t.title)) {
      console.log(`- skip (exists): ${t.title}`);
      continue;
    }
    try {
      await createIssue({ title: t.title, section: t.section });
      created++;
      console.log(`+ created: ${t.title}`);
    } catch (e) {
      console.warn(`! failed: ${t.title} -> ${e.message}`);
    }
  }
  console.log(`[sync-roadmap] Created ${created} new issues`);
}

main().catch(err => { console.error(err); process.exit(1); });