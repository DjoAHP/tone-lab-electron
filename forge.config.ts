import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { join, dirname, basename } from 'path';
import { readFileSync, renameSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableName: process.platform === 'win32' ? 'ToneLab-v' + pkg.version : 'tone-lab-ahp',
    icon: join(__dirname, 'assets/app-icon'),
  },
  // Renomme les artefacts générés dans un schéma cohérent et lisible :
  //   Linux  → ToneLab-X.Y.Z_linux.deb
  //   Windows→ ToneLab-X.Y.Z_windows.exe
  // (le .deb et le .exe sont produits sur des OS différents, ce hook tourne
  //  lors de `npm run make` quel que soit l'OS)
  hooks: {
    postMake: async (_config, results) => {
      const version = pkg.version;
      for (const result of results) {
        // `result.artifacts` est un tableau de chemins (string[]) ; on le
        // reconstruit pour refléter les nouveaux noms vers forge/publish.
        result.artifacts = result.artifacts.map((origPath) => {
          const dir = dirname(origPath);
          const file = basename(origPath);
          let cible: string | null = null;

          if (file.endsWith('.deb')) {
            cible = `ToneLab-${version}_linux.deb`;
          } else if (file.endsWith(' Setup.exe')) {
            // Installateur Squirrel Windows (ex : "ToneLab-v2.8.12 Setup.exe")
            cible = `ToneLab-${version}_windows.exe`;
          }

          if (cible) {
            const target = join(dir, cible);
            if (target !== origPath) {
              renameSync(origPath, target);
              return target;
            }
          }
          return origPath;
        });
      }
      return results;
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      iconUrl: join(__dirname, 'assets/app-icon.ico'),
      setupIcon: join(__dirname, 'assets/app-icon.ico'),
      name: 'ToneLab-v' + pkg.version,
      exe: 'ToneLab-v' + pkg.version + '.exe',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
