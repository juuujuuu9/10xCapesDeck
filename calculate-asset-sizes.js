#!/usr/bin/env node

/**
 * Asset Size Calculator
 * Estimates file sizes for images and videos based on dimensions and quality settings
 */

// Image size estimation (in MB)
function estimateImageSize(width, height, quality = 85, format = 'jpeg') {
  const megapixels = (width * height) / 1_000_000;
  
  // Base compression ratios (MB per megapixel)
  const compressionRatios = {
    85: 0.4,  // High quality JPEG
    75: 0.25, // Medium quality JPEG
    65: 0.15, // Lower quality JPEG
  };
  
  const ratio = compressionRatios[quality] || compressionRatios[85];
  let sizeMB = megapixels * ratio;
  
  // WebP is typically 30% smaller (Bunny CDN converts automatically)
  if (format === 'webp') {
    sizeMB *= 0.7;
  }
  
  // PNG logos are typically smaller
  if (format === 'png') {
    sizeMB = Math.min(sizeMB, 0.2); // Cap at 200KB for logos
  }
  
  return sizeMB;
}

// Video size estimation (in MB)
function estimateVideoSize(resolution, durationSeconds = 30) {
  const durationMinutes = durationSeconds / 60;
  
  // Typical bitrates (MB per minute) for web-optimized MP4
  const bitrates = {
    '1920x1080': 12,  // 1080p
    '1280x720': 6,   // 720p
    '854x480': 3,     // 480p
    '640x360': 1.5,   // 360p
  };
  
  // Default to 1080p if resolution not specified
  const bitrate = bitrates[resolution] || bitrates['1920x1080'];
  
  return bitrate * durationMinutes;
}

// Analyze index.astro and components
const assets = {
  images: [],
  videos: [],
};

// Images from index.astro
assets.images.push(
  // Logo (2 variants)
  { name: 'Logo Mobile', width: 320, height: 100, quality: 85, format: 'png' },
  { name: 'Logo Desktop', width: 400, height: 100, quality: 85, format: 'png' },
  
  // Brand logos (20 logos at 300x300)
  ...Array(20).fill(null).map((_, i) => ({
    name: `Brand Logo ${i + 1}`,
    width: 300,
    height: 300,
    quality: 75,
    format: 'png',
  })),
  
  // TitleSlide backgrounds (1920x1080 assumed)
  { name: 'Social Content BG', width: 1920, height: 1080, quality: 85 },
  { name: 'Photo Slide BG', width: 1920, height: 1080, quality: 85 },
  { name: 'Design Slide BG', width: 1920, height: 1080, quality: 85 },
  { name: 'Activations Slide BG', width: 1920, height: 1080, quality: 85 },
  { name: 'Influencer Marketing BG', width: 1200, height: 800, quality: 85 },
  { name: 'Influencer Marketing BG Mobile', width: 1200, height: 800, quality: 85 },
  { name: 'Website Slide BG', width: 1920, height: 1080, quality: 85 },
  { name: 'C4 Frozen BG', width: 1920, height: 1080, quality: 85 },
  { name: 'Ending Image BG', width: 1920, height: 1080, quality: 85 },
  
  // Photo grids (1200x800 assumed)
  ...Array(6).fill(null).map((_, i) => ({
    name: `Photo Grid Image ${i + 1}`,
    width: 1200,
    height: 800,
    quality: 85,
  })),
  
  // Design grids (mix of images and videos)
  { name: 'Design Grid Image 1', width: 1200, height: 800, quality: 85 },
  { name: 'Design Grid Image 2', width: 1200, height: 800, quality: 85 },
  { name: 'Design Grid Image 3', width: 1200, height: 800, quality: 85 },
  
  // Activations grid (5 images)
  ...Array(5).fill(null).map((_, i) => ({
    name: `Activations Image ${i + 1}`,
    width: 1200,
    height: 800,
    quality: 85,
  })),
  
  // Adidas World Cup (5 images)
  ...Array(5).fill(null).map((_, i) => ({
    name: `Adidas World Cup ${i + 1}`,
    width: 1200,
    height: 800,
    quality: 85,
  })),
  
  // Tradeshow Booth (4 images)
  ...Array(4).fill(null).map((_, i) => ({
    name: `Tradeshow Booth ${i + 1}`,
    width: 1200,
    height: 800,
    quality: 85,
  })),
  
  // Website (2 images)
  ...Array(2).fill(null).map((_, i) => ({
    name: `Website Image ${i + 1}`,
    width: 1200,
    height: 800,
    quality: 85,
  })),
  
  // C4 Case Study
  { name: 'C4 Case Study', width: 1200, height: 800, quality: 85 },
  
  // Talent Brand Partnership (4 images)
  ...Array(4).fill(null).map((_, i) => ({
    name: `Talent Brand Partnership ${i + 1}`,
    width: 1200,
    height: 800,
    quality: 85,
  })),
  
  // Ignite Your Fire Results
  { name: 'Ignite Your Fire Results', width: 800, height: 1200, quality: 85 },
  
  // C4 OOH Activation (4 images)
  ...Array(4).fill(null).map((_, i) => ({
    name: `C4 OOH Activation ${i + 1}`,
    width: 1200,
    height: 800,
    quality: 85,
  })),
  
  // Two Block Image Grid (4 images)
  ...Array(4).fill(null).map((_, i) => ({
    name: `Two Block Image Grid ${i + 1}`,
    width: 1200,
    height: 800,
    quality: 85,
  })),
  
  // Three Column Two Row Grid (6 images)
  ...Array(6).fill(null).map((_, i) => ({
    name: `Three Column Grid ${i + 1}`,
    width: 1200,
    height: 800,
    quality: 85,
  })),
  
  // Services Section (5 background images)
  ...Array(5).fill(null).map((_, i) => ({
    name: `Service Card BG ${i + 1}`,
    width: 1920,
    height: 1080,
    quality: 85,
  })),
  
  // Influencer Marketing 2 (1 image)
  { name: 'Influencer Marketing 2 Image', width: 1200, height: 800, quality: 85 },
  
  // Derrick Rose Brand Grid (7 images)
  ...Array(7).fill(null).map((_, i) => ({
    name: `Derrick Rose Brand Grid ${i + 1}`,
    width: 1200,
    height: 800,
    quality: 85,
  })),
  
  // Derrick Rose Social Impact (6 phone images)
  ...Array(6).fill(null).map((_, i) => ({
    name: `Derrick Rose Social Impact ${i + 1}`,
    width: 520,
    height: 900,
    quality: 85,
  })),
  
  // Derrick Rose Social Impact Mobile (6 phone images - same as desktop)
  ...Array(6).fill(null).map((_, i) => ({
    name: `Derrick Rose Social Impact Mobile ${i + 1}`,
    width: 520,
    height: 900,
    quality: 85,
  })),
  
  // Video poster
  { name: 'Reel Poster', width: 1920, height: 1080, quality: 85 },
);

// Videos from index.astro
assets.videos.push(
  // ReelSection (assuming 60 seconds)
  { name: 'Times10 Reel', resolution: '1920x1080', duration: 60 },
  
  // ShortFormSocial (8 videos, assuming 30 seconds each)
  ...Array(8).fill(null).map((_, i) => ({
    name: `Short Form Social ${i + 1}`,
    resolution: '1920x1080',
    duration: 30,
  })),
  
  // StackedVideos 1 (4 videos, assuming 30 seconds each)
  ...Array(4).fill(null).map((_, i) => ({
    name: `Stacked Video 1-${i + 1}`,
    resolution: '1920x1080',
    duration: 30,
  })),
  
  // StackedVideos 2 (4 videos, assuming 30 seconds each)
  ...Array(4).fill(null).map((_, i) => ({
    name: `Stacked Video 2-${i + 1}`,
    resolution: '1920x1080',
    duration: 30,
  })),
  
  // Design grids (3 videos)
  ...Array(3).fill(null).map((_, i) => ({
    name: `Design Grid Video ${i + 1}`,
    resolution: '1920x1080',
    duration: 15,
  })),
  
  // Activations grid (2 videos)
  ...Array(2).fill(null).map((_, i) => ({
    name: `Activations Video ${i + 1}`,
    resolution: '1920x1080',
    duration: 30,
  })),
  
  // Website (1 video)
  { name: 'Website Video', resolution: '1920x1080', duration: 30 },
  
  // C4 Reel (assuming 60 seconds)
  { name: 'C4 Reel', resolution: '1920x1080', duration: 60 },
  
  // C4 OOH Activation (1 video)
  { name: 'C4 OOH Activation Video', resolution: '1920x1080', duration: 30 },
  
  // Two Block Image Grid (1 video)
  { name: 'Two Block Image Grid Video', resolution: '1920x1080', duration: 30 },
  
  // Influencer Marketing (1 video)
  { name: 'Influencer Marketing Video', resolution: '1920x1080', duration: 30 },
  
  // Influencer Marketing 2 (1 video)
  { name: 'Influencer Marketing 2 Video', resolution: '1920x1080', duration: 30 },
);

// Calculate sizes
let totalImageSize = 0;
let totalVideoSize = 0;

console.log('📊 ASSET SIZE ANALYSIS\n');
console.log('='.repeat(60));

console.log('\n🖼️  IMAGES:');
console.log('-'.repeat(60));
assets.images.forEach((img, i) => {
  const sizeMB = estimateImageSize(img.width, img.height, img.quality, img.format);
  totalImageSize += sizeMB;
  if (i < 10 || i >= assets.images.length - 5) {
    console.log(`${img.name.padEnd(40)} ${sizeMB.toFixed(2).padStart(8)} MB`);
  } else if (i === 10) {
    console.log('... (additional images) ...');
  }
});

console.log('-'.repeat(60));
console.log(`Total Images: ${assets.images.length}`);
console.log(`Total Image Size: ${totalImageSize.toFixed(2)} MB (${(totalImageSize / 1024).toFixed(2)} GB)`);

console.log('\n🎥 VIDEOS:');
console.log('-'.repeat(60));
assets.videos.forEach((vid, i) => {
  const sizeMB = estimateVideoSize(vid.resolution, vid.duration);
  totalVideoSize += sizeMB;
  if (i < 10 || i >= assets.videos.length - 5) {
    console.log(`${vid.name.padEnd(40)} ${sizeMB.toFixed(2).padStart(8)} MB`);
  } else if (i === 10) {
    console.log('... (additional videos) ...');
  }
});

console.log('-'.repeat(60));
console.log(`Total Videos: ${assets.videos.length}`);
console.log(`Total Video Size: ${totalVideoSize.toFixed(2)} MB (${(totalVideoSize / 1024).toFixed(2)} GB)`);

console.log('\n' + '='.repeat(60));
console.log('\n📈 SUMMARY:');
console.log(`Total Images: ${assets.images.length}`);
console.log(`Total Videos: ${assets.videos.length}`);
console.log(`Total Media Assets: ${assets.images.length + assets.videos.length}`);
console.log(`\nTotal Estimated Size: ${(totalImageSize + totalVideoSize).toFixed(2)} MB (${((totalImageSize + totalVideoSize) / 1024).toFixed(2)} GB)`);

console.log('\n💡 NOTES:');
console.log('- Image sizes assume WebP conversion (30% smaller than JPEG)');
console.log('- Video sizes assume H.264 MP4 at web-optimized bitrates');
console.log('- Actual sizes may vary based on content complexity');
console.log('- Bunny CDN transforms images on-the-fly, so these are delivery sizes');
console.log('- Videos are served via CDN, actual file sizes may differ');
