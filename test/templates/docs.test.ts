/**
 * Tests for documentation templates
 */

import { describe, it, expect } from 'vitest';
import {
  renderDocPage,
  renderHomePage,
  renderLastfmChartDocs,
  renderLastfmLastPlayedDocs,
  renderTrmnlGridDocs,
  renderTrmnlLastPlayedDocs,
  renderTrmnlStatsDocs,
  render404Page,
} from '../../src/templates/docs';

describe('renderDocPage', () => {
  it('renders a complete HTML page', () => {
    const result = renderDocPage({
      title: 'Test Page',
      description: 'A test page',
      content: '<p>Test content</p>',
    });

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html lang="en"');
    expect(result).toContain('</html>');
  });

  it('includes the title in the page', () => {
    const result = renderDocPage({
      title: 'My Title',
      description: 'Description',
      content: '',
    });

    expect(result).toContain('<title>My Title - Russ Rest API</title>');
  });

  it('includes the description in meta tag', () => {
    const result = renderDocPage({
      title: 'Title',
      description: 'My description here',
      content: '',
    });

    expect(result).toContain('<meta name="description" content="My description here">');
  });

  it('includes the content in main section', () => {
    const result = renderDocPage({
      title: 'Title',
      description: 'Desc',
      content: '<p>Custom content here</p>',
    });

    expect(result).toContain('<main');
    expect(result).toContain('<p>Custom content here</p>');
    expect(result).toContain('</main>');
  });

  it('includes navigation links', () => {
    const result = renderDocPage({
      title: 'Title',
      description: 'Desc',
      content: '',
    });

    expect(result).toContain('href="/"');
    expect(result).toContain('href="/docs/lastfm-chart"');
    expect(result).toContain('href="/docs/lastfm-last-played"');
    expect(result).toContain('href="/docs/trmnl-lastfm-grid"');
    expect(result).toContain('href="/docs/trmnl-lastfm-last-played"');
    expect(result).toContain('href="/docs/trmnl-lastfm-stats"');
  });

  it('includes footer with author link', () => {
    const result = renderDocPage({
      title: 'Title',
      description: 'Desc',
      content: '',
    });

    expect(result).toContain('<footer');
    expect(result).toContain('Russ McKendrick');
    expect(result).toContain('github.com/russmckendrick');
  });

  it('includes Tailwind CSS', () => {
    const result = renderDocPage({
      title: 'Title',
      description: 'Desc',
      content: '',
    });

    expect(result).toContain('tailwindcss.com');
  });

  it('includes custom fonts', () => {
    const result = renderDocPage({
      title: 'Title',
      description: 'Desc',
      content: '',
    });

    expect(result).toContain('fonts.googleapis.com');
    expect(result).toContain('Inter');
    expect(result).toContain('JetBrains Mono');
  });
});

describe('renderHomePage', () => {
  it('renders the home page', () => {
    const result = renderHomePage();

    expect(result).toContain('Russ Rest');
    expect(result).toContain('Last.fm');
  });

  it('includes hero section', () => {
    const result = renderHomePage();

    expect(result).toContain('Last.fm REST APIs');
    expect(result).toContain('SVG charts and TRMNL displays');
  });

  it('includes all endpoint cards', () => {
    const result = renderHomePage();

    expect(result).toContain('/lastfm-chart');
    expect(result).toContain('/lastfm-last-played');
    expect(result).toContain('/trmnl-lastfm-grid');
    expect(result).toContain('/trmnl-lastfm-last-played');
    expect(result).toContain('/trmnl-lastfm-stats');
  });

  it('includes quick start section', () => {
    const result = renderHomePage();

    expect(result).toContain('Quick Start');
    expect(result).toContain('username');
  });

  it('includes tech stack section', () => {
    const result = renderHomePage();

    expect(result).toContain('Built With');
    expect(result).toContain('Cloudflare');
    expect(result).toContain('TypeScript');
  });

  it('includes live preview image', () => {
    const result = renderHomePage();

    expect(result).toContain('Live Preview');
    expect(result).toContain('/lastfm-chart?artists');
  });
});

describe('renderLastfmChartDocs', () => {
  it('renders the chart documentation', () => {
    const result = renderLastfmChartDocs();

    expect(result).toContain('Last.fm Charts');
    expect(result).toContain('/lastfm-chart');
  });

  it('documents all parameters', () => {
    const result = renderLastfmChartDocs();

    expect(result).toContain('artists');
    expect(result).toContain('albums');
    expect(result).toContain('username');
    expect(result).toContain('width');
  });

  it('includes examples with images', () => {
    const result = renderLastfmChartDocs();

    expect(result).toContain('Top Artists');
    expect(result).toContain('Top Albums');
    expect(result).toContain('<img src=');
  });

  it('includes GitHub README usage', () => {
    const result = renderLastfmChartDocs();

    expect(result).toContain('GitHub README');
    expect(result).toContain('&lt;img src=');
  });

  it('includes breadcrumb navigation', () => {
    const result = renderLastfmChartDocs();

    expect(result).toContain('Home');
    expect(result).toContain('Charts');
  });

  it('shows GET method badge', () => {
    const result = renderLastfmChartDocs();

    expect(result).toContain('GET');
  });
});

describe('renderLastfmLastPlayedDocs', () => {
  it('renders the last played documentation', () => {
    const result = renderLastfmLastPlayedDocs();

    expect(result).toContain('Last Played Track');
    expect(result).toContain('/lastfm-last-played');
  });

  it('documents all parameters', () => {
    const result = renderLastfmLastPlayedDocs();

    expect(result).toContain('username');
    expect(result).toContain('width');
    expect(result).toContain('debug');
  });

  it('mentions real-time updates', () => {
    const result = renderLastfmLastPlayedDocs();

    expect(result).toContain('Real-time');
  });

  it('includes example image', () => {
    const result = renderLastfmLastPlayedDocs();

    expect(result).toContain('/lastfm-last-played?username=');
  });
});

describe('renderTrmnlGridDocs', () => {
  it('renders the TRMNL grid documentation', () => {
    const result = renderTrmnlGridDocs();

    expect(result).toContain('TRMNL Album Grid');
    expect(result).toContain('/trmnl-lastfm-grid');
  });

  it('documents parameters', () => {
    const result = renderTrmnlGridDocs();

    expect(result).toContain('username');
    expect(result).toContain('debug');
  });

  it('includes TRMNL setup instructions', () => {
    const result = renderTrmnlGridDocs();

    expect(result).toContain('TRMNL Setup');
    expect(result).toContain('Private Plugin');
    expect(result).toContain('Polling URL');
  });

  it('mentions e-ink optimization', () => {
    const result = renderTrmnlGridDocs();

    expect(result).toContain('e-ink');
    expect(result).toContain('Grayscale');
  });

  it('includes live example link', () => {
    const result = renderTrmnlGridDocs();

    expect(result).toContain('View live example');
  });
});

describe('renderTrmnlLastPlayedDocs', () => {
  it('renders the TRMNL last played documentation', () => {
    const result = renderTrmnlLastPlayedDocs();

    expect(result).toContain('TRMNL Last Played');
    expect(result).toContain('/trmnl-lastfm-last-played');
  });

  it('includes TRMNL setup instructions', () => {
    const result = renderTrmnlLastPlayedDocs();

    expect(result).toContain('TRMNL Setup');
    expect(result).toContain('Private Plugin');
  });

  it('mentions Framework v2 in endpoint description', () => {
    const result = renderTrmnlLastPlayedDocs();

    expect(result).toContain('TRMNL');
  });

  it('mentions real-time updates', () => {
    const result = renderTrmnlLastPlayedDocs();

    expect(result).toContain('Real-time');
  });
});

describe('renderTrmnlStatsDocs', () => {
  it('renders the TRMNL stats documentation', () => {
    const result = renderTrmnlStatsDocs();

    expect(result).toContain('TRMNL Stats');
    expect(result).toContain('/trmnl-lastfm-stats');
  });

  it('lists statistics features', () => {
    const result = renderTrmnlStatsDocs();

    expect(result).toContain('plays');
    expect(result).toContain('Top 5 Artists');
  });

  it('includes TRMNL setup instructions', () => {
    const result = renderTrmnlStatsDocs();

    expect(result).toContain('TRMNL Setup');
  });

  it('includes live example link', () => {
    const result = renderTrmnlStatsDocs();

    expect(result).toContain('View live example');
  });
});

describe('render404Page', () => {
  it('renders a 404 page', () => {
    const result = render404Page();

    expect(result).toContain('404');
    expect(result).toContain('Not Found');
  });

  it('includes helpful links', () => {
    const result = render404Page();

    expect(result).toContain('Go to Homepage');
    expect(result).toContain('View Documentation');
  });

  it('has a friendly message', () => {
    const result = render404Page();

    expect(result).toContain("doesn't exist");
  });
});
