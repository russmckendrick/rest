/**
 * Handler for /trmnl-lastfm-heatmap endpoint
 * Renders a 12-week scrobble heatmap (GitHub-style) for TRMNL e-ink displays.
 */

import type { HandlerContext, LastFmTrack } from '../types';
import { LastFmClient } from '../utils/lastfm-client';
import { createHtmlResponse } from '../utils/cors';
import { escapeHtml } from '../utils/escape';
import { renderTrmnlPage } from '../templates/html/trmnl-base';

const WEEKS = 12;
const DAYS = WEEKS * 7;
const PAGE_SIZE = 200;
const MAX_PAGES = 25;
const SECONDS_PER_DAY = 86400;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function isoDayIndex(date: Date): number {
  // Monday = 0, Sunday = 6
  const dow = date.getUTCDay();
  return (dow + 6) % 7;
}

interface DayBucket {
  date: Date;
  key: string;
  count: number;
}

function buildEmptyBuckets(start: Date): DayBucket[] {
  const buckets: DayBucket[] = [];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(start.getTime() + i * SECONDS_PER_DAY * 1000);
    buckets.push({ date: d, key: dayKey(d), count: 0 });
  }
  return buckets;
}

function intensityClass(count: number, max: number): string {
  if (count === 0) return 'lv0';
  if (max <= 1) return 'lv4';
  const ratio = count / max;
  if (ratio <= 0.25) return 'lv1';
  if (ratio <= 0.5) return 'lv2';
  if (ratio <= 0.75) return 'lv3';
  return 'lv4';
}

function generateHeatmapContent(
  username: string,
  buckets: DayBucket[],
  total: number,
  peakDay: DayBucket | null,
  rangeLabel: string
): string {
  const max = Math.max(...buckets.map((b) => b.count), 0);
  const avg = total / DAYS;
  const activeDays = buckets.filter((b) => b.count > 0).length;

  // Build column groups (one per week, 7 cells)
  const weeks: DayBucket[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(buckets.slice(w * 7, w * 7 + 7));
  }

  // Month labels above week columns — show the month name on the first week
  // that contains that month's 1st-7th, or on the leftmost week.
  const monthHeader = weeks
    .map((week, idx) => {
      const firstDay = week[0];
      if (!firstDay) return '<div class="hm-month"></div>';
      const showMonth = idx === 0 || firstDay.date.getUTCDate() <= 7;
      const label = showMonth ? MONTH_LABELS[firstDay.date.getUTCMonth()] ?? '' : '';
      return `<div class="hm-month">${label}</div>`;
    })
    .join('');

  const dayLabelsCol = DAY_LABELS.map(
    (label, idx) =>
      `<div class="hm-daylabel${idx % 2 === 1 ? '' : ' hm-daylabel--show'}">${label}</div>`
  ).join('');

  const grid = weeks
    .map((week) => {
      const cells = week
        .map((bucket) => {
          const cls = intensityClass(bucket.count, max);
          const title = `${bucket.key}: ${bucket.count} ${bucket.count === 1 ? 'scrobble' : 'scrobbles'}`;
          return `<div class="hm-cell hm-${cls}" title="${title}"></div>`;
        })
        .join('');
      return `<div class="hm-col">${cells}</div>`;
    })
    .join('');

  const peakLabel = peakDay
    ? `${peakDay.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })} · ${peakDay.count}`
    : '—';

  const stats: Array<{ value: string; label: string }> = [
    { value: formatNumber(total), label: 'Plays' },
    { value: Math.round(avg).toString(), label: 'Per Day' },
    { value: `${activeDays}/${DAYS}`, label: 'Active' },
    { value: peakLabel, label: 'Peak Day' },
  ];

  return `
    <div class="heatmap">
      <div class="heatmap__header">
        <div class="heatmap__title">
          <span class="heatmap__label">Listening Activity</span>
          <span class="heatmap__user" data-clamp="1">${escapeHtml(username)}</span>
        </div>
        <div class="heatmap__range">
          <span class="heatmap__range-label">Last ${WEEKS} Weeks</span>
          <span class="heatmap__range-dates">${rangeLabel}</span>
        </div>
      </div>

      <div class="heatmap__stats">
        ${stats
          .map(
            (s) => `
          <div class="hm-stat">
            <span class="hm-stat__value">${escapeHtml(s.value)}</span>
            <span class="hm-stat__label">${s.label}</span>
          </div>`
          )
          .join('')}
      </div>

      <div class="heatmap__grid-wrap">
        <div class="hm-months">
          <div class="hm-spacer"></div>
          ${monthHeader}
        </div>
        <div class="hm-body">
          <div class="hm-days">${dayLabelsCol}</div>
          <div class="hm-grid">${grid}</div>
        </div>
      </div>

      <div class="heatmap__legend">
        <span class="hm-legend-label">Less</span>
        <div class="hm-cell hm-lv0"></div>
        <div class="hm-cell hm-lv1"></div>
        <div class="hm-cell hm-lv2"></div>
        <div class="hm-cell hm-lv3"></div>
        <div class="hm-cell hm-lv4"></div>
        <span class="hm-legend-label">More</span>
      </div>
    </div>
  `;
}

async function fetchScrobbleBuckets(
  client: LastFmClient,
  username: string,
  start: Date,
  end: Date,
  debug: boolean,
  debugInfo: string[]
): Promise<DayBucket[]> {
  const buckets = buildEmptyBuckets(start);
  const indexByKey = new Map<string, number>();
  buckets.forEach((b, i) => indexByKey.set(b.key, i));

  const from = Math.floor(start.getTime() / 1000);
  // `to` is inclusive — set just before midnight of the day after `end`
  const to = Math.floor(end.getTime() / 1000) + SECONDS_PER_DAY - 1;

  const first = await client.getRecentTracks(username, PAGE_SIZE, { from, to, page: 1 });
  const totalPages = Math.min(
    parseInt(first.recenttracks['@attr'].totalPages, 10) || 1,
    MAX_PAGES
  );
  const totalScrobbles = parseInt(first.recenttracks['@attr'].total, 10) || 0;

  if (debug) {
    debugInfo.push(`Window: ${dayKey(start)} → ${dayKey(end)}`);
    debugInfo.push(`Total scrobbles in window: ${totalScrobbles}`);
    debugInfo.push(`Pages: ${totalPages} (capped at ${MAX_PAGES})`);
  }

  const tally = (tracks: LastFmTrack[]): void => {
    for (const track of tracks) {
      if (track['@attr']?.nowplaying === 'true') continue;
      const uts = track.date?.uts;
      if (!uts) continue;
      const date = new Date(parseInt(uts, 10) * 1000);
      const key = dayKey(date);
      const idx = indexByKey.get(key);
      if (idx !== undefined) {
        const bucket = buckets[idx];
        if (bucket) bucket.count++;
      }
    }
  };

  tally(first.recenttracks.track);

  if (totalPages > 1) {
    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        client.getRecentTracks(username, PAGE_SIZE, { from, to, page: i + 2 })
      )
    );
    for (const page of remaining) {
      tally(page.recenttracks.track);
    }
  }

  return buckets;
}

export async function handleTrmnlLastFmHeatmap(ctx: HandlerContext): Promise<Response> {
  const { env, params, debugInfo } = ctx;
  const { username, debug } = params;

  // Window: today (UTC) back through 12 complete weeks, aligned so the
  // rightmost column ends today and grid rows are Mon..Sun.
  const now = new Date();
  const todayUtc = utcDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const endDow = isoDayIndex(todayUtc); // 0=Mon..6=Sun
  // Last column should end on Sunday-of-current-week (so we always show a full week).
  // Pad forward to the next Sunday; if today is Sunday, end is today.
  const daysToSunday = 6 - endDow;
  const end = new Date(todayUtc.getTime() + daysToSunday * SECONDS_PER_DAY * 1000);
  const start = new Date(end.getTime() - (DAYS - 1) * SECONDS_PER_DAY * 1000);

  const client = new LastFmClient(env.LASTFM_API_KEY);
  const buckets = await fetchScrobbleBuckets(client, username, start, end, !!debug, debugInfo);

  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  const peakDay = buckets.reduce<DayBucket | null>(
    (peak, b) => (peak === null || b.count > peak.count ? b : peak),
    null
  );

  const rangeLabel = `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })} – ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })}`;

  const content = generateHeatmapContent(username, buckets, total, peakDay, rangeLabel);

  const additionalStyles = `
    .heatmap {
      flex: 1;
      width: 100%;
      min-width: 0;
      min-height: 0;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding: 14px 20px;
      gap: 12px;
      overflow: hidden;
    }
    .heatmap__header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--black);
      min-width: 0;
    }
    .heatmap__title {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    .heatmap__label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--gray-3);
      line-height: 1;
    }
    .heatmap__user {
      font-size: 28px;
      font-weight: 700;
      color: var(--black);
      line-height: 1.05;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .heatmap__range {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      flex-shrink: 0;
    }
    .heatmap__range-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--gray-3);
      line-height: 1;
    }
    .heatmap__range-dates {
      font-size: 16px;
      font-weight: 600;
      color: var(--black);
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .heatmap__stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }
    .hm-stat {
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 6px;
      background: var(--gray-75);
      border: 1px solid var(--gray-65);
      box-sizing: border-box;
      overflow: hidden;
    }
    .hm-stat__value {
      font-size: 22px;
      font-weight: 700;
      color: var(--black);
      font-variant-numeric: tabular-nums;
      line-height: 1;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .hm-stat__label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--gray-3);
      line-height: 1;
    }
    .heatmap__grid-wrap {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .hm-months {
      display: grid;
      grid-template-columns: 32px repeat(${WEEKS}, minmax(0, 1fr));
      gap: 4px;
    }
    .hm-month {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--gray-3);
      line-height: 1;
      text-align: left;
    }
    .hm-spacer {
      width: 32px;
    }
    .hm-body {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: 32px 1fr;
      gap: 4px;
      align-items: stretch;
    }
    .hm-days {
      display: grid;
      grid-template-rows: repeat(7, minmax(0, 1fr));
      gap: 4px;
      row-gap: 4px;
    }
    .hm-daylabel {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--gray-3);
      line-height: 1;
      display: flex;
      align-items: center;
      visibility: hidden;
    }
    .hm-daylabel--show {
      visibility: visible;
    }
    .hm-grid {
      display: grid;
      grid-template-columns: repeat(${WEEKS}, minmax(0, 1fr));
      gap: 4px;
    }
    .hm-col {
      display: grid;
      grid-template-rows: repeat(7, minmax(0, 1fr));
      gap: 4px;
    }
    .hm-cell {
      min-width: 0;
      min-height: 0;
      box-sizing: border-box;
      border: 1px solid var(--gray-65);
    }
    .hm-lv0 { background: var(--white); }
    .hm-lv1 { background: var(--gray-75); }
    .hm-lv2 { background: var(--gray-5); border-color: var(--gray-3); }
    .hm-lv3 { background: var(--gray-3); border-color: var(--gray-2); }
    .hm-lv4 { background: var(--black); border-color: var(--black); }
    .heatmap__legend {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      padding-top: 4px;
    }
    .heatmap__legend .hm-cell {
      width: 14px;
      height: 14px;
    }
    .hm-legend-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--gray-3);
      line-height: 1;
    }
  `;

  const html = renderTrmnlPage({
    title: 'Last.fm Heatmap',
    instance: escapeHtml(username),
    content,
    additionalStyles,
    debug,
    debugInfo,
  });

  return createHtmlResponse(html, true);
}
