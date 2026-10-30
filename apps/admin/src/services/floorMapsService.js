import { FLOOR_MAP_STATUS, resolveFloorPlans } from '@nye-center/shared';

import { ensureSupabase } from './supabaseService.js';

// Floor plans share the CMS image bucket (public, admin-write) under their own
// folder, so no new bucket or storage policy is needed.
const FLOOR_MAPS_BUCKET = 'space-images';
const FLOOR_MAPS_FOLDER = 'floor-maps';

export const FLOOR_MAP_MAX_BYTES = 5 * 1024 * 1024;
export const FLOOR_MAP_MIME_TYPES = ['image/jpeg'];

export async function listFloorMaps() {
  const { data, error } = await ensureSupabase()
    .from('floor_maps')
    .select('*')
    .order('floor', { ascending: true });
  return { data: error ? null : resolveFloorPlans(data), error };
}

// Pins, route points and route links per floor, keyed by floor number.
export async function getFloorUsage() {
  const { data, error } = await ensureSupabase().rpc('floor_map_usage');
  if (error) return { data: null, error };
  const usage = {};
  (data ?? []).forEach((row) => {
    usage[row.floor] = {
      pins: Number(row.pins) || 0,
      routePoints: Number(row.route_points) || 0,
      routeLinks: Number(row.route_links) || 0,
    };
  });
  return { data: usage, error: null };
}

export function validateFloorMapFile(file) {
  if (!file) return 'Choose a JPG file to upload.';
  const extension = file.name?.split('.').pop()?.toLowerCase();
  if (!FLOOR_MAP_MIME_TYPES.includes(file.type) || !['jpg', 'jpeg'].includes(extension)) {
    return 'Floor plans must be JPG files (.jpg or .jpeg).';
  }
  if (file.size > FLOOR_MAP_MAX_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Floor plans can be at most 5 MB.`;
  }
  return null;
}

// Reads the image's pixel size in the browser. The apps size the plan (and
// place every pin) from these numbers, so they come from the file itself.
export function readImageSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    image.src = url;
  });
}

// Uploads a new plan for one floor and points the floor at it. Each upload
// gets its own file name, so phones that cached the old plan cannot keep
// showing it; the replaced file is removed once the row has moved on.
export async function uploadFloorMap(floor, file, imageSize, previousImagePath = null) {
  const client = ensureSupabase();
  const path = `${FLOOR_MAPS_FOLDER}/floor-${floor}-${Date.now()}.jpg`;

  const { error: uploadError } = await client.storage
    .from(FLOOR_MAPS_BUCKET)
    .upload(path, file, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
  if (uploadError) return { data: null, error: uploadError };

  const { data: urlData } = client.storage.from(FLOOR_MAPS_BUCKET).getPublicUrl(path);

  const { data, error } = await client
    .from('floor_maps')
    .update({
      status: FLOOR_MAP_STATUS.CUSTOM,
      image_url: urlData.publicUrl,
      image_path: path,
      image_width: imageSize.width,
      image_height: imageSize.height,
    })
    .eq('floor', floor)
    .select()
    .single();

  if (error) {
    // The row did not change, so the new file is orphaned; clean it up.
    await client.storage.from(FLOOR_MAPS_BUCKET).remove([path]);
    return { data: null, error };
  }

  if (previousImagePath) await removeFloorMapFile(previousImagePath);
  return { data, error: null };
}

// Removes the floor, its pins and its route points in one database call.
export async function deleteFloor(floor) {
  const { data, error } = await ensureSupabase().rpc('delete_floor', { target_floor: floor });
  if (error) return { data: null, error };
  if (data?.imagePath) await removeFloorMapFile(data.imagePath);
  return { data, error: null };
}

// Best effort: a leftover file costs storage but breaks nothing, so a failed
// removal is not reported as a failed save.
async function removeFloorMapFile(path) {
  if (!path?.startsWith(`${FLOOR_MAPS_FOLDER}/`)) return;
  await ensureSupabase().storage.from(FLOOR_MAPS_BUCKET).remove([path]);
}
