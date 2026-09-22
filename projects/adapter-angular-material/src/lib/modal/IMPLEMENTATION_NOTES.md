# Modal — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `Category: EASY–REQUIRES WORK` re-confirmed — `MatDialog` adopted

The stub's own `IMPLEMENTATION_NOTES.md` already flagged `MatDialog` as a
strong real match, with the real work being the declarative-vs-imperative
API translation. Re-confirmed at build time.

## `MatDialogContainer` adopted — a genuinely neutral shell, unlike `MatSelect`/`MatTabGroup`

`MatDialogContainer` is `ViewEncapsulation.None` (confirmed directly in the
compiled source) — the same category of finding that sank `MatSelect`/
`MatTabGroup` elsewhere in this adapter. The difference: `MatDialogTitle`/
`MatDialogContent`/`MatDialogActions`/`MatDialogClose` are all **bare
directives** with no fixed template of their own, and `MatDialog.open()`
accepts a `TemplateRef` directly — the dialog's actual content is 100% this
component's own template, never Material's fixed markup.
`MatDialogContainer` contributes no visible chrome beyond backdrop/
centering/focus-trap/animation — real, valuable accessibility behavior
(focus trap, focus restoration, `Escape`/backdrop-click closing, scroll
lock, `role="dialog"`/`aria-modal`) this adapter doesn't have to
hand-build the way `Dropdown` rebuilt `MatSelect`'s entire trigger model.

## Declarative `[opened]` wraps the imperative `open()`/`.close()`

`ngOnChanges` watches `opened`: rising edge opens the dialog with the
captured content `TemplateRef`; falling edge closes the held
`MatDialogRef`. `(closed)` fires from `MatDialogRef.afterClosed()`,
covering both a caller setting `[opened]="false"` and the user closing it
themselves (close button, backdrop, `Escape`) — one signal regardless of
cause, matching the reference's own single `onClose` callback shape.

## Global overlay CSS — same reachability finding as `Dropdown`/`HoverCard`

`@angular/cdk/dialog` portals content the same way CDK Overlay generally
does — this component's own scoped CSS cannot reach it, for the same
live-verified reason `dropdown.component.ts`'s own "a global stylesheet is
needed after all" section documents. `modal-overlay.css` carries the real
token styling, scoped under `.rec-modal-panel-content`.

**Real, additional finding not present in the other overlay components**:
Material's own theme constrains the _outer pane_ to a fixed 560px/280px
max/min-width by default via `--mat-dialog-container-max-width`/`-min-width`
CSS custom properties (confirmed in the compiled `.cdk-overlay-pane.mat-mdc-dialog-panel`
rule) — without resetting both to `none`/`0` on `.rec-modal-panel`, this
adapter's own (potentially larger) `max-width` token would have been
silently capped by Material's default. Caught by reading the compiled CSS
directly, not discovered by trial and error.

## Footer routing: named content projection, not `React.Children.forEach`

The reference's own `ModalBody` manually scans `children` at render time
to pull `Modal.Footer` into its own fixed-at-bottom slot. Angular's named
`<ng-content select="rec-modal-footer">` does this declaratively — see
`modal-footer.component.ts`'s own class doc comment, which also documents
why `ModalFooterComponent` gets a normal scoped `styleUrl` while
`ModalComponent`'s own chrome needs the global overlay treatment (a real,
non-obvious distinction: content projection changes where output is
inserted, not which component created it).

## Scroll dividers: a directive, not `@ViewChild`, plus a real `ResizeObserver` improvement

`ModalScrollDividerDirective` tracks `data-scrolled-top`/`-bottom` on the
scroll area. Not a `@ViewChild('scrollArea')` query on `ModalComponent`
itself: the dialog's content is instantiated through `@angular/cdk/dialog`'s
own `ViewContainerRef`, not one `ModalComponent`'s own template directives
create, so it's not reliably visible to `ModalComponent`'s own `@ViewChild`
results. A directive's own lifecycle hooks/host listeners fire correctly
regardless of which `ViewContainerRef` created its host view, sidestepping
that uncertainty entirely. Also uses a real `ResizeObserver` on top of the
reference's own mount+`scroll`+`window:resize` triggers — the reference
re-checks on its `children` _dependency_ changing (a different set of
elements), not the same children's own content growing/shrinking (e.g. an
image finishing loading); `ResizeObserver` catches both, a real
improvement available here with no React-hook dependency-array to
translate.

## Not built: the granular `Modal.Root`/`.Overlay`/`.Content`/`.Header`/`.Title`/`.CloseButton`/`.Body`

Confirmed by reading `Modal.stories.tsx` directly: all 3 golden stories use
only the top-level `<Modal opened title>children<Modal.Footer>` shape —
none exercise the reference's own "advanced composition" escape hatch.
Building 7 additional public sub-components with no golden coverage would
be speculative scope.

## `@angular-eslint/prefer-inject`: used `inject()` from the start

Same discipline as `HoverCard` — this component's own DI (`MatDialog`,
`ElementRef` in the scroll directive) uses `inject()` from the start
rather than adding a new instance of the constructor-injection debt
several already-shipped components in this adapter carry.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean, first pass. All 3 golden-matching stories (Default,
LongTitle, ScrollingContent) confirmed registered and compiling with zero
webpack errors in a live Storybook dev server (port 6007, isolated from
the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual dialog open/close
behavior, focus trap, scroll-divider toggling, and title truncation were
all reasoned from the code, not click-verified. Also not verified live:
whether Material's dialog open/close _animation_ actually plays without a
consuming app configuring `provideAnimations()`/`BrowserAnimationsModule`
— functionally the dialog opens/closes either way (confirmed `MatDialog`
is `providedIn: 'root'`, no required module import), but the animation
itself may degrade to instant without it. Not a new adapter-wide
requirement beyond what any Material-based Angular app already needs.
