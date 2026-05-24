/**
 * Handler for /trmnl-lastfm-stats endpoint
 * Generates a profile stats display for TRMNL e-ink displays
 */

import type { HandlerContext } from '../types';
import { LastFmClient } from '../utils/lastfm-client';
import { createHtmlResponse } from '../utils/cors';
import { escapeHtml } from '../utils/escape';
import { renderTrmnlPage } from '../templates/html/trmnl-base';

function formatNumber(value: string | number): string {
  return parseInt(String(value), 10).toLocaleString();
}

function formatDate(unixTimestamp: string): string {
  const date = new Date(parseInt(unixTimestamp, 10) * 1000);
  return date.toLocaleDateString('en-GB');
}

function daysSince(unixTimestamp: string): number {
  const seconds = Date.now() / 1000 - parseInt(unixTimestamp, 10);
  return Math.max(1, Math.floor(seconds / 86400));
}

function generateStatsContent(
  username: string,
  memberSince: string,
  playcount: string,
  playsPerDay: number,
  trackCount: string,
  artistCount: string,
  topArtists: Array<{ name: string; playcount: string }>
): string {
  const escapedUsername = escapeHtml(username);

  const stats: Array<{ value: string; label: string }> = [
    { value: formatNumber(playcount), label: 'Plays' },
    { value: formatNumber(playsPerDay), label: 'Per Day' },
    { value: formatNumber(trackCount), label: 'Tracks' },
    { value: formatNumber(artistCount), label: 'Artists' },
  ];

  const statsGrid = `
    <div class="stats-grid">
      ${stats
        .map(
          (s) => `
        <div class="stat-tile">
          <span class="stat-tile__value">${s.value}</span>
          <span class="stat-tile__label">${s.label}</span>
        </div>`
        )
        .join('')}
    </div>
  `;

  const maxPlays = Math.max(
    ...topArtists.map((a) => parseInt(a.playcount, 10) || 0),
    1
  );

  const artistList = topArtists
    .map((artist, idx) => {
      const plays = parseInt(artist.playcount, 10);
      const pct = Math.max(4, Math.round((plays / maxPlays) * 100));
      return `
      <div class="artist-row">
        <span class="artist-row__rank">${idx + 1}</span>
        <div class="artist-row__main">
          <div class="artist-row__line">
            <span class="artist-row__name" data-clamp="1">${escapeHtml(artist.name)}</span>
            <span class="artist-row__plays">${plays}</span>
          </div>
          <div class="artist-row__bar"><div class="artist-row__bar-fill" style="width: ${pct}%;"></div></div>
        </div>
      </div>
    `;
    })
    .join('');

  return `
    <div class="stats">
      <div class="stats__header">
        <div class="stats__user">
          <span class="stats__profile-label">Last.fm Profile</span>
          <span class="stats__username" data-clamp="1">${escapedUsername}</span>
        </div>
        <div class="stats__joined">
          <span class="stats__joined-label">Member Since</span>
          <span class="stats__joined-date">${memberSince}</span>
        </div>
      </div>

      ${statsGrid}

      <div class="top-artists">
        <div class="top-artists__head">
          <span class="top-artists__title">Top Artists</span>
          <span class="top-artists__period">Last 7 Days</span>
        </div>
        <div class="artist-list">
          ${artistList}
        </div>
      </div>
    </div>
  `;
}

export async function handleTrmnlLastFmStats(ctx: HandlerContext): Promise<Response> {
  const { env, params, debugInfo } = ctx;
  const { username, debug } = params;

  const client = new LastFmClient(env.LASTFM_API_KEY);

  if (debug) debugInfo.push('Fetching user info and top artists...');

  // Fetch user info and top artists in parallel
  const [userInfo, topArtists] = await Promise.all([
    client.getUserInfo(username),
    client.getTopArtists(username, '7day', 6),
  ]);

  const user = userInfo.user;
  const artists = topArtists.topartists.artist;

  if (debug) {
    debugInfo.push(`User: ${user.name}`);
    debugInfo.push(`Playcount: ${user.playcount}`);
    debugInfo.push(`Top artists: ${artists.length}`);
  }

  const additionalStyles = `
    .stats {
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
    .stats__header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--black);
      min-width: 0;
    }
    .stats__user {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    .stats__profile-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--gray-3);
      line-height: 1;
    }
    .stats__username {
      font-size: 28px;
      font-weight: 700;
      color: var(--black);
      line-height: 1.05;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .stats__joined {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      flex-shrink: 0;
    }
    .stats__joined-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--gray-3);
      line-height: 1;
    }
    .stats__joined-date {
      font-size: 18px;
      font-weight: 600;
      color: var(--black);
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }
    .stat-tile {
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 10px 6px;
      background: var(--gray-75);
      border: 1px solid var(--gray-65);
      box-sizing: border-box;
      overflow: hidden;
    }
    .stat-tile__value {
      font-size: 30px;
      font-weight: 700;
      color: var(--black);
      font-variant-numeric: tabular-nums;
      line-height: 1;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .stat-tile__label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--gray-3);
      line-height: 1;
    }
    .top-artists {
      flex: 1;
      min-height: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .top-artists__head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--gray-65);
    }
    .top-artists__title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--black);
      line-height: 1;
    }
    .top-artists__period {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--gray-3);
      line-height: 1;
    }
    .artist-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 20px;
      row-gap: 6px;
      flex: 1;
      min-height: 0;
    }
    .artist-row {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .artist-row__rank {
      flex: 0 0 24px;
      font-size: 20px;
      font-weight: 700;
      color: var(--gray-3);
      text-align: right;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .artist-row__main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .artist-row__line {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }
    .artist-row__name {
      font-size: 17px;
      font-weight: 600;
      color: var(--black);
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }
    .artist-row__plays {
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-2);
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
      line-height: 1;
    }
    .artist-row__bar {
      height: 4px;
      background: var(--gray-75);
      border: 1px solid var(--gray-65);
      overflow: hidden;
    }
    .artist-row__bar-fill {
      height: 100%;
      background: var(--black);
    }
  `;

  const playsPerDay = Math.round(
    parseInt(user.playcount, 10) / daysSince(user.registered.unixtime)
  );

  const content = generateStatsContent(
    user.name,
    formatDate(user.registered.unixtime),
    user.playcount,
    playsPerDay,
    user.track_count,
    user.artist_count,
    artists
  );

  const html = renderTrmnlPage({
    title: 'Last.fm Stats',
    instance: escapeHtml(username),
    content,
    additionalStyles,
    debug,
    debugInfo,
  });

  return createHtmlResponse(html, true);
}
