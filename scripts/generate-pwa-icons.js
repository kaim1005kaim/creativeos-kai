import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CreativeOS OZ-style icon design
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" rx="128" fill="#0a0a0a"/>
  
  <!-- OZ-style hexagon pattern -->
  <g opacity="0.3">
    <path d="M128 64 L192 96 L192 160 L128 192 L64 160 L64 96 Z" fill="#4ecdc4" stroke="#4ecdc4" stroke-width="2"/>
    <path d="M320 64 L384 96 L384 160 L320 192 L256 160 L256 96 Z" fill="#ff9f43" stroke="#ff9f43" stroke-width="2"/>
    <path d="M224 192 L288 224 L288 288 L224 320 L160 288 L160 224 Z" fill="#45b7d1" stroke="#45b7d1" stroke-width="2"/>
  </g>
  
  <!-- Central node cluster -->
  <circle cx="256" cy="256" r="80" fill="#4ecdc4" opacity="0.9"/>
  <circle cx="256" cy="256" r="60" fill="#0a0a0a"/>
  
  <!-- Connection lines -->
  <line x1="256" y1="256" x2="128" y2="128" stroke="#4ecdc4" stroke-width="3" opacity="0.6"/>
  <line x1="256" y1="256" x2="384" y2="128" stroke="#ff9f43" stroke-width="3" opacity="0.6"/>
  <line x1="256" y1="256" x2="256" y2="384" stroke="#45b7d1" stroke-width="3" opacity="0.6"/>
  
  <!-- Small nodes -->
  <circle cx="128" cy="128" r="24" fill="#4ecdc4"/>
  <circle cx="384" cy="128" r="24" fill="#ff9f43"/>
  <circle cx="256" cy="384" r="24" fill="#45b7d1"/>
  
  <!-- Center symbol -->
  <text x="256" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#4ecdc4">C</text>
</svg>
`

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public')
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // Generate SVG buffer
  const svgBuffer = Buffer.from(svgIcon)

  // Generate different sizes
  const sizes = [
    { size: 192, name: 'pwa-192x192.png' },
    { size: 512, name: 'pwa-512x512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 16, name: 'favicon-16x16.png' }
  ]

  for (const { size, name } of sizes) {
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name))
      
      console.log(`✅ Generated ${name}`)
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error)
    }
  }

  // Create maskable icon (with padding)
  try {
    const maskableSvg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <!-- Background with safe area -->
      <rect width="512" height="512" rx="0" fill="#0a0a0a"/>
      
      <!-- Scaled down content for safe area (80% size) -->
      <g transform="translate(51.2, 51.2) scale(0.8)">
        <!-- OZ-style hexagon pattern -->
        <g opacity="0.3">
          <path d="M128 64 L192 96 L192 160 L128 192 L64 160 L64 96 Z" fill="#4ecdc4" stroke="#4ecdc4" stroke-width="2"/>
          <path d="M320 64 L384 96 L384 160 L320 192 L256 160 L256 96 Z" fill="#ff9f43" stroke="#ff9f43" stroke-width="2"/>
          <path d="M224 192 L288 224 L288 288 L224 320 L160 288 L160 224 Z" fill="#45b7d1" stroke="#45b7d1" stroke-width="2"/>
        </g>
        
        <!-- Central node cluster -->
        <circle cx="256" cy="256" r="80" fill="#4ecdc4" opacity="0.9"/>
        <circle cx="256" cy="256" r="60" fill="#0a0a0a"/>
        
        <!-- Connection lines -->
        <line x1="256" y1="256" x2="128" y2="128" stroke="#4ecdc4" stroke-width="3" opacity="0.6"/>
        <line x1="256" y1="256" x2="384" y2="128" stroke="#ff9f43" stroke-width="3" opacity="0.6"/>
        <line x1="256" y1="256" x2="256" y2="384" stroke="#45b7d1" stroke-width="3" opacity="0.6"/>
        
        <!-- Small nodes -->
        <circle cx="128" cy="128" r="24" fill="#4ecdc4"/>
        <circle cx="384" cy="128" r="24" fill="#ff9f43"/>
        <circle cx="256" cy="384" r="24" fill="#45b7d1"/>
        
        <!-- Center symbol -->
        <text x="256" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#4ecdc4">C</text>
      </g>
    </svg>
    `
    
    await sharp(Buffer.from(maskableSvg))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'pwa-512x512-maskable.png'))
    
    console.log(`✅ Generated pwa-512x512-maskable.png`)
  } catch (error) {
    console.error(`❌ Failed to generate maskable icon:`, error)
  }

  // Save the SVG file
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgIcon)
  console.log(`✅ Generated logo.svg`)

  // Create favicon.ico (multi-resolution)
  try {
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFile(path.join(publicDir, 'favicon.ico'))
    console.log(`✅ Generated favicon.ico`)
  } catch (error) {
    console.error(`❌ Failed to generate favicon.ico:`, error)
  }
}

generateIcons().catch(console.error)