// Vite plugin for automatic image optimization
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export default function imageOptimization() {
  return {
    name: 'image-optimization',
    generateBundle(options, bundle) {
      const publicDir = path.resolve(process.cwd(), 'public');
      const assetsDir = path.join(publicDir, 'assets');
      
      if (!fs.existsSync(assetsDir)) return;
      
      // Optimize images in public/assets
      const optimizeImage = async (filePath) => {
        try {
          const stat = fs.statSync(filePath);
          if (stat.size > 50 * 1024) { // Only optimize images larger than 50KB
            const ext = path.extname(filePath).toLowerCase();
            const parsed = path.parse(filePath);
            
            if (['.jpg', '.jpeg', '.png'].includes(ext)) {
              const optimizedPath = path.join(parsed.dir, `${parsed.name}-optimized${ext}`);
              
              await sharp(filePath)
                .resize(1920, 1920, { 
                  fit: 'inside',
                  withoutEnlargement: true 
                })
                .jpeg({ quality: 85, progressive: true })
                .png({ quality: 85, progressive: true })
                .toFile(optimizedPath);
              
              console.log(`✓ Optimized ${path.basename(filePath)}`);
            }
          }
        } catch (error) {
          console.warn(`⚠️  Failed to optimize ${filePath}:`, error.message);
        }
      };
      
      // Process all images recursively
      const processDirectory = (dir) => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            processDirectory(fullPath);
          } else if (/\.(jpg|jpeg|png|webp)$/i.test(item)) {
            optimizeImage(fullPath);
          }
        });
      };
      
      processDirectory(assetsDir);
    }
  };
}
