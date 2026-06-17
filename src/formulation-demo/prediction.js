const round = (value, digits = 2) => Number(value.toFixed(digits));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getMaterialPercent = (materials, materialId) =>
  materials.find((entry) => entry.material_id === materialId || entry.materialId === materialId)
    ?.proportion_w_w ?? 0;

export const buildPrediction = (inputs) => {
  const materials = Array.isArray(inputs.materials) ? inputs.materials : [];
  const total = materials.reduce((sum, entry) => sum + Number(entry.proportion_w_w ?? 0), 0);
  const aqoat = getMaterialPercent(materials, "aqoat-as-hg");
  const peg = getMaterialPercent(materials, "peg-400");
  const pregabalin = getMaterialPercent(materials, "pregabalin");
  const pvp = getMaterialPercent(materials, "pvp-va64");
  const speed = Number(inputs.printingspeed ?? 0);
  const extrusionSpeed = Number(inputs.extrusionspeed ?? 0);
  const plateTemperature = Number(inputs.platetemperature ?? 0);
  const mediaPh = Number(inputs.mediaph ?? 0);
  const mediaVolume = Number(inputs.mediavolume ?? 0);
  const surfaceArea = Number(inputs.surfacearea ?? 0);
  const volume = Number(inputs.volume ?? 0);

  const cohesionScore =
    45 + aqoat * 0.52 + pvp * 0.33 - peg * 0.16 - Math.abs(plateTemperature - 52) * 0.55;
  const printabilityScore =
    58 +
    speed * 0.4 +
    extrusionSpeed * 0.5 +
    aqoat * 0.2 +
    peg * 0.1 -
    Math.abs(total - 100) * 1.7;
  const dissolutionBias =
    pregabalin * 0.48 + peg * 0.37 + mediaVolume * 0.018 - aqoat * 0.16 - mediaPh * 1.5;

  const extrusionTemperature = clamp(95 + aqoat * 0.25 + pvp * 0.18 + extrusionSpeed * 0.45, 95, 155);
  const printingTemperature = clamp(
    extrusionTemperature + 55 + peg * 0.2 - aqoat * 0.08 + speed * 0.32,
    150,
    230,
  );
  const mechanicalCharacteristics =
    cohesionScore >= 72 ? "Good" : cohesionScore >= 58 ? "Acceptable" : "Fragile";
  const printability = printabilityScore >= 74 ? "Yes" : printabilityScore >= 63 ? "Borderline" : "No";

  const baseCurve = [
    { timeMinutes: 0, dissolvedPercent: 0 },
    { timeMinutes: 60, dissolvedPercent: clamp(10 + dissolutionBias * 0.22, 0, 100) },
    { timeMinutes: 210, dissolvedPercent: clamp(28 + dissolutionBias * 0.5 + surfaceArea * 0.008, 0, 100) },
    { timeMinutes: 300, dissolvedPercent: clamp(40 + dissolutionBias * 0.72 + volume * 0.018, 0, 100) },
  ];

  const curve = baseCurve.map((point, index) => ({
    ...point,
    dissolvedPercent: index === 0 ? 0 : round(point.dissolvedPercent, 1),
  }));

  return {
    summary: {
      mechanicalCharacteristics,
      extrusionTemperature: round(extrusionTemperature, 0),
      printability,
      printingTemperature: round(printingTemperature, 0),
    },
    curve,
    metrics: {
      total,
      cohesionScore: round(cohesionScore, 1),
      printabilityScore: round(printabilityScore, 1),
    },
  };
};
