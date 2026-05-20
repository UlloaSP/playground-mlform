import { MATERIAL_CATALOG, getMaterialFieldId } from "./material-catalog.js";

const createEmptyMaterialValues = () =>
  Object.fromEntries(MATERIAL_CATALOG.map((material) => [getMaterialFieldId(material.id), 0]));

const createExampleValues = (config) => ({
  ...createEmptyMaterialValues(),
  ...Object.fromEntries(
    (config.materials ?? []).map((entry) => [getMaterialFieldId(entry.materialId), entry.proportion]),
  ),
  extruderbrand: config.extruderbrand,
  extrusionspeed: config.extrusionspeed,
  printerbrand: config.printerbrand,
  platetemperature: config.platetemperature,
  printingspeed: config.printingspeed,
  objecttype: config.objecttype,
  shape: config.shape,
  surfacearea: config.surfacearea,
  volume: config.volume,
  mediavolume: config.mediavolume,
  mediaph: config.mediaph,
});

export const FORMULATION_EXAMPLES = [
  {
    id: "example-1",
    label: "Example 1",
    values: createExampleValues({
      materials: [
        { materialId: "pvp-va64", proportion: 35 },
        { materialId: "mannitol", proportion: 25 },
        { materialId: "allopurinol", proportion: 40 },
      ],
      extruderbrand: "Process_09",
      extrusionspeed: 18,
      printerbrand: "good_bot_2024-xp",
      platetemperature: 55,
      printingspeed: 28,
      objecttype: "tablet",
      shape: "capsule",
      surfacearea: 1030.5,
      volume: 498.2,
      mediavolume: 500,
      mediaph: 4,
    }),
  },
  {
    id: "example-2",
    label: "Example 2",
    values: createExampleValues({
      materials: [
        { materialId: "aqoat-as-hg", proportion: 40 },
        { materialId: "peg-400", proportion: 10 },
        { materialId: "pregabalin", proportion: 50 },
      ],
      extruderbrand: "Process_11",
      extrusionspeed: 15,
      printerbrand: "good_bot_4025-mp",
      platetemperature: 50,
      printingspeed: 30,
      objecttype: "tablet",
      shape: "cylinder",
      surfacearea: 1114.01,
      volume: 554.26,
      mediavolume: 500,
      mediaph: 3,
    }),
  },
  {
    id: "example-3",
    label: "Example 3",
    values: createExampleValues({
      materials: [
        { materialId: "aqoat-as-hg", proportion: 30 },
        { materialId: "pvp-va64", proportion: 25 },
        { materialId: "pregabalin", proportion: 45 },
      ],
      extruderbrand: "Process_07",
      extrusionspeed: 12,
      printerbrand: "good_bot_2025-rx",
      platetemperature: 45,
      printingspeed: 24,
      objecttype: "implant",
      shape: "ring",
      surfacearea: 930.2,
      volume: 402.75,
      mediavolume: 900,
      mediaph: 6,
    }),
  },
];

export const getExampleById = (exampleId) =>
  FORMULATION_EXAMPLES.find((example) => example.id === exampleId) ?? null;
