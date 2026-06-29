import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const logoPath = path.join(rootDir, 'public', 'logo.png');
const resDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');

// Android icon sizes per density
const sizes = {
  'mipmap-mdpi':    { launcher: 48,  foreground: 108 },
  'mipmap-hdpi':    { launcher: 72,  foreground: 162 },
  'mipmap-xhdpi':   { launcher: 96,  foreground: 216 },
  'mipmap-xxhdpi':  { launcher: 144, foreground: 324 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
};

async function generate() {
  const logo = sharp(logoPath);
  const metadata = await logo.metadata();
  console.log(`Source logo: ${metadata.width}x${metadata.height}`);

  for (const [folder, dims] of Object.entries(sizes)) {
    const outDir = path.join(resDir, folder);

    // ic_launcher.png — logo on dark background, with padding
    const launcherSize = dims.launcher;
    const logoPadded = Math.round(launcherSize * 0.75); // logo takes 75% of the icon
    await sharp(logoPath)
      .resize(logoPadded, logoPadded, { fit: 'contain', background: { r: 6, g: 6, b: 26, alpha: 1 } })
      .extend({
        top: Math.round((launcherSize - logoPadded) / 2),
        bottom: Math.ceil((launcherSize - logoPadded) / 2),
        left: Math.round((launcherSize - logoPadded) / 2),
        right: Math.ceil((launcherSize - logoPadded) / 2),
        background: { r: 6, g: 6, b: 26, alpha: 1 }
      })
      .png()
      .toFile(path.join(outDir, 'ic_launcher.png'));
    console.log(`  ${folder}/ic_launcher.png (${launcherSize}x${launcherSize})`);

    // ic_launcher_round.png — same as launcher for round icons
    await sharp(logoPath)
      .resize(logoPadded, logoPadded, { fit: 'contain', background: { r: 6, g: 6, b: 26, alpha: 1 } })
      .extend({
        top: Math.round((launcherSize - logoPadded) / 2),
        bottom: Math.ceil((launcherSize - logoPadded) / 2),
        left: Math.round((launcherSize - logoPadded) / 2),
        right: Math.ceil((launcherSize - logoPadded) / 2),
        background: { r: 6, g: 6, b: 26, alpha: 1 }
      })
      .png()
      .toFile(path.join(outDir, 'ic_launcher_round.png'));
    console.log(`  ${folder}/ic_launcher_round.png (${launcherSize}x${launcherSize})`);

    // ic_launcher_foreground.png — adaptive icon foreground (logo centered with safe zone padding)
    const fgSize = dims.foreground;
    const logoInFg = Math.round(fgSize * 0.5); // logo takes ~50% of foreground (safe zone)
    await sharp(logoPath)
      .resize(logoInFg, logoInFg, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: Math.round((fgSize - logoInFg) / 2),
        bottom: Math.ceil((fgSize - logoInFg) / 2),
        left: Math.round((fgSize - logoInFg) / 2),
        right: Math.ceil((fgSize - logoInFg) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(outDir, 'ic_launcher_foreground.png'));
    console.log(`  ${folder}/ic_launcher_foreground.png (${fgSize}x${fgSize})`);
  }

  console.log('\nAll icons generated!');
}

generate().catch(console.error);
