export const APPEARANCES = Object.freeze({
  original: Object.freeze({ label:'Original body', generic:false }),
  'template-solid': Object.freeze({ label:'Generic body · paint template', generic:true, skin:'solid' }),
  'template-race': Object.freeze({ label:'Generic body · racing stripes', generic:true, skin:'race' }),
});
export const BODY_FAMILIES = Object.freeze({ eclipse:'coupe-v1', civic:'sedan-v1', mustang:'coupe-v1' });
// Tiles in the 1024×1024 source document, origin at its top-left.
export const BODY_UV_TILES = Object.freeze([[0,0],[512,0],[0,256],[512,256],[0,512],[512,512]]);
export const ROOF_UV_TILE = Object.freeze([0,768]);
