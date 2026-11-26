import type { InjectionKey } from 'vue'

/** True on pages whose numbered sections collapse on phones (accordion). */
export const collapsibleSectionsKey: InjectionKey<boolean> = Symbol('collapsible-sections')

/** Window event asking the section with this id (detail) to open, e.g. from the index. */
export const SECTION_OPEN_EVENT = 'wh:section-open'

export function requestSectionOpen(id: string): void {
  window.dispatchEvent(new CustomEvent<string>(SECTION_OPEN_EVENT, { detail: id }))
}
