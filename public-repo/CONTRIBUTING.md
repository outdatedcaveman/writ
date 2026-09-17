# Contributing to Writ Studio

We welcome contributions from writers, philosophers, software engineers, and designers!

## Development Guidelines

1. **Rule 1: Zero Permanent Deletion**:
   Any action that removes content must route to the recoverable Safety Trash. Never implement irreversible deletion pathways.
2. **Rule 2: Privacy & Security**:
   Never log, transmit, or hardcode private user tokens, API keys, or manuscript drafts to third-party endpoints without explicit user action.
3. **Magnum Rule: Visual First GUI**:
   Ensure all capabilities are accessible via visual controls in the interface. Keyboard shortcuts and commands are supplemental enhancements, never prerequisites.

## Pull Request Process

1. Fork the repo and create a feature branch (`git checkout -b feature/my-feature`).
2. Run test suites: `npm test` or `node --test tests/*.test.mjs`.
3. Verify build: `npm run build`.
4. Commit your changes and open a Pull Request with a clear description of the enhancement.
