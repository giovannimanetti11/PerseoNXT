/** Response of the public form endpoints (contacts, proposals, newsletter, feedback). */
export interface FormResponse {
  success: boolean
  message: string
}

/** Algolia admin page: WordPress vs index for one content type. */
export interface SyncStatus {
  type: 'plant' | 'glossary' | 'blog'
  wordpress: number
  algolia: number
  /** In WordPress, not in the index */
  missing: string[]
  /** In the index, no longer in WordPress */
  orphaned: string[]
}

export interface SyncResult {
  type: SyncStatus['type']
  updated: number
  deleted: number
}
