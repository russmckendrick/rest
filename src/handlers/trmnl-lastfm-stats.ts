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

function generateStatsContent(
  username: string,
  memberSince: string,
  playcount: string,
  playlists: string,
  trackCount: string,
  artistCount: string,
  topArtists: Array<{ name: string; playcount: string }>
): string {
  const escapedUsername = escapeHtml(username);

  const statsGrid = `
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">${formatNumber(playcount)}</div>
        <div class="stat-label">Total Plays</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${formatNumber(playlists)}</div>
        <div class="stat-label">Playlists</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${formatNumber(trackCount)}</div>
        <div class="stat-label">Tracks</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${formatNumber(artistCount)}</div>
        <div class="stat-label">Artists</div>
      </div>
    </div>
  `;

  const artistList = topArtists
    .map(
      (artist) => `
      <div class="artist-item">
        <div class="artist-name" data-clamp="1">${escapeHtml(artist.name)}</div>
        <div class="artist-plays">${parseInt(artist.playcount, 10)} plays</div>
      </div>
    `
    )
    .join('');

  return `
    <div class="content">
      <div class="header">
        <div class="user-info">
          <div class="username" data-clamp="1">${escapedUsername}</div>
          <div class="join-date">Member since ${memberSince}</div>
        </div>
      </div>

      ${statsGrid}

      <div class="top-artists">
        <div class="top-artists-title">Top Artists This Week</div>
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
    .content {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
    }
    .user-info {
      flex: 1;
    }
    .username {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 4px;
      color: #000;
      line-height: 1;
    }
    .join-date {
      font-size: 20px;
      color: #000;
      line-height: 1;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 8px;
      padding: 0 16px;
    }
    .stat-box {
      background: #fff;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .stat-value {
      font-family: 'NicoPups', monospace;
      font-size: 48px;
      font-weight: normal;
      color: #000;
      margin-bottom: 4px;
      line-height: 1;
    }
    .stat-label {
      font-size: 16px;
      color: #000;
      line-height: 1;
      text-transform: uppercase;
    }
    .top-artists {
      margin-top: 8px;
      flex: 1;
      min-height: 0;
    }
    .top-artists-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #000;
      line-height: 1;
      text-align: center;
      text-transform: uppercase;
    }
    .artist-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 0 16px;
    }
    .artist-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #fff;
      border: 1px solid #000;
      min-height: 40px;
    }
    .artist-name {
      font-size: 18px;
      color: #000;
      line-height: 1.2;
      margin-right: 12px;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .artist-plays {
      font-family: 'NicoPups', monospace;
      font-size: 18px;
      color: #000;
      line-height: 1;
      white-space: nowrap;
    }
  `;

  const content = generateStatsContent(
    user.name,
    formatDate(user.registered.unixtime),
    user.playcount,
    user.playlists,
    user.track_count,
    user.artist_count,
    artists
  );

  const html = renderTrmnlPage({
    title: 'Last.fm Stats',
    instance: `${escapeHtml(username)}'s Profile`,
    content,
    additionalStyles,
    debug,
    debugInfo,
  });

  return createHtmlResponse(html, true);
}
