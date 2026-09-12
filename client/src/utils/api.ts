export function getBackendBaseUrl(): string {
  // Check localStorage override
  const saved = localStorage.getItem('who_is_it_backend_url');
  if (saved && saved.trim() !== '') {
    return saved.trim().replace(/\/$/, '');
  }

  // If on GitHub Pages, use default Cloudflare Worker domain or prompt
  if (window.location.hostname.endsWith('github.io')) {
    // Default workers.dev domain (or configured one)
    return 'https://who-is-it.workers.dev';
  }

  // Localhost or direct worker hosting
  return window.location.origin;
}

export function getBackendWsUrl(roomId: string): string {
  const base = getBackendBaseUrl();
  const isSsl = base.startsWith('https:');
  const cleanHost = base.replace(/^https?:\/\//, '');
  const wsProtocol = isSsl ? 'wss:' : 'ws:';
  return `${wsProtocol}//${cleanHost}/ws?roomId=${encodeURIComponent(roomId)}`;
}
