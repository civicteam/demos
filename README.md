# nexus-demo

Demo projects showcasing Civic Nexus integrations.

## Projects

### [federated-auth-demo](./apps/federated-auth-demo)

A Next.js application demonstrating federated authentication with Civic Nexus. Features include:

- AI chat interface with MCP (Model Context Protocol) integration
- OAuth-based authentication flow
- Tool command visualization

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Installation

```bash
pnpm install
```

### Development

```bash
# Run the federated-auth-demo
pnpm dev
```

### Build

```bash
pnpm build
```

## Project Structure

```
nexus-demo/
├── apps/
│   └── federated-auth-demo/    # Federated auth demo app
├── package.json                 # Root workspace config
└── pnpm-workspace.yaml         # pnpm workspace definition
```
