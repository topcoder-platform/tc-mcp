import { config as devConfig } from './dev';
import { config as qaConfig } from './qa';
import { config as prodConfig } from './prod';
import { config as localConfig } from './local';

const env = import.meta.env.MODE;

let activeConfig = localConfig; // Default to local for safety/dev convenience

if (env === 'production') {
  activeConfig = prodConfig;
} else if (env === 'qa') {
  activeConfig = qaConfig;
} else if (env === 'development') {
    // Standard vite dev server runs in 'development' mode by default.
    activeConfig = localConfig;
} else if (env === 'dev') {
    // Custom mode for our "build:dev" script if we want to target the actual Dev environment
    activeConfig = devConfig;
}

export const config = activeConfig;
