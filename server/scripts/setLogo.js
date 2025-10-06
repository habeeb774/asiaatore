import prisma from '../db/client.js';

async function main() {
  try {
    const raw = process.argv[2];
    if (!raw) {
      console.error('Usage: node server/scripts/setLogo.js <path or URL>');
      process.exit(1);
    }
    // Normalize: ensure leading slash for local uploads
    let logo = raw.trim();
    if (!/^https?:\/\//i.test(logo) && !logo.startsWith('/')) {
      logo = '/' + logo.replace(/^\/+/, '');
    }
    const updated = await prisma.storeSetting.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', logo },
      update: { logo }
    });
    console.log('[SETTINGS] Logo updated to:', updated.logo);
    process.exit(0);
  } catch (e) {
    console.error('[SETTINGS] Failed to set logo:', e.message);
    process.exit(2);
  }
}

main();
