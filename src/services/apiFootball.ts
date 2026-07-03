/**
 * Base fetcher service for talking to the Express backend proxy endpoints.
 */
export async function apiFetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    urlParams.set(key, String(val));
  });

  const queryStr = urlParams.toString();
  const fullUrl = `/api/${endpoint}${queryStr ? '?' + queryStr : ''}`;

  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`Erreur réseau (code: ${response.status}) lors de l'appel : ${fullUrl}`);
  }

  const data = await response.json();
  return data as T;
}
