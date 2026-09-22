import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ModalComponent } from "./modal.component";
import { ModalFooterComponent } from "./modal-footer.component";
import { ButtonComponent } from "../button/button.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `Modal.stories.tsx` / `test/golden/ui-kit-modal--*.png`.
 * Each story starts `opened`, matching the reference's own "starts opened
 * so the modal is visible without pressing a button first" convention —
 * `opened`/`(openedChange)` is reassigned inline in the template, the same
 * controlled-value convention `checkbox-group.stories.ts`/
 * `file-input.stories.ts` already establish.
 */
const meta: Meta<ModalComponent> = {
  title: "UI-Kit/Modal",
  component: ModalComponent,
  decorators: [
    moduleMetadata({
      imports: [ModalComponent, ModalFooterComponent, ButtonComponent],
    }),
  ],
};
export default meta;

type Story = StoryObj<ModalComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-modal title="Authentication Required" [opened]="opened" (openedChange)="opened = $event">
        Please log in to continue accessing this feature.
        <rec-modal-footer>
          <rec-button variant="outline" (click)="opened = false">Cancel</rec-button>
          <rec-button variant="solid" (click)="opened = false">Confirm</rec-button>
        </rec-modal-footer>
      </rec-modal>
      <rec-button variant="solid" (click)="opened = true">Open Modal</rec-button>
    `,
    props: { opened: true },
  }),
};

export const LongTitle: Story = {
  render: () => ({
    template: `
      <rec-modal
        title="This Modal Title Is Deliberately Long Enough To Exceed The Available Header Width"
        [opened]="opened"
        (openedChange)="opened = $event"
      >
        The title above is longer than the header can display, so it truncates with an ellipsis instead of wrapping onto a second line.
        <rec-modal-footer>
          <rec-button variant="solid" (click)="opened = false">Got it</rec-button>
        </rec-modal-footer>
      </rec-modal>
      <rec-button variant="solid" (click)="opened = true">Open Modal</rec-button>
    `,
    props: { opened: true },
  }),
};

const scrollingParagraphs = Array.from(
  { length: 20 },
  (_, i) => `<p>Scrolling content block ${i + 1}...</p>`,
).join("\n");

export const ScrollingContent: Story = {
  render: () => ({
    template: `
      <rec-modal title="Terms and Conditions" [opened]="opened" (openedChange)="opened = $event">
        <p>This modal demonstrates the dynamically injected scroll dividers. When this body content overflows, the borders between the Header and Footer automatically appear to define the scrolling boundary.</p>
        ${scrollingParagraphs}
        <rec-modal-footer>
          <rec-button variant="outline" (click)="opened = false">Decline</rec-button>
          <rec-button variant="solid" (click)="opened = false">Accept Terms</rec-button>
        </rec-modal-footer>
      </rec-modal>
      <rec-button variant="solid" (click)="opened = true">Open Scrolling Modal</rec-button>
    `,
    props: { opened: true },
  }),
};
