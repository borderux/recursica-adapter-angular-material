# @recursica/adapter-angular-material

## 0.3.1

### Patch Changes

- da27761: Fixed readme and package.json

## 0.3.0

### Minor Changes

- c7c2e24: Fixed and corrected build output
- ff354d6: Addded Link, Accordion, and Toast components

### Patch Changes

- c7c2e24: Fixed dist build: 6 of 9 overlay CSS files (popover, modal, date-picker, panel, auto-complete, hover-card) weren't copied to dist, the published version was hardcoded to 0.0.0, and none of the overlay CSS files were resolvable via package.json's exports map. Added a `./*.css` wildcard export so every overlay CSS file resolves without needing an individual entry.

## 0.2.0

### Minor Changes

- f72d6f5: Working all components and debugging

This file is managed by [Changesets](https://github.com/changesets/changesets) — entries are added automatically here when a changeset-driven release runs (see `CONTRIBUTING.md` for how to add a changeset to a pull request). No releases have been published yet, so there is nothing to list.
