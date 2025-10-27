import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Breadcrumbs from '../../../components/breadcrumbs.vue'

// Mock useRoute from vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    path: '/test',
    params: {}
  }))
}))

describe('Breadcrumbs Component', () => {
  it('renders breadcrumbs correctly', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        currentPageName: 'Camomilla',
        parentPath: '/piante-medicinali',
        parentName: 'Piante medicinali'
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to']
          }
        }
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
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to']
          }
        }
      }
    })

    expect(wrapper.html()).toContain('Home')
  })

  it('renders parent link when provided', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        currentPageName: 'Camomilla',
        parentPath: '/piante-medicinali',
        parentName: 'Piante medicinali'
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to']
          }
        }
      }
    })

    expect(wrapper.text()).toContain('Piante medicinali')
  })

  it('does not render parent link when not provided', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        currentPageName: 'About'
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to']
          }
        }
      }
    })

    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('About')
  })
})
