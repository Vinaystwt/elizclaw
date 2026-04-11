const DEFAULT_AGENT_URL = "http://localhost:3000";
const PUBLIC_AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || process.env.AGENT_URL || DEFAULT_AGENT_URL;

function trimSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function resolveApiUrl(pathname: string) {
  if (typeof window === "undefined") {
    const base = PUBLIC_AGENT_URL;
    return `${trimSlash(base)}${pathname}`;
  }

  if (window.location.port === "3001") {
    return `${DEFAULT_AGENT_URL}${pathname}`;
  }

  if (PUBLIC_AGENT_URL && !window.location.origin.includes(trimSlash(PUBLIC_AGENT_URL))) {
    return `${trimSlash(PUBLIC_AGENT_URL)}${pathname}`;
  }

  return pathname;
}

export async function fetchJson<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(resolveApiUrl(pathname), init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchText(pathname: string, init?: RequestInit): Promise<string> {
  const response = await fetch(resolveApiUrl(pathname), init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return response.text();
}
