import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = join(__dirname, '..', 'public', 'Frame-1.png');
const outputDir = join(__dirname, '..', 'public', 'icons');

// Create icons directory if it doesn't exist
try {
  mkdirSync(outputDir, { recursive: true });
} catch (error) {
  console.error('Error creating directory:', error);
  process.exit(1);
}

// Generate icons
const generateIcons = async () => {
  console.log('🎨 Generating PWA icons...\n');
  
  for (const size of sizes) {
    const outputFile = join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(inputImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputFile);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Error generating icon-${size}x${size}.png:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Icon generation complete!');
  console.log(`📁 Icons saved to: ${outputDir}`);
};

generateIcons().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

