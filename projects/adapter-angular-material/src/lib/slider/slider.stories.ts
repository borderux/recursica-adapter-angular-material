import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { SliderComponent } from "./slider.component";
import { StackComponent } from "../stack/stack.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * reference's own `Slider.stories.tsx` — same composition shape as
 * `NumberInput` — `rec-slider` composes `rec-with-read-only-wrapper`
 * internally, so no story wraps it in an external `<rec-form-control-wrapper>`.
 * `FormLayouts` (a `render`-only story with no controllable `args` in the
 * reference) is reproduced with a literal two-instance template, the same
 * translation `text-area.stories.ts`'s own layout-comparison story uses.
 */
const meta: Meta<SliderComponent> = {
  title: "UI-Kit/Slider",
  component: SliderComponent,
  decorators: [
    moduleMetadata({
      imports: [SliderComponent, StackComponent],
    }),
  ],
  argTypes: {
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    readOnly: { control: "boolean" },
    showInput: { control: "boolean" },
    showMinMaxLabels: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<SliderComponent>;

export const Default: Story = {
  args: {
    label: "Auditory Threshold",
    assistiveText: "Specify the maximum decibel frequency boundary.",
    defaultValue: 60,
    min: 10,
    max: 100,
    step: 1,
    showMinMaxLabels: true,
  },
};

export const WithInputField: Story = {
  args: {
    ...Default.args,
    showInput: true,
  },
};

export const SideBySideLayout: Story = {
  args: {
    ...Default.args,
    formLayout: "side-by-side",
  },
};

export const Disabled: Story = {
  args: {
    label: "Decommissioned Server Node",
    assistiveText: "Modifications to this environment are frozen.",
    defaultValue: 35,
    disabled: true,
  },
};

export const ErrorState: Story = {
  args: {
    label: "Core Temperature Alert",
    assistiveText:
      "Severe core degradation across the hypervisor socket cluster.",
    defaultValue: 85,
    error: "Thermal overload threshold exceeded.",
    required: true,
  },
};

export const StaticReadOnly: Story = {
  args: {
    label: "System Calibration Metrics",
    assistiveText:
      "Frozen baseline calibrations derived during initial staging.",
    value: 65,
    readOnly: true,
  },
};

export const EditableReadOnly: Story = {
  args: {
    label: "Adaptive Node Output",
    assistiveText:
      "Click edit to unlock bidirectional input parameter boundaries.",
    defaultValue: 15,
    readOnly: true,
    labelWithEditIcon: true,
  },
};

export const WithMarks: Story = {
  args: {
    label: "Interactive Marks Map",
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 10,
    marks: [
      { value: 0, label: "0%" },
      { value: 25, label: "25%" },
      { value: 50, label: "50%" },
      { value: 75, label: "75%" },
      { value: 100, label: "100%" },
    ],
    showMinMaxLabels: false,
  },
};

const volumeIconTemplate = `
  <ng-template #volumeIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    </svg>
  </ng-template>
`;

const volumeLoudIconTemplate = `
  <ng-template #volumeLoudIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
  </ng-template>
`;

export const WithIconsAndLabels: Story = {
  render: () => ({
    template: `
      ${volumeIconTemplate}
      ${volumeLoudIconTemplate}
      <rec-slider
        label="Volume"
        assistiveText="Icons flank the track; min/max labels replace the raw bounds."
        [defaultValue]="60"
        minLabel="Quiet"
        maxLabel="Loud"
        [icon]="volumeIcon"
        [trailingIcon]="volumeLoudIcon"
      ></rec-slider>
    `,
  }),
};

export const RangeMode: Story = {
  args: {
    label: "Price Range",
    assistiveText: "Pass a [number, number] tuple to render two thumbs.",
    defaultValue: [20, 80],
    min: 0,
    max: 100,
    showMinMaxLabels: true,
  },
};

export const RangeModeWithInputs: Story = {
  args: {
    ...RangeMode.args,
    showInput: true,
  },
};

export const RangeModeWithIconsAndInputs: Story = {
  render: () => ({
    template: `
      ${volumeIconTemplate}
      ${volumeLoudIconTemplate}
      <rec-slider
        label="Price Range"
        assistiveText="Full range usage: leading/trailing icons, min/max label overrides, and both bound inputs."
        [defaultValue]="[20, 80]"
        [min]="0"
        [max]="100"
        [showInput]="true"
        minLabel="$0"
        maxLabel="$100"
        [icon]="volumeIcon"
        [trailingIcon]="volumeLoudIcon"
      ></rec-slider>
    `,
  }),
};

export const FormLayouts: Story = {
  render: () => ({
    template: `
      <rec-stack gap="2.5rem" style="max-width: 600px;">
        <rec-slider
          label="Stacked Layout"
          assistiveText="This is the standard top-to-bottom stacked form layout."
          [defaultValue]="40"
          formLayout="stacked"
        ></rec-slider>
        <rec-slider
          label="Side-by-Side Layout"
          assistiveText="This is the side-by-side layout aligning label beside control."
          [defaultValue]="60"
          formLayout="side-by-side"
        ></rec-slider>
      </rec-stack>
    `,
  }),
};
