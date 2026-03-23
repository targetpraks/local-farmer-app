// Magic Mix — Single substrate formula for all oyster mushroom varieties
// One mix. Every variety. Keeps costing simple.

export const MAGIC_MIX = {
  // Hardwood pellets (food-grade, e.g. Lava Fires, Cape Town)
  hardwoodPelletRatio: 0.70,   // 70% of dry mix
  hardwoodPelletPricePerKg: 8.00, // R/kg (from Lava Fires, March 2026)

  // Wheat bran / multigrain (animal feed grade, SACOO Trading)
  wheatBranRatio: 0.30,        // 30% of dry mix
  wheatBranPricePerKg: 12.00,  // R/kg estimated

  // Hydration water
  waterLitresPerKgDry: 2.9,    // litres to reach 65% moisture
  waterPricePerLitre: 0.01,   // R/litre municipal

  // Spawn inoculation rate
  spawnInoculationPct: 5,      // 5% of substrate weight
  spawnPricePerKg: 110.00,      // R/kg (Mushroom Guru, R220/2kg)

  // Grow bags
  growBagPrice: 10.00,          // R/bag (filter-patch, autoclave-safe)
  substrateKgPerBag: 2,         // kg substrate per bag

  // Defaults
  defaultLabourRate: 45,        // R/hour
  defaultOverheadPct: 5,        // % of materials cost
} as const;

// Calculated: cost per kg of dry mix (before water)
export const COST_DRY_MIX_PER_KG = 
  MAGIC_MIX.hardwoodPelletRatio * MAGIC_MIX.hardwoodPelletPricePerKg +
  MAGIC_MIX.wheatBranRatio * MAGIC_MIX.wheatBranPricePerKg;

// Calculated: total cost per kg substrate (dry mix + water + spawn amortised)
export const MAGIC_MIX_COST_PER_KG = (() => {
  const dryMixCost = MAGIC_MIX.hardwoodPelletRatio * MAGIC_MIX.hardwoodPelletPricePerKg +
                     MAGIC_MIX.wheatBranRatio * MAGIC_MIX.wheatBranPricePerKg;
  const waterCost = MAGIC_MIX.waterLitresPerKgDry * MAGIC_MIX.waterPricePerLitre;
  // Spawn: 5% of 1kg = 50g = 0.05kg at R110/kg
  const spawnCost = 0.05 * MAGIC_MIX.spawnPricePerKg;
  // Grow bag: R10 per 2kg bag = R5 per kg
  const bagCost = MAGIC_MIX.growBagPrice / MAGIC_MIX.substrateKgPerBag;
  return dryMixCost + waterCost + spawnCost + bagCost;
})(); // ≈ R16.95/kg

export function calcSubstrateCost(bagCount: number): number {
  return bagCount * MAGIC_MIX.substrateKgPerBag * MAGIC_MIX_COST_PER_KG;
}

export function calcBatchCosting(params: {
  bagCount: number;
  labourHours: number;
  labourRate: number;
  overheadPct: number;
  totalKgHarvested: number;
}) {
  const { bagCount, labourHours, labourRate, overheadPct, totalKgHarvested } = params;
  const substrateCost = calcSubstrateCost(bagCount);
  const labourCost = labourHours * labourRate;
  const overhead = substrateCost * (overheadPct / 100);
  const totalCost = substrateCost + labourCost + overhead;
  const costPerKg = totalKgHarvested > 0 ? totalCost / totalKgHarvested : 0;
  return {
    substrateCost: round(substrateCost),
    labourCost: round(labourCost),
    overhead: round(overhead),
    totalCost: round(totalCost),
    totalKgHarvested,
    costPerKg: round(costPerKg),
  };
}

export function calcPrice(costPerKg: number, targetMarginPct: number) {
  const wholesale = costPerKg / (1 - targetMarginPct / 100);
  const retail = wholesale * 1.25;
  return {
    wholesale: round(wholesale),
    retail: round(retail),
  };
}

export function round(n: number, d = 2): number {
  return Math.round(n * 10 ** d) / 10 ** d;
}
