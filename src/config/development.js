// Release checklist: set enabled=false before distributing a production build.
// Localhost is required too, so hosted releases never expose these controls.
export const DEVELOPMENT = Object.freeze({ enabled: true });
