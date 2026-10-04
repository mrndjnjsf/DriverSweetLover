import { DEVELOPMENT } from './config/development.js';

export function developmentToolsAvailable(location, config=DEVELOPMENT) {
  return config.enabled === true && ['localhost','127.0.0.1','[::1]','::1'].includes(location.hostname);
}
