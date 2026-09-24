# @recursica/adapter-angular-material

An Angular library built with TypeScript and **Angular Material 20+** (`@angular/material`/`@angular/cdk`). This package serves as a UI kit for Recursica applications, providing reusable Angular components, centralized theme configuration, and a Storybook environment for development — built with the Angular CLI/`ng-packagr`, not Vite, and using `@storybook/angular`, not `@storybook/react-vite`.

## Using Theme Forge to update styles

You can publish new themes by creating pull requests directly from [https://forge.recursica.com](https://forge.recursica.com). Your pull request will have a preview build you can review your style changes with.

## Installation

```bash
npm install @recursica/adapter-angular-material @angular/material @angular/cdk
```

## Peer Dependencies

This library requires the following peer dependencies to be installed in your project (see this package's own `package.json` `peerDependencies` for the authoritative version ranges):

```bash
npm install @angular/cdk@^20.2.14 @angular/material@^20.2.14 @angular/core @angular/common @angular/forms @angular/platform-browser rxjs
```

## Philosophy

Please read [PHILOSOPHY.md](./docs/PHILOSOPHY.md) to understand the core principles of the adapter.

## Developer & AI Guidelines

This repository provides dedicated routing documents for both human developers and AI Agents to ensure strict adherence to our design system constraints.

- **For Human Developers:** This `README.md` acts as your primary routing document. If you are integrating this library into an application, please read [USAGE.md](./USAGE.md) (published alongside this README). If you are building or modifying components inside this library, please read [CONTRIBUTING.md](https://github.com/borderux/recursica-adapter-angular-material/blob/main/CONTRIBUTING.md) (contributor-facing, not published in the npm package).
- **For AI Agents:** All AI Agents operating in this repository must start by reading [AGENT.md](https://github.com/borderux/recursica-adapter-angular-material/blob/main/AGENT.md), which serves as the primary routing document for AI workflows.

## Development and Architecture

This project is built using:

- **Angular CLI / `ng-packagr`**: for building the library (`ng build`), producing `.mjs`/`.d.ts`/`.css` outputs — not Vite.
- **Angular Material 20+ (`@angular/material`, `@angular/cdk`)**: base components/directives and Angular's own Sass-based theming system.
- **Storybook (`@storybook/angular`)**: used for interactive component development and documentation. Note this is the Angular-CLI-builder-based framework, not the newer Vite-based `@storybook/angular-vite` — see [`docs/CREATING_AN_ADAPTER.md`](docs/CREATING_AN_ADAPTER.md)'s decisions log for why the latter doesn't work against this repo's pinned Angular 20.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for more details, and [`docs/STYLING_SYSTEM.md`](docs/STYLING_SYSTEM.md) for how this adapter styles components on top of Angular Material.

### Developing with Storybook locally

If you're contributing or developing locally, clone the repository and run:

```bash
npm install
npm run dev
```

This spins up a local Storybook instance (`http://localhost:6006`) for component prototyping.

## TypeScript Support

All components include full TypeScript support with their `@Input()` surface documented in the component's own JSDoc (rendered into Storybook's Docs panel via Compodoc — see [docs/COMPONENT_STORYBOOK_GUIDE.md](./docs/COMPONENT_STORYBOOK_GUIDE.md)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
