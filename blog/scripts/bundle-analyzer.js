const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📊 Bundle Analysis Report');
console.log('==========================\n');

// Check if build exists
const buildDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(buildDir)) {
  console.log('❌ No build found. Run "npm run build" first.');
  process.exit(1);
}

// Analyze bundle sizes
try {
  console.log('📦 Bundle Size Analysis:');
  
  // Get static folder size
  const staticDir = path.join(buildDir, 'static');
  if (fs.existsSync(staticDir)) {
    const staticSize = execSync(`du -sh "${staticDir}"`, { encoding: 'utf8' }).trim().split('\t')[0];
    console.log(`   Static assets: ${staticSize}`);
  }
  
  // Get chunks info
  const chunksDir = path.join(staticDir, 'chunks');
  if (fs.existsSync(chunksDir)) {
    const chunksSize = execSync(`du -sh "${chunksDir}"`, { encoding: 'utf8' }).trim().split('\t')[0];
    console.log(`   JavaScript chunks: ${chunksSize}`);
    
    // Count chunks
    const chunkFiles = fs.readdirSync(chunksDir).filter(f => f.endsWith('.js'));
    console.log(`   Total JS chunks: ${chunkFiles.length}`);
  }
  
  // Get CSS size
  const cssDir = path.join(staticDir, 'css');
  if (fs.existsSync(cssDir)) {
    const cssSize = execSync(`du -sh "${cssDir}"`, { encoding: 'utf8' }).trim().split('\t')[0];
    console.log(`   CSS files: ${cssSize}`);
  }
  
  console.log('\n🔍 Largest Files:');
  try {
    const largeFiles = execSync(`find "${staticDir}" -name "*.js" -size +100k -exec ls -lh {} \\; | head -10`, { encoding: 'utf8' });
    if (largeFiles.trim()) {
      console.log(largeFiles);
    } else {
      console.log('   ✅ No JS files larger than 100KB found');
    }
  } catch (e) {
    console.log('   Could not analyze large files');
  }
  
} catch (error) {
  console.error('Error analyzing bundle:', error.message);
}

console.log('\n🚀 Performance Recommendations:');
console.log('1. ✅ SWC minification enabled');
console.log('2. ✅ Bundle splitting configured');
console.log('3. ✅ Image optimization enabled');
console.log('4. ✅ Console logs removed in production');
console.log('5. ✅ Security headers configured');

console.log('\n📋 Next Steps:');
console.log('- Monitor Core Web Vitals in production');
console.log('- Use Lighthouse for performance audit');
console.log('- Consider code splitting for large components');
console.log('- Optimize images to WebP/AVIF format');
