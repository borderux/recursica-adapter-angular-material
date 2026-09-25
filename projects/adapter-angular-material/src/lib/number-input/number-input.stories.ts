import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { NumberInputComponent } from "./number-input.component";
import { StackComponent } from "../stack/stack.component";
import { TextComponent } from "../text/text.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `NumberInput.stories.tsx` /
 * `test/golden/ui-kit-numberinput--*.png`. Same composition shape as
 * `TextArea` — `rec-number-input` composes `rec-with-read-only-wrapper`
 * internally, so no story wraps it in an external `<rec-form-control-wrapper>`.
 */
const meta: Meta<NumberInputComponent> = {
  title: "UI-Kit/NumberInput",
  component: NumberInputComponent,
  decorators: [
    moduleMetadata({
      imports: [NumberInputComponent, StackComponent, TextComponent],
    }),
  ],
  argTypes: {
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    readOnly: { control: "boolean" },
    hideControls: { control: "boolean" },
  },
  args: {
    label: "Amount",
    placeholder: "Enter an amount",
    assistiveText: "Must be greater than 0",
    disabled: false,
    required: false,
    readOnly: false,
    hideControls: false,
  },
};
export default meta;

type Story = StoryObj<NumberInputComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-number-input
          label="Amount"
          placeholder="Enter an amount"
          assistiveText="Must be greater than 0"
          [defaultValue]="10"
          [min]="0"
          [max]="100"
        ></rec-number-input>
      </div>
    `,
  }),
};

export const SideBySideLayout: Story = {
  render: () => ({
    template: `
      <div style="width: 480px;">
        <rec-number-input
          formLayout="side-by-side"
          label="Amount"
          placeholder="Enter an amount"
          assistiveText="Must be greater than 0"
          [defaultValue]="10"
          [min]="0"
          [max]="100"
        ></rec-number-input>
      </div>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    template: `
      <rec-stack gap="1rem" style="width: 400px;">
        <rec-number-input label="Default" placeholder="Enter a number"></rec-number-input>
        <rec-number-input label="Disabled" placeholder="Disabled input" [disabled]="true"></rec-number-input>
        <rec-number-input label="Error" placeholder="Error state" error="Invalid amount"></rec-number-input>
        <rec-number-input label="Read Only" [value]="42" [readOnly]="true"></rec-number-input>
        <rec-number-input label="Required" [required]="true"></rec-number-input>
      </rec-stack>
    `,
  }),
};

const dollarSectionTemplate = `
  <ng-template #dollarSection>
    <rec-text>$</rec-text>
  </ng-template>
`;

export const WithLeftIcon: Story = {
  render: () => ({
    template: `
      ${dollarSectionTemplate}
      <div style="width: 320px;">
        <rec-number-input label="Price" placeholder="0.00" [leftSection]="dollarSection"></rec-number-input>
      </div>
    `,
  }),
};

const percentSectionTemplate = `
  <ng-template #percentSection>
    <rec-text>%</rec-text>
  </ng-template>
`;

export const WithRightIcon: Story = {
  render: () => ({
    template: `
      ${percentSectionTemplate}
      <div style="width: 320px;">
        <rec-number-input
          label="Percentage"
          placeholder="0"
          [rightSection]="percentSection"
          [hideControls]="true"
        ></rec-number-input>
      </div>
    `,
  }),
};

export const HiddenControls: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-number-input label="Zip Code" placeholder="Enter zip code" [hideControls]="true"></rec-number-input>
      </div>
    `,
  }),
};
