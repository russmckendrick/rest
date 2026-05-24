/**
 * TRMNL Framework v2 base template
 */

import { escapeHtml } from '../../utils/escape';

export interface TrmnlTemplateOptions {
  title: string;
  instance: string;
  content: string;
  additionalStyles?: string;
  debug?: boolean;
  debugInfo?: string[];
}

/**
 * Black pixel data URI for establishing rendering context
 */
const BLACK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Render a TRMNL v2 compliant page
 */
export function renderTrmnlPage(options: TrmnlTemplateOptions): string {
  const {
    title,
    instance,
    content,
    additionalStyles = '',
    debug = false,
    debugInfo = [],
  } = options;

  const escapedTitle = escapeHtml(title);
  const escapedInstance = escapeHtml(instance);

  return `<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
  <link rel="stylesheet" href="https://trmnl.com/css/latest/plugins.css">
  <script src="https://trmnl.com/js/latest/plugins.js"></script>
  <style>
    img {
      image-rendering: auto;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
    .title_bar {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background: #fff;
      border-top: 2px solid #000;
    }
    .title_bar .title,
    .title_bar .instance {
      color: #000 !important;
    }
    ${additionalStyles}
  </style>
</head>
<body class="environment trmnl">
  <div class="screen">
    <div class="view view--full">
      <div class="layout layout--col">
        <img src="${BLACK_PIXEL}" width="1" height="1" style="position: absolute; top: 0; left: 0; opacity: 0; pointer-events: none; display: block;" alt="" />
        ${content}
      </div>
      <div class="title_bar">
        <img class="image" src="https://trmnl.com/images/plugins/trmnl--render.svg" alt="" />
        <span class="title" data-clamp="1">${escapedTitle}</span>
        <span class="instance" data-clamp="1">${escapedInstance}</span>
      </div>
    </div>
  </div>
  ${
    debug
      ? `<div style="font-family: monospace; font-size: 12px; padding: 10px; background: #f0f0f0; margin-top: 20px; white-space: pre-wrap; color: #000;">${debugInfo.map((info) => escapeHtml(info)).join('\n')}</div>`
      : ''
  }
</body>
</html>`.trim();
}
