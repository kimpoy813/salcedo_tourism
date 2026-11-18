/** WGS84 sample centres of the printed reference maps (see docs/FIELD_MAP.md). */
export const RELIEF = {
  west: 120.46041666666667,
  east: 120.61875,
  south: 17.03125,
  north: 17.19791666666667,
  width: 1024,
  height: 1128,
};
export function locatorPoint(lat: number, lng: number) {
  return {
    x: ((lng - RELIEF.west) / (RELIEF.east - RELIEF.west)) * RELIEF.width,
    y: ((RELIEF.north - lat) / (RELIEF.north - RELIEF.south)) * RELIEF.height,
  };
}
