const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: path.join(__dirname, 'src', 'assets', 'icons', 'icon.ico')
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'DevStash',
        authors: 'SHUBHAM',
        description: 'Desktop application for managing and organizing code snippets',
        iconUrl: path.join(__dirname, 'src', 'assets', 'icons', 'icon.ico'),
        setupIcon: path.join(__dirname, 'src', 'assets', 'icons', 'icon.ico'),
        loadingGif: path.join(__dirname, 'src', 'assets', 'icons', 'icon.ico'),
        setupExe: 'DevStash Setup.exe',
        noMsi: true,
        shortcutLocations: ['StartMenu', 'Desktop'],
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        // Add these specific shortcut settings
        shortcutName: 'DevStash',
        programFilesFolderName: 'DevStash',
        registryKeys: {
          startMenuShortcut: {
            name: 'DevStash',
            value: path.join('%PROGRAMDATA%', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'DevStash.lnk')
          }
        }
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
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
