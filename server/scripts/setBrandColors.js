import prisma from '../db/client.js';

async function main() {
  try {
    const primary = process.argv[2];
    const secondary = process.argv[3];
    if (!primary || !secondary) {
      console.error('Usage: node server/scripts/setBrandColors.js <primaryHex> <secondaryHex>');
      process.exit(1);
    }
    const normalize = (hex) => {
      let h = String(hex).trim();
      if (!h.startsWith('#')) h = '#' + h;
      return h;
    };
    const colorPrimary = normalize(primary);
    const colorSecondary = normalize(secondary);
    // Treat secondary as accent as well for consistent theming
    const colorAccent = colorSecondary;

    const now = new Date();
    const updated = await prisma.storeSetting.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', colorPrimary, colorSecondary, colorAccent, updatedAt: now },
      update: { colorPrimary, colorSecondary, colorAccent, updatedAt: now }
    });
    console.log('[SETTINGS] Colors updated:', { colorPrimary: updated.colorPrimary, colorSecondary: updated.colorSecondary, colorAccent: updated.colorAccent });
    process.exit(0);
  } catch (e) {
    console.error('[SETTINGS] Failed to set colors:', e.message);
    process.exit(2);
  }
}

main();
