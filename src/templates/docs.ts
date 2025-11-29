/**
 * Documentation page templates with Tailwind CSS
 * Content is separated into /src/content/ files
 */

import {
  homeContent,
  lastfmChartContent,
  lastfmLastPlayedContent,
  trmnlGridContent,
  trmnlLastPlayedContent,
  trmnlStatsContent,
} from '../content';

// Types for content structures
interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface Parameter {
  name: string;
  description: string;
  default?: string;
  optional?: boolean;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Example {
  title: string;
  code: string;
  imageSrc?: string;
  imageAlt?: string;
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/docs/lastfm-chart', label: 'Charts', icon: '📊' },
  { href: '/docs/lastfm-last-played', label: 'Last Played', icon: '🎵' },
  { href: '/docs/trmnl-lastfm-grid', label: 'TRMNL Grid', icon: '🖼️' },
  { href: '/docs/trmnl-lastfm-last-played', label: 'TRMNL Last Played', icon: '📱' },
  { href: '/docs/trmnl-lastfm-stats', label: 'TRMNL Stats', icon: '📈' },
];

// ============================================================================
// Base Layout
// ============================================================================

function renderLayout(title: string, description: string, content: string, isHome = false): string {
  const currentPath = isHome ? '/' : '';

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Russ Rest API</title>
  <meta name="description" content="${description}">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            lastfm: {
              red: '#d51007',
              dark: '#1a1a1a',
            }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    body { font-family: 'Inter', sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
  ${renderHeader(currentPath)}
  <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
    ${content}
  </main>
  ${renderFooter()}
</body>
</html>`;
}

function renderHeader(currentPath: string): string {
  return `
  <header class="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <a href="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 bg-gradient-to-br from-lastfm-red to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">
            <span class="text-white text-xl">🎵</span>
          </div>
          <div>
            <span class="font-bold text-slate-900 text-lg">Russ Rest</span>
            <span class="hidden sm:inline text-slate-400 text-sm ml-2">API</span>
          </div>
        </a>
        <nav class="hidden md:flex items-center gap-1">
          ${navLinks.map(link => `
            <a href="${link.href}" class="px-3 py-2 rounded-lg text-sm font-medium ${currentPath === link.href ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'} transition-colors">
              ${link.label}
            </a>
          `).join('')}
        </nav>
        <a href="https://github.com/russmckendrick/russ-rest" target="_blank" rel="noopener" class="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          <span class="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </div>
    <nav class="md:hidden border-t border-slate-200 px-4 py-2 flex gap-2 overflow-x-auto">
      ${navLinks.map(link => `
        <a href="${link.href}" class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${currentPath === link.href ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'} transition-colors">
          ${link.icon} ${link.label}
        </a>
      `).join('')}
    </nav>
  </header>`;
}

function renderFooter(): string {
  return `
  <footer class="border-t border-slate-200 bg-white mt-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2 text-slate-600">
          <span>Built with</span>
          <span class="text-red-500">❤️</span>
          <span>by</span>
          <a href="https://github.com/russmckendrick" class="font-medium text-slate-900 hover:text-lastfm-red transition-colors">Russ McKendrick</a>
        </div>
        <div class="flex items-center gap-6 text-sm text-slate-500">
          <a href="https://github.com/russmckendrick/russ-rest" class="hover:text-slate-900 transition-colors">Source Code</a>
          <a href="https://last.fm/user/RussMckendrick" class="hover:text-slate-900 transition-colors">Last.fm</a>
        </div>
      </div>
    </div>
  </footer>`;
}

// ============================================================================
// Component Renderers
// ============================================================================

function renderParametersTable(parameters: Parameter[]): string {
  return `
    <div class="mb-8">
      <h2 class="text-xl font-bold text-slate-900 mb-4">Parameters</h2>
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-6 py-3 text-sm font-semibold text-slate-900">Parameter</th>
              <th class="text-left px-6 py-3 text-sm font-semibold text-slate-900">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${parameters.map(p => `
              <tr>
                <td class="px-6 py-4"><code class="bg-slate-100 px-2 py-1 rounded text-sm">${p.name}</code></td>
                <td class="px-6 py-4 text-slate-600">
                  ${p.description}
                  ${p.default ? `<span class="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">default: ${p.default}</span>` : ''}
                  ${p.optional ? `<span class="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">optional</span>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderFeaturesGrid(features: Feature[]): string {
  return `
    <div class="mb-8">
      <h2 class="text-xl font-bold text-slate-900 mb-4">Features</h2>
      <div class="grid sm:grid-cols-2 gap-4">
        ${features.map(f => `
          <div class="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-4">
            <span class="text-xl">${f.icon}</span>
            <div>
              <div class="font-medium text-slate-900">${f.title}</div>
              <div class="text-sm text-slate-500">${f.description}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function renderExamples(examples: Example[]): string {
  return `
    <div class="mb-8">
      <h2 class="text-xl font-bold text-slate-900 mb-4">Examples</h2>
      <div class="space-y-6">
        ${examples.map(ex => `
          <div>
            <h3 class="font-semibold text-slate-900 mb-3">${ex.title}</h3>
            <div class="bg-slate-900 rounded-xl p-4 mb-4 overflow-x-auto">
              <code class="text-emerald-400 text-sm">${escapeHtml(ex.code)}</code>
            </div>
            ${ex.imageSrc ? `
              <div class="bg-white rounded-xl border border-slate-200 p-4">
                <img src="${ex.imageSrc}" alt="${ex.imageAlt || ''}" class="w-full rounded-lg">
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
}

function renderGithubUsage(title: string, code: string): string {
  return `
    <div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8">
      <h2 class="text-xl font-bold text-white mb-4">${title}</h2>
      <div class="bg-slate-800 rounded-xl p-4 overflow-x-auto">
        <code class="text-emerald-400 text-sm">${escapeHtml(code).replace('YourUsername', '<span class="text-amber-400">YourUsername</span>')}</code>
      </div>
    </div>`;
}

function renderTrmnlSetup(steps: string[]): string {
  return `
    <div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8">
      <h2 class="text-xl font-bold text-white mb-4">🖥️ TRMNL Setup</h2>
      <ol class="space-y-3 text-slate-300">
        ${steps.map((step, i) => `
          <li class="flex gap-3">
            <span class="flex-shrink-0 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium">${i + 1}</span>
            <span>${step.replace(/(https:\/\/[^\s]+)/g, '<code class="bg-slate-800 px-2 py-0.5 rounded text-emerald-400">$1</code>')}</span>
          </li>
        `).join('')}
      </ol>
    </div>`;
}

function renderPreview(url: string, linkHref: string, linkText: string): string {
  return `
    <div class="mb-8">
      <h2 class="text-xl font-bold text-slate-900 mb-4">Preview</h2>
      <div class="bg-slate-900 rounded-xl p-4 mb-4 overflow-x-auto">
        <code class="text-emerald-400 text-sm">${url}</code>
      </div>
      <a href="${linkHref}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
        ${linkText} <span>→</span>
      </a>
    </div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================================================
// Page Renderers
// ============================================================================

export function renderDocPage(page: { title: string; description: string; content: string; isHome?: boolean }): string {
  return renderLayout(page.title, page.description, page.content, page.isHome);
}

export function renderHomePage(): string {
  const c = homeContent;

  const content = `
    <!-- Hero -->
    <div class="text-center mb-12">
      <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">${c.hero.headline}</h1>
      <p class="text-lg text-slate-600 max-w-xl mx-auto mb-6">${c.hero.subheadline}</p>
      <div class="flex items-center justify-center gap-3">
        <a href="${c.hero.primaryCta.href}" class="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
          ${c.hero.primaryCta.label}
        </a>
        <a href="${c.hero.secondaryCta.href}" class="px-5 py-2.5 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
          ${c.hero.secondaryCta.label}
        </a>
      </div>
    </div>

    <!-- Live Preview -->
    <div class="mb-12 bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-2.5 h-2.5 rounded-full bg-red-400"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-green-400"></div>
        <span class="ml-2 text-xs text-slate-400 font-mono">${c.livePreview.label}</span>
      </div>
      <img src="${c.livePreview.imageSrc}" alt="${c.livePreview.imageAlt}" class="w-full rounded-lg">
    </div>

    <!-- Endpoints Grid -->
    <div id="endpoints" class="mb-12">
      <h2 class="text-xl font-semibold text-slate-900 mb-6">Endpoints</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${c.endpoints.map(ep => `
          <a href="${ep.docsPath}" class="group bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-2">
              <span class="text-xl">${ep.icon}</span>
              <span class="px-2 py-0.5 ${ep.badge.color} rounded text-xs font-medium">${ep.badge.label}</span>
            </div>
            <h3 class="font-medium text-slate-900 mb-1">${ep.title}</h3>
            <code class="text-xs text-slate-500 font-mono">${ep.path}</code>
            <p class="text-slate-600 text-sm mt-2">${ep.description}</p>
          </a>
        `).join('')}
      </div>
    </div>

    <!-- Quick Start -->
    <div class="mb-12">
      <h2 class="text-xl font-semibold text-slate-900 mb-4">${c.quickStart.title}</h2>
      <div class="bg-slate-800 rounded-lg p-4">
        <p class="text-slate-400 text-sm mb-3">${c.quickStart.description}</p>
        <div class="bg-slate-900 rounded p-3 overflow-x-auto">
          <code class="text-emerald-400 text-sm">${c.quickStart.example.replace('YourUsername', '<span class="text-amber-400">YourUsername</span>')}</code>
        </div>
        <p class="text-slate-500 text-xs mt-3">${c.quickStart.note}</p>
      </div>
    </div>

    <!-- Tech Stack -->
    <div>
      <h2 class="text-xl font-semibold text-slate-900 mb-4">Built With</h2>
      <div class="flex flex-wrap gap-3">
        ${c.techStack.map(tech => `
          <div class="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-2">
            <span class="text-lg">${tech.icon}</span>
            <span class="text-sm font-medium text-slate-700">${tech.name}</span>
            <span class="text-xs text-slate-400">${tech.detail}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  return renderLayout(c.title, c.description, content, true);
}

export function renderLastfmChartDocs(): string {
  const c = lastfmChartContent;

  const content = `
    <!-- Page Header -->
    <div class="mb-12">
      <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <a href="/" class="hover:text-slate-900">Home</a>
        <span>/</span>
        <span class="text-slate-900">${c.breadcrumb}</span>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 bg-gradient-to-br ${c.gradient} rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg ${c.shadowColor}">
          ${c.icon}
        </div>
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900">${c.title}</h1>
          <p class="text-slate-600 mt-1">${c.description}</p>
        </div>
      </div>
    </div>

    <!-- Endpoint -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
      <div class="flex items-center gap-3 mb-4">
        <span class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">${c.endpoint.method}</span>
        <code class="text-lg font-mono text-slate-900">${c.endpoint.path}</code>
      </div>
      <p class="text-slate-600">${c.endpoint.description}</p>
    </div>

    ${renderParametersTable(c.parameters)}
    ${renderFeaturesGrid(c.features)}
    ${renderExamples(c.examples)}
    ${renderGithubUsage(c.githubUsage.title, c.githubUsage.code)}
  `;

  return renderLayout(c.title, c.description, content);
}

export function renderLastfmLastPlayedDocs(): string {
  const c = lastfmLastPlayedContent;

  const content = `
    <!-- Page Header -->
    <div class="mb-12">
      <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <a href="/" class="hover:text-slate-900">Home</a>
        <span>/</span>
        <span class="text-slate-900">${c.breadcrumb}</span>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 bg-gradient-to-br ${c.gradient} rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg ${c.shadowColor}">
          ${c.icon}
        </div>
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900">${c.title}</h1>
          <p class="text-slate-600 mt-1">${c.description}</p>
        </div>
      </div>
    </div>

    <!-- Endpoint -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
      <div class="flex items-center gap-3 mb-4">
        <span class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">${c.endpoint.method}</span>
        <code class="text-lg font-mono text-slate-900">${c.endpoint.path}</code>
      </div>
      <p class="text-slate-600">${c.endpoint.description}</p>
    </div>

    ${renderParametersTable(c.parameters)}
    ${renderFeaturesGrid(c.features)}
    ${renderExamples(c.examples)}
    ${renderGithubUsage(c.githubUsage.title, c.githubUsage.code)}
  `;

  return renderLayout(c.title, c.description, content);
}

export function renderTrmnlGridDocs(): string {
  const c = trmnlGridContent;

  const content = `
    <!-- Page Header -->
    <div class="mb-12">
      <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <a href="/" class="hover:text-slate-900">Home</a>
        <span>/</span>
        <span class="text-slate-900">${c.breadcrumb}</span>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 bg-gradient-to-br ${c.gradient} rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg ${c.shadowColor}">
          ${c.icon}
        </div>
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900">${c.title}</h1>
          <p class="text-slate-600 mt-1">${c.description}</p>
        </div>
      </div>
    </div>

    <!-- Endpoint -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
      <div class="flex items-center gap-3 mb-4">
        <span class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">${c.endpoint.method}</span>
        <code class="text-lg font-mono text-slate-900">${c.endpoint.path}</code>
      </div>
      <p class="text-slate-600">${c.endpoint.description}</p>
    </div>

    ${renderParametersTable(c.parameters)}
    ${renderFeaturesGrid(c.features)}
    ${renderPreview(c.preview.url, c.preview.linkHref, c.preview.linkText)}
    ${renderTrmnlSetup(c.trmnlSetup.steps)}
  `;

  return renderLayout(c.title, c.description, content);
}

export function renderTrmnlLastPlayedDocs(): string {
  const c = trmnlLastPlayedContent;

  const content = `
    <!-- Page Header -->
    <div class="mb-12">
      <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <a href="/" class="hover:text-slate-900">Home</a>
        <span>/</span>
        <span class="text-slate-900">${c.breadcrumb}</span>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 bg-gradient-to-br ${c.gradient} rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg ${c.shadowColor}">
          ${c.icon}
        </div>
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900">${c.title}</h1>
          <p class="text-slate-600 mt-1">${c.description}</p>
        </div>
      </div>
    </div>

    <!-- Endpoint -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
      <div class="flex items-center gap-3 mb-4">
        <span class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">${c.endpoint.method}</span>
        <code class="text-lg font-mono text-slate-900">${c.endpoint.path}</code>
      </div>
      <p class="text-slate-600">${c.endpoint.description}</p>
    </div>

    ${renderParametersTable(c.parameters)}
    ${renderFeaturesGrid(c.features)}
    ${renderPreview(c.preview.url, c.preview.linkHref, c.preview.linkText)}
    ${renderTrmnlSetup(c.trmnlSetup.steps)}
  `;

  return renderLayout(c.title, c.description, content);
}

export function renderTrmnlStatsDocs(): string {
  const c = trmnlStatsContent;

  const content = `
    <!-- Page Header -->
    <div class="mb-12">
      <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <a href="/" class="hover:text-slate-900">Home</a>
        <span>/</span>
        <span class="text-slate-900">${c.breadcrumb}</span>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 bg-gradient-to-br ${c.gradient} rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg ${c.shadowColor}">
          ${c.icon}
        </div>
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900">${c.title}</h1>
          <p class="text-slate-600 mt-1">${c.description}</p>
        </div>
      </div>
    </div>

    <!-- Endpoint -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
      <div class="flex items-center gap-3 mb-4">
        <span class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">${c.endpoint.method}</span>
        <code class="text-lg font-mono text-slate-900">${c.endpoint.path}</code>
      </div>
      <p class="text-slate-600">${c.endpoint.description}</p>
    </div>

    ${renderParametersTable(c.parameters)}
    ${renderFeaturesGrid(c.features)}
    ${renderPreview(c.preview.url, c.preview.linkHref, c.preview.linkText)}
    ${renderTrmnlSetup(c.trmnlSetup.steps)}
  `;

  return renderLayout(c.title, c.description, content);
}

export function render404Page(): string {
  const content = `
    <div class="text-center py-16">
      <div class="text-8xl mb-6">🔍</div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Page Not Found</h1>
      <p class="text-xl text-slate-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="/" class="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
          Go to Homepage
        </a>
        <a href="/docs/lastfm-chart" class="px-6 py-3 bg-white text-slate-900 rounded-xl font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors">
          View Documentation
        </a>
      </div>
    </div>
  `;

  return renderLayout('404 - Not Found', 'The requested page was not found', content);
}
