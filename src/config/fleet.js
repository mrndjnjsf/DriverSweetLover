// Prototype prices, not real vehicle valuations. Money is integer cents.
export const DEALERSHIP = Object.freeze({pricesCents:Object.freeze({eclipse:30000,civic:35000}),maxCars:8});
export const DRIVERS = Object.freeze({kai:Object.freeze({name:'Kai',winsToHire:3})});
export const FLEET = Object.freeze({jobSeconds:60,ownerShare:.1,reservePerJobCents:100,
  grossBaseCents:2000,grossVariationCents:1000,jobKm:1,
  fuelLiters:Object.freeze({eclipse:.8,civic:.6,mustang:1}),serviceHealth:.6,minimumFuelLiters:1,
  reserveTopUpCents:2500});
