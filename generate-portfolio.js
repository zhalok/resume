#!/usr/bin/env node
// Generates portfolio/index.html from resume.json

const fs = require('fs');
const path = require('path');

const resumePath = path.join(__dirname, 'resume.json');
const outPath = path.join(__dirname, 'portfolio', 'index.html');

const resume = JSON.parse(fs.readFileSync(resumePath, 'utf8'));

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Converts **bold** markdown to <strong>, after escaping the rest of the text.
const md = (s) => {
  const parts = String(s).split(/(\*\*[^*]+\*\*)/g);
  return parts
    .map((p) => {
      const m = p.match(/^\*\*([^*]+)\*\*$/);
      return m ? `<strong>${esc(m[1])}</strong>` : esc(p);
    })
    .join('');
};

const shown = (item) => item.show !== false;

const fieldsToShow = new Set(resume.fields_to_show_portfolio || []);

const formatDate = (d) => {
  if (!d) return '';
  const [y, m] = d.split('-');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
};

const dateRange = (job) =>
  `${formatDate(job.startDate)} — ${job.endDate ? formatDate(job.endDate) : 'Present'}`;

const eduDateRange = (edu) =>
  `${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}`;

// --- basics ---
const { basics } = resume;

const profilePills = (basics.profiles || [])
  .map(
    (p) =>
      `<a class="pill" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(
        p.network.toLowerCase()
      )}: ${esc(p.url.replace(/\/$/, '').split('/').pop())}</a>`
  )
  .join('\n      ');

const contactPills = [
  `<a class="pill" href="mailto:${esc(basics.email)}">✉ ${esc(basics.email)}</a>`,
  basics.phone ? `<a class="pill" href="tel:${esc(basics.phone)}">☎ ${esc(basics.phone)}</a>` : '',
  profilePills,
  basics.video_introduction
    ? `<a class="pill" href="${esc(basics.video_introduction)}" target="_blank" rel="noopener">▶ Video Introduction</a>`
    : '',
]
  .filter(Boolean)
  .join('\n      ');

// --- skills ---
const skillsHtml = fieldsToShow.has('skills')
  ? (resume.skills || [])
      .filter(shown)
      .map((s) => `      <span class="skill-chip">${esc(s.name)}</span>`)
      .join('\n')
  : '';

// --- experience ---
const workHtml = fieldsToShow.has('work')
  ? (resume.work || [])
      .filter(shown)
      .map(
        (job) => `    <div class="job">
      <div class="job-meta">
        <div class="company">${esc(job.name)}</div>
        <div class="dates">${dateRange(job)}</div>
      </div>
      <div class="job-body">
        <h3>${esc(job.position)}</h3>
        <ul>
${(job.highlights || []).map((h) => `          <li>${md(h)}</li>`).join('\n')}
        </ul>
      </div>
    </div>`
      )
      .join('\n\n')
  : '';

// --- education ---
const educationHtml = fieldsToShow.has('education')
  ? (resume.education || [])
      .filter(shown)
      .map(
        (edu) => `    <div class="edu-item">
      <h3>${esc(edu.studyType)} in ${esc(edu.area)}</h3>
      <div class="sub">${esc(edu.institution)} · ${eduDateRange(edu)}</div>
    </div>`
      )
      .join('\n')
  : '';

// --- publications ---
const publicationsHtml = fieldsToShow.has('publications')
  ? (resume.publications || [])
      .filter(shown)
      .map(
        (pub) => `    <div class="pub-item">
      <h3><a href="${esc(pub.url)}" target="_blank" rel="noopener">${esc(pub.name)}</a></h3>
      <div class="sub">${esc(pub.publisher)} · ${esc(pub.releaseDate)}</div>
      <ul>
${(pub.contributions || [])
  .map((c) => {
    const demoMatch = c.match(/^demo:\s*(\S+)/i);
    if (demoMatch) {
      return `        <li>Demo: <a href="${esc(demoMatch[1])}" target="_blank" rel="noopener">${esc(
        demoMatch[1].replace(/^https?:\/\//, '')
      )}</a></li>`;
    }
    return `        <li>${md(c)}</li>`;
  })
  .join('\n')}
      </ul>
    </div>`
      )
      .join('\n\n')
  : '';

// --- certificates ---
const certificatesHtml = fieldsToShow.has('certificates')
  ? (resume.certificates || [])
      .filter(shown)
      .map(
        (cert) => `    <div class="cert-item">
      <h3><a href="${esc(cert.url)}" target="_blank" rel="noopener">${esc(cert.name)}</a></h3>
      <div class="issuer">${esc(cert.issuer)}</div>
      <p>${esc(cert.summary)}</p>
    </div>`
      )
      .join('\n')
  : '';

// --- blogs ---
const blogsHtml = fieldsToShow.has('blogs')
  ? (resume.blogs || [])
      .filter(shown)
      .map(
        (blog) => `    <div class="blog-item">
      <h3><a href="${esc(blog.link)}" target="_blank" rel="noopener">${esc(blog.title)}</a></h3>
      <p>${esc(blog.summary)}</p>
    </div>`
      )
      .join('\n')
  : '';

// --- projects ---
const projectsHtml = fieldsToShow.has('projects')
  ? (resume.projects || [])
      .filter(shown)
      .map(
        (proj) => `    <div class="project-item">
      <h3><a href="${esc(proj.url)}" target="_blank" rel="noopener">${esc(proj.name)}</a></h3>
      <div class="stack">${(proj.stack || []).map((s) => esc(s)).join(' · ')}</div>
${proj.description ? `      <p class="desc">${esc(proj.description)}</p>\n` : ''}      <ul>
${(proj.contributions || [])
  .map((c) => {
    const demoMatch = c.match(/^demo:\s*(\S+)/i);
    if (demoMatch) {
      return `        <li>Demo: <a href="${esc(demoMatch[1])}" target="_blank" rel="noopener">${esc(
        demoMatch[1].replace(/^https?:\/\//, '')
      )}</a></li>`;
    }
    return `        <li>${md(c)}</li>`;
  })
  .join('\n')}
      </ul>
    </div>`
      )
      .join('\n\n')
  : '';

const sectionBuilders = {
  skills: () =>
    skillsHtml &&
    `<section id="skills">
  <div class="wrap">
    <h2>Skills</h2>
    <div class="skills-grid">
${skillsHtml}
    </div>
  </div>
</section>`,
  work: () =>
    workHtml &&
    `<section id="experience">
  <div class="wrap">
    <h2>Experience</h2>

${workHtml}

  </div>
</section>`,
  education: () =>
    educationHtml &&
    `<section id="education">
  <div class="wrap">
    <h2>Education</h2>
${educationHtml}
  </div>
</section>`,
  publications: () =>
    publicationsHtml &&
    `<section id="publications">
  <div class="wrap">
    <h2>Publications</h2>

${publicationsHtml}

  </div>
</section>`,
  certificates: () =>
    certificatesHtml &&
    `<section id="certificates">
  <div class="wrap">
    <h2>Certificates</h2>
${certificatesHtml}
  </div>
</section>`,
  blogs: () =>
    blogsHtml &&
    `<section id="blogs">
  <div class="wrap">
    <h2>Blogs</h2>
${blogsHtml}
  </div>
</section>`,
  projects: () =>
    projectsHtml &&
    `<section id="projects">
  <div class="wrap">
    <h2>Projects</h2>

${projectsHtml}

  </div>
</section>`,
};

const sections = (resume.fields_to_show_portfolio || [])
  .map((field) => sectionBuilders[field] && sectionBuilders[field]())
  .filter(Boolean)
  .join('\n\n');

const year = new Date().getFullYear();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(basics.name)} — Software Engineer</title>
<style>
  :root {
    --bg: #0b0d12;
    --bg-alt: #12151c;
    --card: #161a23;
    --border: #262b36;
    --text: #e7e9ee;
    --text-dim: #9aa1b0;
    --accent: #7c9cff;
    --accent-soft: rgba(124,156,255,0.12);
    --mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  }
  @media (prefers-color-scheme: light) {
    :root {
      --bg: #f7f8fa;
      --bg-alt: #ffffff;
      --card: #ffffff;
      --border: #e3e6ec;
      --text: #1a1d24;
      --text-dim: #5b6270;
      --accent: #3a5fe0;
      --accent-soft: rgba(58,95,224,0.08);
    }
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
  }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .wrap { max-width: 880px; margin: 0 auto; padding: 0 24px; }

  header.hero {
    padding: 96px 0 56px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, var(--accent-soft), transparent 60%);
  }
  header.hero .eyebrow {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--accent);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  header.hero h1 {
    font-size: clamp(2rem, 5vw, 3.2rem);
    margin: 0 0 8px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  header.hero .label {
    font-size: 1.15rem;
    color: var(--text-dim);
    margin-bottom: 28px;
  }
  header.hero .summary {
    max-width: 640px;
    font-size: 1rem;
    color: var(--text-dim);
    margin: -12px 0 28px;
  }
  .contact-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 0.88rem;
    color: var(--text);
    background: var(--bg-alt);
  }
  .pill:hover { border-color: var(--accent); text-decoration: none; }

  section { padding: 56px 0; border-bottom: 1px solid var(--border); }
  section:last-of-type { border-bottom: none; }
  section h2 {
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent);
    font-family: var(--mono);
    margin: 0 0 32px;
  }

  .skills-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .skill-chip {
    padding: 8px 14px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.86rem;
    color: var(--text-dim);
  }

  .job {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 24px;
    margin-bottom: 44px;
  }
  .job:last-child { margin-bottom: 0; }
  .job-meta { color: var(--text-dim); font-size: 0.88rem; }
  .job-meta .company { color: var(--text); font-weight: 600; font-size: 1rem; margin-bottom: 4px; }
  .job-meta .dates { font-family: var(--mono); font-size: 0.8rem; }
  .job-body h3 { margin: 0 0 12px; font-size: 1.05rem; font-weight: 600; }
  .job-body ul { margin: 0; padding-left: 20px; }
  .job-body li { margin-bottom: 8px; color: var(--text-dim); font-size: 0.94rem; }
  .job-body li strong { color: var(--text); font-weight: 600; }

  @media (max-width: 640px) {
    .job { grid-template-columns: 1fr; gap: 8px; }
  }

  .edu-item, .cert-item, .pub-item, .blog-item, .project-item {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 16px;
  }
  .edu-item:last-child, .cert-item:last-child, .pub-item:last-child, .blog-item:last-child, .project-item:last-child { margin-bottom: 0; }
  .edu-item h3, .pub-item h3, .blog-item h3, .project-item h3 { margin: 0 0 4px; font-size: 1.02rem; }
  .edu-item .sub, .pub-item .sub { color: var(--text-dim); font-size: 0.88rem; }
  .blog-item p { margin: 8px 0 0; font-size: 0.9rem; color: var(--text-dim); }
  .pub-item ul, .project-item ul { margin: 12px 0 0; padding-left: 20px; }
  .pub-item li, .project-item li { font-size: 0.9rem; color: var(--text-dim); margin-bottom: 6px; }
  .project-item .desc { margin: 8px 0 0; font-size: 0.9rem; color: var(--text-dim); }
  .project-item .stack { font-family: var(--mono); font-size: 0.8rem; color: var(--accent); margin-top: 4px; }

  .cert-item h3 { margin: 0 0 4px; font-size: 1rem; }
  .cert-item .issuer { font-family: var(--mono); font-size: 0.8rem; color: var(--accent); margin-bottom: 8px; }
  .cert-item p { margin: 0; font-size: 0.9rem; color: var(--text-dim); }

  footer {
    padding: 40px 0 80px;
    text-align: center;
    color: var(--text-dim);
    font-size: 0.85rem;
  }
</style>
</head>
<body>

<header class="hero">
  <div class="wrap">
    <div class="eyebrow">Portfolio</div>
    <h1>${esc(basics.name)}</h1>
    <div class="label">${esc(basics.label)}</div>
    ${basics.summary ? `<p class="summary">${esc(basics.summary)}</p>` : ''}
    <div class="contact-row">
      ${contactPills}
    </div>
  </div>
</header>

${sections}

<footer>
  <div class="wrap">
    © ${year} ${esc(basics.name)}
  </div>
</footer>

</body>
</html>
`;

fs.writeFileSync(outPath, html);
console.log(`Generated ${outPath}`);
