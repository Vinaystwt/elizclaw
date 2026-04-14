export function resolveApiUrl(pathname: string) {
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
