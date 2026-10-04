export const CITY_PROJECTS = Object.freeze([
  Object.freeze({ id: 'community-park', name: 'Community park', targetCents: 10000, requires: null, benefit: 'Turn the vacant neighborhood lot into a park.', tradeoff: 'New paths bring pedestrians into the park.' }),
  Object.freeze({ id: 'road-renewal', name: 'Street renewal', targetCents: 15000, requires: 'community-park', benefit: 'Fewer debris and construction hazards across the city.', tradeoff: 'Better roads help everyone, including your rivals.' }),
  Object.freeze({ id: 'city-safety', name: 'Modern traffic enforcement', targetCents: 20000, requires: 'road-renewal', benefit: 'Upgrade the neighborhood skyline and fund city services.', tradeoff: 'Speed cameras enforce the 35 MPH limit. Camera fines can cost more than fuel.' }),
]);
