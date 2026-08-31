import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import heicConvert from 'heic-convert'

const inputDir = path.resolve('src', 'pics for blog')
const outputDir = path.resolve('public', 'images', 'nepal')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const files = fs.readdirSync(inputDir)
console.log(`Found ${files.length} images in "${inputDir}". Processing...`)

const mapping = [
  {
    pattern: /nepali flag/i,
    slug: 'nepal-flag-himalayas',
    title: 'Nepali Flag Flying in Front of the Himalayas',
    alt: 'National flag of Nepal fluttering against majestic snowcapped Himalayan peaks',
    category: 'prepare-for-nepal',
    caption: 'The unique double-triangular Nepali flag against the high Himalayan range.',
    credit: 'Soul of Nepal Photography',
    featured: true,
  },
  {
    pattern: /3 beautiful gumbas/i,
    slug: 'gumbas-monastery-himalayas',
    title: 'Sacred Himalayan Gumbas & Monasteries',
    alt: 'Three traditional Buddhist stupas and prayer flags in front of massive mountain peak',
    category: 'recovery-healing',
    caption: 'Ancient Buddhist gumbas standing in quiet contemplation beneath mountain giants.',
    credit: 'Soul of Nepal Photography',
    featured: true,
  },
  {
    pattern: /narrow allleywy of mustang/i,
    slug: 'mustang-alleyway-trekker',
    title: 'Trekker in the Ancient Alleys of Upper Mustang',
    alt: 'Solo traveler walking through the rustic stone alleyways of ancient Mustang',
    category: 'trekking-adventure',
    caption: 'Wandering the preserved medieval alleyways of Upper Mustang.',
    credit: 'Soul of Nepal Photography',
    featured: true,
  },
  {
    pattern: /boat in lake golden hour/i,
    slug: 'fewa-lake-boat-golden-hour',
    title: 'Golden Hour on Fewa Lake, Pokhara',
    alt: 'Traditional wooden boat floating peacefully on golden Fewa lake in Pokhara at sunset',
    category: 'recovery-healing',
    caption: 'Serene golden reflections across Fewa Lake during a peaceful Pokhara evening.',
    credit: 'Soul of Nepal Photography',
    featured: true,
  },
  {
    pattern: /people sitting by fewa lake/i,
    slug: 'fewa-lake-travelers-evening',
    title: 'Travelers Relaxing by Fewa Lake Shore',
    alt: 'Travelers and locals sitting lakeside watching the sunset in Pokhara',
    category: 'recovery-healing',
    caption: 'Post-trek relaxation along the quiet lakeside promenade in Pokhara.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /thakali food dal bhat/i,
    slug: 'thakali-dal-bhat-nepali-food',
    title: 'Authentic Nepali Thakali Dal Bhat Set',
    alt: 'Traditional Nepali Thakali dal bhat platter with rice, lentils, curries, and pickles',
    category: 'prepare-for-nepal',
    caption: 'Fueling Himalayan adventures with traditional Nepali Dal Bhat Power.',
    credit: 'Soul of Nepal Culinary Series',
    featured: true,
  },
  {
    pattern: /taxi driver from the back seat/i,
    slug: 'kathmandu-taxi-journey',
    title: 'Navigating Kathmandu Streets by Local Taxi',
    alt: 'Aesthetic view from the backseat of a local Kathmandu taxi navigating city traffic',
    category: 'prepare-for-nepal',
    caption: 'The lively, energetic rhythm of local transportation in Kathmandu Valley.',
    credit: 'Soul of Nepal Photography',
    featured: true,
  },
  {
    pattern: /mountain with starry sky/i,
    slug: 'himalayan-starry-night-sky',
    title: 'Starry Night Skies Above Himalayan Peaks',
    alt: 'Clear night sky filled with millions of stars over rugged Himalayan mountain silhouette',
    category: 'trekking-adventure',
    caption: 'Breathtaking astrophotography at high-altitude Himalayan mountain camp.',
    credit: 'Soul of Nepal Photography',
    featured: true,
  },
  {
    pattern: /beautiful top shot.*more gold/i,
    slug: 'himalayan-sunrise-viewpoint-gold',
    title: 'Spectacular Golden Sunrise from Himalayan Ridge',
    alt: 'Travelers standing on a mountain ridge viewpoint watching vibrant golden sunrise',
    category: 'trekking-adventure',
    caption: 'Early morning golden light illuminating the mountain ridges and travelers.',
    credit: 'Soul of Nepal Photography',
    featured: true,
  },
  {
    pattern: /beautiful top shot.*view point/i,
    slug: 'himalayan-sunrise-panorama',
    title: 'Panoramic Viewpoint Sunrise Over the Valley',
    alt: 'Wide panoramic sunrise over mist-filled Himalayan valleys',
    category: 'trekking-adventure',
    caption: 'Witnessing the first rays of dawn crest over the Himalayan mountain horizons.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /close up shot of a moumtaiin revealing lot of details/i,
    slug: 'himalayan-peak-detailed-glaciers',
    title: 'Dramatic High-Altitude Glacier and Peak Details',
    alt: 'Close-up high-resolution telephoto shot of rugged snow, ice and ridges on a Himalayan peak',
    category: 'trekking-adventure',
    caption: 'Raw geological drama carved into eight-thousand-meter mountain walls.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /closeup shot of a mountain peak/i,
    slug: 'mountain-peak-crest',
    title: 'Pristine Snow Crest on Himalayan Summit',
    alt: 'Sharp telephoto view of pure white snow crest on Himalayan summit',
    category: 'trekking-adventure',
    caption: 'Pristine, untouched snow lines carved along the summit ridge.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /cloudy image of a mountain/i,
    slug: 'cloudy-himalayan-ridge',
    title: 'Atmospheric Clouds Drifting Over Mountain Slopes',
    alt: 'Dramatic clouds weaving through alpine mountain slopes and high altitude passes',
    category: 'trekking-adventure',
    caption: 'Moody atmospheric weather shifting rapidly across high Himalayan passes.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /beautiful house lush greenaary/i,
    slug: 'himalayan-village-greenery-lodge',
    title: 'Traditional Teahouse in Lush Himalayan Valleys',
    alt: 'Rustic mountain stone teahouse surrounded by terraced lush green fields with snow peak behind',
    category: 'trekking-adventure',
    caption: 'Cozy stone teahouses nestled within lush green terraced Himalayan valleys.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /hills with beautiful sunrise/i,
    slug: 'hills-dawn-sunrise',
    title: 'Dawn Sunrise Over the Rolling Foothills',
    alt: 'Gentle morning dawn light bathing the middle hills and valleys of Nepal',
    category: 'prepare-for-nepal',
    caption: 'Peaceful dawn awakening across Nepal’s middle hill country.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /beautifil hill with yellow sky/i,
    slug: 'rolling-hills-yellow-sky',
    title: 'Golden Sunset Sky Over Hill Landscapes',
    alt: 'Vibrant yellow and orange twilight sky over terraced green hills',
    category: 'recovery-healing',
    caption: 'Warm golden twilight descending upon the peaceful Himalayan foothills.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /shadow of clouds clear over the hils/i,
    slug: 'clouds-and-shadows-over-hills',
    title: 'Billowing Clouds and Hill Shadows',
    alt: 'Fluffy white clouds casting deep shadows over rolling green mountains',
    category: 'prepare-for-nepal',
    caption: 'Dramatic play of light and shadow across Nepal’s expansive hill terrain.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /sun setting behind hills/i,
    slug: 'sunset-behind-nepal-hills',
    title: 'Serene Sunset Behind Mountain Ridges',
    alt: 'Sun setting directly behind the silhouette of mountain ridges',
    category: 'recovery-healing',
    caption: 'A moment of stillness as the sun sets beyond the distant mountain ridges.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /city vibe of holi festival colorful umbrellas/i,
    slug: 'holi-festival-kathmandu-umbrellas',
    title: 'Vibrant Holi Festival Celebration in the City',
    alt: 'Colorful umbrellas and cheerful celebration in the streets of Kathmandu during Holi festival',
    category: 'prepare-for-nepal',
    caption: 'Unbridled joy and explosive colors during Nepal’s annual Holi festival.',
    credit: 'Soul of Nepal Photography',
    featured: true,
  },
  {
    pattern: /holi vibe in city/i,
    slug: 'holi-festival-city-energy',
    title: 'Energetic Street Life During Holi Festival',
    alt: 'Joyful crowds celebrating Holi festival with colored powders in the city',
    category: 'prepare-for-nepal',
    caption: 'The electric spirit of unity and colors filling the heritage squares.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /2 chinese girls enjoying holi/i,
    slug: 'travelers-enjoying-holi-festival',
    title: 'International Travelers Celebrating Holi',
    alt: 'Travelers joyfully covered in colored powders celebrating Holi festival',
    category: 'prepare-for-nepal',
    caption: 'Travelers from around the world embracing the colorful warmth of Nepal.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /man enjoying and dancing in holi/i,
    slug: 'holi-festival-dance-celebration',
    title: 'Ecstatic Dancing at Holi Festival',
    alt: 'Man dancing joyously amidst red and purple powder during Holi festivities',
    category: 'prepare-for-nepal',
    caption: 'Pure jubilation and celebration in the streets of Nepal.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /long exposure shot of people smoking/i,
    slug: 'nighttime-stargazing-trails',
    title: 'Night Sky Stargazing & Trail Magic',
    alt: 'Long exposure nighttime photography capturing star trails and evening campfire spirit',
    category: 'trekking-adventure',
    caption: 'Evening camaraderie under the Himalayan night skies.',
    credit: 'Soul of Nepal Photography',
  },
  {
    pattern: /IMG_3106/i,
    slug: 'himalayan-wilderness-vista',
    title: 'High Altitude Himalayan Wilderness Vista',
    alt: 'Pristine mountain wilderness in Nepal Himalayas',
    category: 'trekking-adventure',
    caption: 'Untamed wilderness spanning the grand Himalayan divide.',
    credit: 'Soul of Nepal Photography',
  },
]

const processedResults = []

for (const file of files) {
  const filePath = path.join(inputDir, file)
  const stat = fs.statSync(filePath)
  if (stat.isDirectory()) continue

  const matched = mapping.find((m) => m.pattern.test(file))
  const slug = matched ? matched.slug : file.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const outFileName = `${slug}.webp`
  const outPath = path.join(outputDir, outFileName)
  const publicSrc = `/images/nepal/${outFileName}`

  const thumbFileName = `${slug}-thumb.webp`
  const thumbPath = path.join(outputDir, thumbFileName)
  const thumbSrc = `/images/nepal/${thumbFileName}`

  console.log(`Processing: "${file}" (${(stat.size / 1024 / 1024).toFixed(2)} MB) -> "${outFileName}"...`)

  try {
    let fileBuffer = fs.readFileSync(filePath)

    // Check if buffer is HEIC container
    const isHeic = fileBuffer.slice(4, 12).toString().includes('ftyp')
    if (isHeic) {
      console.log(`  Converting HEIC payload to JPEG buffer...`)
      fileBuffer = await heicConvert({
        buffer: fileBuffer,
        format: 'JPEG',
        quality: 0.94,
      })
    }

    const image = sharp(fileBuffer).rotate()
    const meta = await image.metadata()

    // 1. High-resolution full WebP (max 1920px)
    await image
      .clone()
      .resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 84, effort: 4 })
      .toFile(outPath)

    // 2. Fast-loading mobile cover thumbnail (max 720px)
    await sharp(fileBuffer)
      .rotate()
      .resize({
        width: 720,
        height: 720,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80, effort: 3 })
      .toFile(thumbPath)

    const outStat = fs.statSync(outPath)
    const thumbStat = fs.statSync(thumbPath)
    console.log(`  ✓ Saved full: ${(outStat.size / 1024).toFixed(1)} KB (Saved ${(100 - (outStat.size / stat.size) * 100).toFixed(1)}%)`)
    console.log(`  ✓ Saved thumb: ${(thumbStat.size / 1024).toFixed(1)} KB\n`)

    processedResults.push({
      file,
      slug,
      src: publicSrc,
      thumbSrc,
      title: matched?.title || slug,
      alt: matched?.alt || slug,
      category: matched?.category || 'trekking-adventure',
      caption: matched?.caption || '',
      credit: matched?.credit || 'Soul of Nepal Photography',
      featured: Boolean(matched?.featured),
      originalSizeKb: (stat.size / 1024).toFixed(1),
      optimizedSizeKb: (outStat.size / 1024).toFixed(1),
      thumbSizeKb: (thumbStat.size / 1024).toFixed(1),
      width: meta.width || 1920,
      height: meta.height || 1080,
    })
  } catch (err) {
    console.error(`Failed to process "${file}":`, err.message)
  }
}

// Write TypeScript asset registry
const tsContent = `// Automatically generated Nepal photo registry with high-res optimized WebP assets
export interface NepalPhoto {
  slug: string
  src: string
  thumbSrc: string
  title: string
  alt: string
  category: 'prepare-for-nepal' | 'trekking-adventure' | 'recovery-healing'
  caption: string
  credit: string
  featured?: boolean
  originalSizeKb: string
  optimizedSizeKb: string
  thumbSizeKb: string
  width?: number
  height?: number
}

export const NEPAL_PHOTOS: NepalPhoto[] = ${JSON.stringify(processedResults, null, 2)}

export function getPhotoBySlug(slug: string): NepalPhoto | undefined {
  return NEPAL_PHOTOS.find((p) => p.slug === slug)
}

export function getPhotosByCategory(category: string): NepalPhoto[] {
  return NEPAL_PHOTOS.filter((p) => p.category === category)
}

export function getFeaturedPhotos(): NepalPhoto[] {
  return NEPAL_PHOTOS.filter((p) => p.featured)
}
`

const dataDir = path.resolve('src', 'lib', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}
fs.writeFileSync(path.join(dataDir, 'nepalImages.ts'), tsContent)
console.log(`Successfully generated registry with ${processedResults.length} / ${files.length} photos!`)
