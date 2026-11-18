export const MAP_LAYERS = {
  field: {
    name: "Field map",
    note: "Local roads, waterways & barangays",
    url: "",
    credit:
      '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
    max: 19,
  },
  street: {
    name: "Street",
    note: "OpenStreetMap street detail",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    credit:
      '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
    max: 19,
  },
  clean: {
    name: "Light",
    note: "Muted streets by CARTO",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    credit:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · © <a href="https://carto.com/attributions">CARTO</a>',
    max: 19,
  },
  terrain: {
    name: "Terrain",
    note: "Contours & elevation",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    credit:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, SRTM · <a href="https://opentopomap.org/about">OpenTopoMap (CC BY-SA)</a>',
    max: 17,
  },
  satellite: {
    name: "Satellite",
    note: "Esri World Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    credit:
      'Imagery © <a href="https://www.esri.com/">Esri</a> and its data providers',
    max: 19,
  },
} as const;
export type LayerId = keyof typeof MAP_LAYERS;
