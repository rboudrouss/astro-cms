export type SeoRole = 'title' | 'description' | 'ogImage'

export type SeoFieldMapping = Partial<Record<SeoRole, string>>

export type SeoValues = Partial<Record<SeoRole, string>>

export type SeoWarning = {
  role: SeoRole
  severity: 'info' | 'warning'
  message: string
}

export const SEO_LIMITS: Record<'title' | 'description', { min: number; max: number }> = {
  title: { min: 30, max: 70 },
  description: { min: 70, max: 160 }
}

const TITLE_PATTERNS = ['title', 'seotitle', 'metatitle', 'pagetitle', 'seo_title', 'meta_title']
const DESCRIPTION_PATTERNS = [
  'description',
  'seodescription',
  'metadescription',
  'seo_description',
  'meta_description'
]
const OG_IMAGE_PATTERNS = [
  'ogimage',
  'og_image',
  'socialimage',
  'social_image',
  'opengraphimage'
]

const SEO_HINT_TO_ROLE: Record<string, SeoRole> = {
  title: 'title',
  description: 'description',
  'og-image': 'ogImage'
}

function matchesPatterns(fieldName: string, patterns: string[]): boolean {
  return patterns.includes(fieldName.toLowerCase())
}

export function detectSeoFields(
  frontmatter: Record<string, unknown>,
  cmsHints?: Record<string, { seo?: string; [key: string]: unknown }>
): SeoFieldMapping {
  const mapping: SeoFieldMapping = {}
  const keys = Object.keys(frontmatter)

  if (cmsHints) {
    for (const [fieldName, hint] of Object.entries(cmsHints)) {
      if (hint.seo && keys.includes(fieldName)) {
        const role = SEO_HINT_TO_ROLE[hint.seo]
        if (role) mapping[role] = fieldName
      }
    }
  }

  for (const key of keys) {
    if (!mapping.title && matchesPatterns(key, TITLE_PATTERNS)) {
      mapping.title = key
    }
    if (!mapping.description && matchesPatterns(key, DESCRIPTION_PATTERNS)) {
      mapping.description = key
    }
    if (!mapping.ogImage && matchesPatterns(key, OG_IMAGE_PATTERNS)) {
      mapping.ogImage = key
    }
  }

  return mapping
}

export function extractSeoValues(
  frontmatter: Record<string, unknown>,
  mapping: SeoFieldMapping
): SeoValues {
  const values: SeoValues = {}
  for (const [role, fieldName] of Object.entries(mapping) as [SeoRole, string][]) {
    const raw = frontmatter[fieldName]
    values[role] = raw != null ? String(raw) : ''
  }
  return values
}

export function validateSeoField(role: SeoRole, value: string): SeoWarning[] {
  if (role === 'ogImage') return []
  if (value.length === 0) return []

  const limits = SEO_LIMITS[role]
  const warnings: SeoWarning[] = []

  if (value.length < limits.min) {
    warnings.push({
      role,
      severity: 'info',
      message: `${role === 'title' ? 'Title' : 'Description'} is short (${value.length}/${limits.min} min)`
    })
  } else if (value.length > limits.max) {
    warnings.push({
      role,
      severity: 'warning',
      message: `${role === 'title' ? 'Title' : 'Description'} exceeds recommended length (${value.length}/${limits.max} max)`
    })
  }

  return warnings
}

export function hasSeoFields(mapping: SeoFieldMapping): boolean {
  return Object.keys(mapping).length > 0
}
