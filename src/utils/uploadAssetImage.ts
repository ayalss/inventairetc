export async function uploadAssetImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/uploads/asset-image', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Asset image upload failed (${res.status})`);
  }

  const data = await res.json();
  if (!data?.url) {
    throw new Error('Asset image upload did not return a URL.');
  }

  return data.url;
}
