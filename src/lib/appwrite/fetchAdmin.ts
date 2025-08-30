export async function fetchAppwriteAdmin({
  path,
  method = 'GET',
  body
}: {
  path: string,
  method?: string,
  body?: any
}) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
  const apiKey = process.env.APPWRITE_API_KEY || '';
  const url = `${endpoint.replace(/\/v1$/, '')}/v1${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
      'X-Appwrite-Key': apiKey,
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const raw = await res.text();
    // Affiche un log détaillé côté serveur uniquement
    if (typeof window === 'undefined') {
      console.error('[Appwrite REST Admin] ERREUR:', {
        url,
        project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
        apiKeyPreview: apiKey ? apiKey.slice(0, 8) + '...' : '(vide)',
        method,
        status: res.status,
        response: raw
      });
    }
    throw new Error(`[Appwrite REST Admin] ${res.status} ${raw}`);
  }
  return res.json();
}
