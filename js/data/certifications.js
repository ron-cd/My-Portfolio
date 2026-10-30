/**
 * certifications.js — Graph data for the SKILL TREE.
 *
 * The tree is a graph: every entry in `nodes` has a unique id, a position in a
 * 1000 × 650 logical coordinate space, and explicit `connections` (child ids).
 * Lines are drawn straight from a node to each id in its `connections`.
 *
 * Layout: the player sits at the hub (500, 325). Each branch leaves the hub on a
 * 45° diagonal to its start node, then continues along a horizontal row:
 *   NE web (y 155, going right)   SE data (y 495, going right)
 *   NW digital (y 155, going left) SW support (y 495, going left)
 * Row slots are 130 apart (x = 800, 930 on the right; 200, 70 on the left), so a
 * row holds two certifications. For more, widen TREE_SIZE.width and shift the
 * nodes; scripts/validate-data.mjs fails if a node leaves the canvas.
 *
 * IMPORTANT: connections mean "same learning branch", NOT official prerequisites.
 *
 * Node kinds
 *   root   – the player node (tree origin)
 *   branch – a category start point
 *   cert   – a certification / credential
 *
 * Cert status: 'earned' | 'in-progress' | 'planned'
 *   Only mark 'earned' for credentials you actually hold.
 *   To add a goal, copy the template at the bottom and set status: 'planned'.
 */

export const TREE_SIZE = { width: 1000, height: 650 };

export const STATUS_LABEL = {
  earned: 'EARNED',
  'in-progress': 'IN PROGRESS',
  planned: 'PLANNED',
};

export const nodes = [
  /* ── Origin ───────────────────────────────────────────── */
  { id: 'player', kind: 'root', title: 'PLAYER ONE', glyph: 'P1', x: 500, y: 325, connections: ['b-web', 'b-data', 'b-support', 'b-digital'] },

  /* ── Branch start points ──────────────────────────────── */
  { id: 'b-web', kind: 'branch', title: 'Programming & Web', short: 'CODE', glyph: '</>', x: 670, y: 155, connections: ['html-css'] },
  { id: 'b-data', kind: 'branch', title: 'Databases & Data', short: 'DATA', glyph: 'SQL', x: 670, y: 495, connections: ['databases'] },
  { id: 'b-support', kind: 'branch', title: 'IT Support & Foundations', short: 'IT', glyph: 'IT', x: 330, y: 495, connections: ['itf-plus'] },
  { id: 'b-digital', kind: 'branch', title: 'Productivity & Digital Skills', short: 'OFFICE', glyph: 'XL', x: 330, y: 155, connections: ['excel-2019'] },

  /* ── Programming & Web ────────────────────────────────── */
  {
    id: 'html-css', kind: 'cert', category: 'web', status: 'earned', glyph: '</>',
    title: 'IT Specialist: HTML and CSS',
    short: 'HTML & CSS',
    issuer: 'Pearson (Certiport)',
    date: '2026',
    description: 'Validated HTML and CSS skills across semantic markup, responsive design, and modern web development practices.',
    skills: ['HTML', 'CSS', 'Responsive design', 'Semantic markup'],
    credentialId: null,
    url: 'https://www.credly.com/badges/e119a434-625d-4192-819b-73baf8922cc1/public_url',
    x: 800, y: 155, connections: ['python-essentials-1'],
  },
  {
    id: 'python-essentials-1', kind: 'cert', category: 'web', status: 'earned', glyph: 'PY',
    title: 'Python Essentials 1',
    short: 'Python Essentials 1',
    issuer: 'Cisco Networking Academy',
    date: '2026',
    description: 'Built core Python fluency through variables, control flow, functions, collections, debugging, and hands-on programming labs.',
    skills: ['Python', 'Programming basics', 'Debugging'],
    credentialId: null,
    url: 'https://www.credly.com/badges/5b87181d-529d-4b36-8879-06582ecbc05f/public_url',
    x: 930, y: 155, connections: [],
  },

  /* ── Databases & Data ─────────────────────────────────── */
  {
    id: 'databases', kind: 'cert', category: 'data', status: 'earned', glyph: 'SQL',
    title: 'IT Specialist: Databases',
    short: 'Databases',
    issuer: 'Pearson (Certiport)',
    date: '2026',
    description: 'Demonstrated introductory database design, relational modeling, ANSI SQL querying, object management, and troubleshooting fundamentals.',
    skills: ['SQL', 'Relational design', 'Data modeling'],
    credentialId: null,
    url: 'https://www.credly.com/badges/73afb068-4de2-4f17-a7f5-192c14a73380/public_url',
    x: 800, y: 495, connections: [],
  },

  /* ── IT Support & Foundations ─────────────────────────── */
  {
    id: 'itf-plus', kind: 'cert', category: 'support', status: 'earned', glyph: 'IT+',
    title: 'CompTIA IT Fundamentals (ITF+)',
    short: 'CompTIA ITF+',
    issuer: 'CompTIA',
    date: '2025',
    description: 'Validated baseline IT knowledge across hardware, infrastructure, applications, software development, databases, and security.',
    skills: ['IT concepts', 'Infrastructure', 'Security basics'],
    credentialId: null,
    url: 'https://www.credly.com/badges/d02a66e7-5a88-4321-a5aa-5a8412f16953/public_url',
    x: 200, y: 495, connections: ['google-tsf'],
  },
  {
    id: 'google-tsf', kind: 'cert', category: 'support', status: 'earned', glyph: 'G',
    title: 'Technical Support Fundamentals',
    short: 'Google Tech Support Fundamentals',
    issuer: 'Google',
    date: null, // PLACEHOLDER: add the completion date (listed on your CV, no date on file)
    description: 'Foundations of IT support: troubleshooting methods, computer hardware, operating systems, networking basics, and customer service.',
    skills: ['Troubleshooting', 'Hardware & OS basics', 'Networking basics', 'Customer support'],
    credentialId: null,
    url: null, // PLACEHOLDER: add a public credential link if you have one
    x: 70, y: 495, connections: [],
  },

  /* ── Productivity & Digital Skills ────────────────────── */
  {
    id: 'excel-2019', kind: 'cert', category: 'digital', status: 'earned', glyph: 'XL',
    title: 'Microsoft Office Specialist: Excel Associate (Office 2019)',
    short: 'MOS Excel Associate (2019)',
    issuer: 'Microsoft',
    date: '2026',
    description: 'Validated Excel skills across formulas, data analysis, charts, workbook management, and professional spreadsheet workflows.',
    skills: ['Excel', 'Formulas', 'Data analysis', 'Charts'],
    credentialId: null,
    url: 'https://www.credly.com/badges/c090cf44-7d08-4174-8b83-d565dc8d9fae/public_url',
    x: 200, y: 155, connections: ['excel-365'],
  },
  {
    id: 'excel-365', kind: 'cert', category: 'digital', status: 'earned', glyph: 'XL',
    title: 'Microsoft Office Specialist: Excel Associate (Microsoft 365)',
    short: 'MOS Excel Associate (365)',
    issuer: 'Microsoft',
    date: '2026',
    description: 'Validated Excel skills across formulas, data analysis, charts, workbook management, and professional spreadsheet workflows.',
    skills: ['Excel', 'Formulas', 'Data analysis', 'Charts'],
    credentialId: null,
    url: 'https://www.credly.com/badges/ace2c641-3c89-4e62-bafa-2e509152cf95/public_url',
    x: 70, y: 155, connections: [],
  },

  /* ── TEMPLATE (copy, fill in, and add to a branch) ────────
  {
    id: 'my-next-goal', kind: 'cert', category: 'web', status: 'planned', glyph: '??',
    title: 'Certification name', short: 'Short label',
    issuer: 'Issuer', date: null, description: 'What it covers.',
    skills: ['Topic'], credentialId: null, url: null,
    x: 930, y: 155, connections: [],   // pick a free slot on a row (see the layout note at the top)
  },
  then add 'my-next-goal' to the previous node's `connections`.
  ─────────────────────────────────────────────────────────── */
];

/** Branch metadata used by the compact mobile list and labels. */
export const branches = [
  { id: 'b-web', label: 'Programming & Web' },
  { id: 'b-data', label: 'Databases & Data' },
  { id: 'b-support', label: 'IT Support & Foundations' },
  { id: 'b-digital', label: 'Productivity & Digital Skills' },
];
// Order = clockwise from the north-east spoke. The Q / E "swap branch" keys follow it.
