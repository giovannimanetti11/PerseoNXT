import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Breadcrumbs from '../../../components/breadcrumbs.vue'

describe('Breadcrumbs Component', () => {
  it('renders breadcrumbs correctly', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        currentPageName: 'Camomilla',
        parentPath: '/piante-medicinali',
        parentName: 'Piante medicinali'
      }
    })

    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('Piante medicinali')
    expect(wrapper.text()).toContain('Camomilla')
  })

  it('renders home link', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        currentPageName: 'Test Page',
        parentPath: '/test',
        parentName: 'Test'
      }
    })

    const homeLink = wrapper.find('a[href="/"]')
    expect(homeLink.exists()).toBe(true)
  })

  it('renders parent link when provided', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        currentPageName: 'Camomilla',
        parentPath: '/piante-medicinali',
        parentName: 'Piante medicinali'
      }
    })

    const parentLink = wrapper.find('a[href="/piante-medicinali"]')
    expect(parentLink.exists()).toBe(true)
    expect(parentLink.text()).toContain('Piante medicinali')
  })

  it('does not render parent link when not provided', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        currentPageName: 'About'
      }
    })

    const links = wrapper.findAll('a')
    // Should only have home link
    expect(links.length).toBe(1)
  })
})
