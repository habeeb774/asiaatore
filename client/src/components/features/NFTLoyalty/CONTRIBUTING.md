# Contributing to NFT Loyalty Program

Thank you for your interest in contributing to the NFT Loyalty Program component! This document provides guidelines and information for contributors.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/my-store/nft-loyalty.git
   cd nft-loyalty
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Run linting**
   ```bash
   npm run lint
   ```

## Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **Jest** for testing

### Code Standards

- Use functional components with hooks
- Follow React best practices
- Use TypeScript for type safety (future migration)
- Write comprehensive tests for new features
- Follow conventional commit messages

### File Structure

```
src/
├── components/
│   ├── NFTLoyalty.jsx          # Main component
│   ├── NFTLoyaltyTest.jsx      # Test component
│   └── index.js                # Exports
├── __mocks__/                  # Test mocks
├── __tests__/                  # Test files
├── utils/                      # Utility functions
└── hooks/                      # Custom hooks
```

## Testing

- Write unit tests for all new features
- Maintain >80% code coverage
- Test both success and error scenarios
- Use React Testing Library for component tests

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### PR Requirements

- [ ] Tests pass
- [ ] Code is linted
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Screenshots for UI changes

## Commit Convention

This project follows [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

## Issues

- Use GitHub issues for bug reports and feature requests
- Provide detailed reproduction steps for bugs
- Include browser/OS information
- Attach screenshots for UI issues

## Documentation

- Update README.md for new features
- Add JSDoc comments for new functions
- Update CHANGELOG.md for releases
- Maintain API documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue or contact the maintainers for questions about contributing.