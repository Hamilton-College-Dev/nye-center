// Single source of truth for floor identity and image geometry.
//
// Both apps need this: the mobile app renders the plans and positions pins on
// them, and the admin pin picker converts a click into percent coordinates.
// Those two must agree exactly — if a plan is re-exported at a new size and
// only one side is updated, every pin silently shifts. The image binaries stay
// per-app (RN `require` vs. a web URL); only the metadata is shared.

export const FLOOR_META = [
  {
    id: 'floor-1',
    floor: 1,
    label: 'Floor 1',
    title: 'Gateway / Visualization / Active Learning',
    imageFile: 'nye-floor-1.jpg',
    imageSize: { width: 1751, height: 1010 },
  },
  {
    id: 'floor-2',
    floor: 2,
    label: 'Floor 2',
    title: 'Makerspace / Mixer Hub / Classrooms',
    imageFile: 'nye-floor-2.jpg',
    imageSize: { width: 1747, height: 926 },
  },
  {
    id: 'floor-3',
    floor: 3,
    label: 'Floor 3',
    title: 'Research / Electronics / Hybrid Teaching',
    imageFile: 'nye-floor-3.jpg',
    imageSize: { width: 1438, height: 736 },
  },
  {
    id: 'floor-4',
    floor: 4,
    label: 'Floor 4',
    title: 'Faculty / Research / Tutorial',
    imageFile: 'nye-floor-4.jpg',
    imageSize: { width: 1436, height: 681 },
  },
];

export function floorMetaById(id) {
  return FLOOR_META.find((floor) => floor.id === id) ?? null;
}

export function floorMetaByNumber(floorNumber) {
  return FLOOR_META.find((floor) => floor.floor === Number(floorNumber)) ?? null;
}

// The building has four floors and no more; the floor_maps table holds one
// row per floor and the dashboard can only replace or delete, never add.
export const FLOOR_MAP_STATUS = {
  BUNDLED: 'bundled',
  CUSTOM: 'custom',
  DELETED: 'deleted',
};

// Merges floor_maps rows over FLOOR_META into the plan each floor should show.
// Missing or unreadable rows leave a floor on its bundled plan, so an empty or
// failed fetch reproduces the shipped map exactly. `imageUrl` is null unless an
// uploaded plan replaces the bundled one; callers draw `imageFile` then.
export function resolveFloorPlans(rows = []) {
  const rowsByFloor = new Map(
    (Array.isArray(rows) ? rows : [])
      .filter((row) => row && Number.isFinite(Number(row.floor)))
      .map((row) => [Number(row.floor), row]),
  );

  return FLOOR_META.map((meta) => {
    const row = rowsByFloor.get(meta.floor);
    const status = Object.values(FLOOR_MAP_STATUS).includes(row?.status)
      ? row.status
      : FLOOR_MAP_STATUS.BUNDLED;
    const width = Number(row?.image_width);
    const height = Number(row?.image_height);
    const custom =
      status === FLOOR_MAP_STATUS.CUSTOM && Boolean(row?.image_url) && width > 0 && height > 0;

    return {
      ...meta,
      label: row?.label || meta.label,
      title: row?.title || meta.title,
      // A custom row without a usable image is treated as bundled rather than
      // drawing nothing.
      status: custom || status === FLOOR_MAP_STATUS.DELETED ? status : FLOOR_MAP_STATUS.BUNDLED,
      deleted: status === FLOOR_MAP_STATUS.DELETED,
      bundledLayout: row?.bundled_layout !== false && status !== FLOOR_MAP_STATUS.DELETED,
      imageUrl: custom ? row.image_url : null,
      imagePath: custom ? (row.image_path ?? null) : null,
      imageSize: custom ? { width, height } : meta.imageSize,
      updatedAt: row?.updated_at ?? null,
    };
  });
}

export function visibleFloorPlans(rows = []) {
  return resolveFloorPlans(rows).filter((plan) => !plan.deleted);
}

// How far apart two images' shapes are, as a fraction (0.1 = 10%). Pins are
// stored as percentages, so a different shape moves every pin on the floor.
export function aspectRatioDifference(a, b) {
  if (!a?.width || !a?.height || !b?.width || !b?.height) return 0;
  const ratioA = a.width / a.height;
  const ratioB = b.width / b.height;
  return Math.abs(ratioA - ratioB) / ratioB;
}

// Pin coordinates are percentages of the floor image, so they survive any
// display size. Clamped because a stray click on the image border should land
// on the plan rather than outside it.
export function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}
