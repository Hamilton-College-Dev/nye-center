import { ensureSupabase } from './supabaseService.js';

const CMS_IMAGES_BUCKET = 'space-images';

export async function uploadSpaceImage(slug, file) {
  return uploadCmsImage(slug, file, { folder: 'spaces' });
}

export async function uploadResourceImage(slug, file) {
  return uploadCmsImage(slug, file, { folder: 'resources' });
}

async function uploadCmsImage(slug, file, { folder = 'spaces' } = {}) {
  if (!slug?.trim()) {
    return { publicUrl: null, error: new Error('Set a slug before uploading an image.') };
  }
  if (!file) {
    return { publicUrl: null, error: new Error('Choose an image file to upload.') };
  }

  const client = ensureSupabase();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${folder}/${slug.trim()}.${extension}`;

  const { error } = await client.storage
    .from(CMS_IMAGES_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });

  if (error) return { publicUrl: null, error };

  const { data } = client.storage.from(CMS_IMAGES_BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl ? `${data.publicUrl}?v=${Date.now()}` : null;
  return { publicUrl, path, error: null };
}
