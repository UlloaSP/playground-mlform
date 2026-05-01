export const MATERIAL_CATALOG = [
  {
    id: "allopurinol",
    label: "Allopurinol",
    supplier: "FarmaQuimica",
    category: "api",
    defaultPercent: 20,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "aqoat-as-hg",
    label: "Hydroxypropyl methyl cellulose acetate succinate",
    supplier: "Aqoat AS-HG",
    category: "polymer",
    defaultPercent: 40,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "peg-400",
    label: "Polyethylene glycol",
    supplier: "PEG 400",
    category: "plasticizer",
    defaultPercent: 10,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "pregabalin",
    label: "Pregabalin",
    supplier: "Fagron",
    category: "api",
    defaultPercent: 50,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "pvp-va64",
    label: "PVP/VA 64",
    supplier: "BASF",
    category: "polymer",
    defaultPercent: 35,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "mannitol",
    label: "Mannitol",
    supplier: "Roquette",
    category: "excipient",
    defaultPercent: 25,
    min: 0,
    max: 100,
    step: 1,
  },
];

export const getMaterialById = (materialId) =>
  MATERIAL_CATALOG.find((material) => material.id === materialId) ?? null;

export const getMaterialFieldId = (materialId) => `material-${materialId}`;

export const getMaterialOptionLabel = (materialId) => {
  const material = getMaterialById(materialId);
  return material ? `${material.label} (${material.supplier})` : materialId;
};
