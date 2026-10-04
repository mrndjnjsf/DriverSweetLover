// Money is integer cents; fuel is litres. Starting money affects NEW careers only.
export const ECONOMY = Object.freeze({ startingWalletCents: 50_000, dragWinPayoutCents: 15_000 });
export const FUEL = Object.freeze({
  capacityLiters: Object.freeze({eclipse: 67, civic: 47, mustang: 59.4}),
  priceCentsPerLiter: 110, gameplayScale: 8,
  litersPerKm: Object.freeze({eclipse: .105, civic: .073, mustang: .125}),
  idleLitersPerHour: Object.freeze({eclipse: 1.1, civic: .7, mustang: 1.3}),
});
