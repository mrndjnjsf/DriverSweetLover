// Shared allowlist for local serving and publication. Never publish the repo root.
export const ROOT_ASSETS = ['index.html','style.css','enhancements.css','map-editor.css','dashboard.css','phone.css'];
export const CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'";
export function publicPath(requestUrl) {
  let pathname;
  try { pathname=decodeURIComponent(new URL(requestUrl,'http://localhost').pathname); } catch { return null; }
  if(pathname==='/')return 'index.html';
  if(/[\\\x00-\x1f]/.test(pathname))return null;
  const parts=pathname.slice(1).split('/');
  if(parts.some(part=>!part||part.startsWith('.')))return null;
  const relative=parts.join('/');
  if(ROOT_ASSETS.includes(relative))return relative;
  if(/^src\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.js$/i.test(relative))return relative;
  if(/^assets\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.svg$/i.test(relative))return relative;
  if(['vendor/three.core.js','vendor/three.module.js','vendor/THREE-LICENSE.txt'].includes(relative))return relative;
  return null;
}
