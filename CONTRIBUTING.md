# Contributing to OmniRequest

Thank you for considering contributing to OmniRequest! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check the existing issues to see if the problem has already been reported. If it has and the issue is still open, add a comment to the existing issue instead of opening a new one.

When creating a bug report, please include as much detail as possible:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (OS, browser, Node.js version, etc.)
- Any additional context

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- A detailed description of the proposed enhancement
- Any potential implementation details
- Why this enhancement would be useful to most users

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the tests and linting (`npm run validate`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`

## Project Structure

```
omnirequest/
├── dist/            # Compiled output
├── src/             # Source code
│   ├── adapters/    # Platform-specific adapters
│   ├── core/        # Core functionality
│   ├── middleware/  # Middleware components
│   ├── plugins/     # Plugins
│   ├── types/       # TypeScript type definitions
│   └── utils/       # Utility functions
├── examples/        # Example usage
└── tests/           # Test files
```

## Coding Guidelines

- Follow the existing code style
- Write clear, readable, and maintainable code
- Include comments for complex logic
- Write tests for new features
- Update documentation when necessary

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Example: `feat: add support for WebSocket connections`

## License

By contributing to OmniRequest, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
