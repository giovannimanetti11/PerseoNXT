# WikiHerbalist Tests

This directory contains automated tests for the WikiHerbalist Nuxt application.

## Test Structure

```
tests/
├── unit/              # Unit tests for components, composables, and utilities
│   ├── components/    # Component tests
│   ├── composables/   # Composable function tests
│   └── utils/         # Utility function tests
└── integration/       # Integration tests for API routes and workflows
```

## Running Tests

```bash
# Run all tests
npm run test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Writing Tests

### Component Tests

Component tests use Vue Test Utils to mount and interact with Vue components:

```typescript
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' }
    })
    expect(wrapper.text()).toContain('Test')
  })
})
```

### Composable Tests

Composable tests verify the behavior of Vue composition functions:

```typescript
import { ref } from 'vue'
import { myComposable } from '@/composables/myComposable'

describe('myComposable', () => {
  it('returns expected values', () => {
    const data = ref({ test: 'value' })
    const result = myComposable(data)
    expect(result).toBeDefined()
  })
})
```

### Integration Tests

Integration tests verify the interaction between multiple components or API routes:

```typescript
describe('API Route', () => {
  it('returns expected response', async () => {
    // Test API logic
  })
})
```

## Coverage Goals

- **Minimum coverage**: 70%
- **Target coverage**: 80%+
- **Critical paths**: 90%+

## Best Practices

1. **Test behavior, not implementation**: Focus on what the component/function does, not how it does it
2. **Use descriptive test names**: Make it clear what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
4. **Mock external dependencies**: Use vi.mock() for external APIs and modules
5. **Keep tests fast**: Unit tests should run in milliseconds
6. **Test edge cases**: Include tests for error states, empty data, and boundary conditions

## Continuous Integration

Tests are automatically run on every push to the repository via GitHub Actions. The build will fail if:
- Any test fails
- Code coverage drops below the minimum threshold
- Linting errors are detected

## Tools Used

- **Vitest**: Fast unit test framework built on Vite
- **@vue/test-utils**: Official testing library for Vue components
- **jsdom**: Browser environment simulation
- **@vitest/coverage-v8**: Code coverage reporting
