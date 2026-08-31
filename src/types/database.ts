export interface CategoryRecord {
  id: string
  name: string
  slug: string
  description?: string | null
  created_at: string
  updated_at: string
}

export interface TagRecord {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface ArticleTagRecord {
  article_id: string
  tag_id: string
}

export interface MediaRecord {
  id: string
  cloudinary_public_id: string
  secure_url: string
  width?: number | null
  height?: number | null
  format?: string | null
  alt_text?: string | null
  title?: string | null
  caption?: string | null
  credit?: string | null
  created_at: string
  updated_at: string
}

export interface AdSlotRecord {
  id: string
  name: string
  slug: string
  description?: string | null
  location: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdConfigurationRecord {
  id: string
  slot_id: string
  provider: string
  configuration: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SiteSettingsRecord {
  id: string
  brand_name: string
  tagline?: string | null
  description?: string | null
  logo_url?: string | null
  full_logo_url?: string | null
  favicon_url?: string | null
  og_image_url?: string | null
  legal_business_name?: string | null
  business_type?: string | null
  founded_year?: number | null
  email?: string | null
  support_email?: string | null
  phone?: string | null
  whatsapp?: string | null
  country?: string | null
  province?: string | null
  district?: string | null
  city?: string | null
  address?: string | null
  postal_code?: string | null
  website_url?: string | null
  facebook_url?: string | null
  instagram_url?: string | null
  youtube_url?: string | null
  tiktok_url?: string | null
  linkedin_url?: string | null
  x_url?: string | null
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string[] | null
  google_site_verification?: string | null
  google_analytics_id?: string | null
  adsense_client_id?: string | null
  privacy_policy_url?: string | null
  terms_url?: string | null
  disclaimer_url?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BulletinRecord {
  id: string
  title: string
  notice: string
  picture_url?: string | null
  article_id?: string | null
  link_url?: string | null
  start_date: string
  end_date: string
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
  article?: {
    title: string
    slug: string
  }
}

export interface NewsletterSubscriberRecord {
  id: string
  email: string
  source?: string | null
  article_slug?: string | null
  status: string
  created_at: string
}

export type GallerySlot =
  | 'hero'
  | 'home_grid'
  | 'prepare_polaroid'
  | 'trekking_polaroid'
  | 'recovery_polaroid'

export interface GalleryPhotoRecord {
  id: string
  gallery_slot: GallerySlot
  image_url: string
  title: string
  description?: string | null
  location?: string | null
  seo_alt?: string | null
  seo_keywords?: string[] | null
  like_count: number
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
