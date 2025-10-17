# Contributing to OpsPilot AI

Thank you for your interest in contributing to OpsPilot AI! This document provides guidelines for contributing to the project.

## 🎯 Project Goals

OpsPilot AI aims to demonstrate:
1. Agentic AI workflows with tool chaining
2. Production-ready AWS incident response
3. Safe automation with guardrails
4. Complete observability and audit trails

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- AWS Account with Bedrock access
- Git
- Basic understanding of TypeScript and AWS services

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/opspilot-ai.git
cd opspilot-ai

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Build the project
npm run build

# Run tests
npm test
```

## 📝 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

Follow these guidelines:
- Write clean, readable TypeScript code
- Add tests for new features
- Update documentation
- Follow existing code style

### 3. Test Your Changes

```bash
# Run tests
npm test

# Build to catch TypeScript errors
npm run build

# Test locally with CLI
npm run cli test-incident
```

### 4. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "Add feature: description of what you added"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 🏗️ Code Structure

```
opspilot-ai/
├── src/
│   ├── agent/          # Core agent logic
│   ├── aws/            # AWS service integrations
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── lambda/         # Lambda handler
│   └── __tests__/      # Unit tests
├── frontend/           # Next.js dashboard
├── cdk/               # Infrastructure as code
├── examples/          # Example usage
└── docs/              # Documentation
```

## 📋 Contribution Ideas

### High Priority

- [ ] Add support for more AWS services (ECS, EC2, RDS)
- [ ] Implement multi-region support
- [ ] Add more sophisticated anomaly detection
- [ ] Create integration tests with real AWS services
- [ ] Add support for custom remediation actions

### Medium Priority

- [ ] Improve frontend with real-time updates
- [ ] Add webhook notifications (Slack, PagerDuty)
- [ ] Implement incident history analysis
- [ ] Add cost optimization suggestions
- [ ] Create Terraform templates

### Nice to Have

- [ ] Add support for on-premise resources
- [ ] Implement machine learning for pattern recognition
- [ ] Create mobile app for incident monitoring
- [ ] Add support for custom AI models
- [ ] Implement incident prediction

## 🧪 Testing Guidelines

### Writing Tests

```typescript
describe('MyFeature', () => {
  it('should do something', async () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = await myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test Coverage

- Aim for >80% code coverage
- Test happy paths and error cases
- Mock AWS services in unit tests
- Use integration tests for E2E flows

## 📚 Documentation

### Code Comments

```typescript
/**
 * Brief description of what the function does
 * 
 * @param param1 - Description of param1
 * @param param2 - Description of param2
 * @returns Description of return value
 * 
 * @example
 * ```typescript
 * const result = myFunction('test', 123);
 * ```
 */
async function myFunction(param1: string, param2: number): Promise<Result> {
  // Implementation
}
```

### Documentation Files

When adding new features, update:
- `README.md` - If it changes high-level functionality
- `docs/API.md` - For new APIs
- `docs/ARCHITECTURE.md` - For architectural changes
- `docs/QUICKSTART.md` - For new getting started steps

## 🎨 Code Style

### TypeScript

- Use TypeScript strict mode
- Define interfaces for complex types
- Avoid `any` when possible (use `unknown` if needed)
- Use async/await over promises

### Naming Conventions

```typescript
// Classes: PascalCase
class OpsPilotAgent {}

// Functions/methods: camelCase
async function handleIncident() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Interfaces: PascalCase
interface Incident {}

// Private properties: prefix with _
private _internalState: string;
```

### File Organization

```typescript
// 1. Imports
import { Something } from 'somewhere';

// 2. Types/Interfaces
interface MyType {}

// 3. Constants
const CONSTANT = 'value';

// 4. Class/Functions
class MyClass {}

// 5. Exports
export { MyClass };
```

## 🔒 Security

### Best Practices

- Never commit AWS credentials
- Use environment variables for sensitive data
- Implement least-privilege IAM policies
- Validate all user inputs
- Use secure random for IDs
- Enable encryption at rest

### Reporting Security Issues

Please report security vulnerabilities privately to:
security@opspilot-ai.example.com

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: What happened?
2. **Expected**: What should have happened?
3. **Steps to Reproduce**: How to recreate the bug?
4. **Environment**: OS, Node version, AWS region
5. **Logs**: Relevant error messages
6. **Code**: Minimal code to reproduce

Example:

```markdown
**Bug**: Lambda function crashes on timeout

**Expected**: Should handle timeout gracefully

**Steps**:
1. Create incident with Lambda ARN
2. Set timeout to 1 second
3. Run handleIncident()

**Environment**:
- OS: Ubuntu 22.04
- Node: 18.17.0
- Region: us-east-1

**Logs**:
```
Error: Timeout after 1000ms
  at OpsPilotAgent.handleIncident
```
```

## 🌟 Feature Requests

When requesting features:

1. **Use Case**: Why is this needed?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other approaches considered?
4. **Additional Context**: Screenshots, examples, etc.

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on what's best for the project
- Accept constructive criticism gracefully
- Show empathy towards others

## 🎓 Learning Resources

### AWS Services

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [CloudWatch User Guide](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/)

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Agentic AI

- [Anthropic Claude](https://www.anthropic.com/claude)
- [ReAct Pattern](https://arxiv.org/abs/2210.03629)
- [Tool Use in LLMs](https://www.anthropic.com/news/tool-use-ga)

## ❓ Questions?

- Open a [GitHub Discussion](https://github.com/wildhash/opspilot-ai/discussions)
- Check [existing issues](https://github.com/wildhash/opspilot-ai/issues)
- Read the [documentation](docs/)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to OpsPilot AI! 🚀
