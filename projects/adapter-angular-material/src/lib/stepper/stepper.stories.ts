import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { StepperComponent } from "./stepper.component";
import { StepComponent } from "./stepper-step.component";
import { StepperCompletedComponent } from "./stepper-completed.component";
import { StackComponent } from "../stack/stack.component";
import { GroupComponent } from "../group/group.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention, matching the
 * source-of-truth `Stepper.stories.tsx`'s own story names exactly
 * (Default/Small/Vertical/LayoutStressTest — the golden screenshot ids
 * `ui-kit-stepper--default`/`--small`/`--vertical`/`--layout-stress-test`
 * come straight from these).
 *
 * The source-of-truth's `InteractiveStepper`/`StressTestStepper` wrap
 * `useState` around `active` and re-render on a "Previous step"/"Next step"
 * click. There's no Angular equivalent of a React local-state wrapper
 * component declared inline in a stories file (no other `*.stories.ts` in
 * this adapter does this — see `tabs.stories.ts`'s static `defaultValue`
 * for the existing convention of avoiding it), so this uses Storybook
 * Angular's own established pattern instead: `active` lives as a plain
 * property on the story's synthetic component context (`props`), mutated
 * directly by template click-handler expressions
 * (`(click)="active = active - 1"`) — ordinary Angular change detection
 * (this adapter's default `ChangeDetectionStrategy`, never `OnPush`)
 * re-renders `[active]` on `<rec-stepper>` the same way it would for any
 * other zone-triggered click.
 */
const meta: Meta<StepperComponent> = {
  title: "UI-Kit/Stepper",
  component: StepperComponent,
  decorators: [
    moduleMetadata({
      imports: [
        StepperComponent,
        StepComponent,
        StepperCompletedComponent,
        StackComponent,
        GroupComponent,
      ],
    }),
  ],
  argTypes: {
    size: {
      control: "radio",
      options: ["small", "large"],
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
    },
  },
};
export default meta;

type Story = StoryObj<StepperComponent>;

const buttonStyle =
  "border: 1px solid #c40033; color: #c40033; background: none; border-radius: 999px; padding: 8px 20px; cursor: pointer;";
const buttonStyleDisabled =
  "border: 1px solid #c9c9c9; color: #c9c9c9; background: none; border-radius: 999px; padding: 8px 20px; cursor: not-allowed;";

const template = `
  <rec-stack gap="0" style="width: 600px;">
    <rec-stepper [active]="active" [size]="size" [orientation]="orientation" (stepClick)="active = $event">
      <rec-stepper-step
        label="First step"
        description="Create an account and set up your billing profile"
      />
      <rec-stepper-step
        label="Second step"
        description="Verify email and ensure all notification preferences are correct"
      />
      <rec-stepper-step label="Final step" description="Get full access" />
      <rec-stepper-completed>Completed, click back button to get to previous step</rec-stepper-completed>
    </rec-stepper>

    <rec-group justify="center" wrap="nowrap" gap="8px" style="margin-top: 24px;">
      <button
        [attr.style]="active === 0 ? disabledStyle : enabledStyle"
        [disabled]="active === 0"
        (click)="active = active > 0 ? active - 1 : active"
      >Previous step</button>
      <button
        [attr.style]="active === 3 ? disabledStyle : enabledStyle"
        [disabled]="active === 3"
        (click)="active = active < 3 ? active + 1 : active"
      >Next step</button>
    </rec-group>
  </rec-stack>
`;

const stressTestTemplate = `
  <rec-stack gap="0" style="width: 600px;">
    <rec-stepper [active]="active" [size]="size" [orientation]="orientation" (stepClick)="active = $event">
      <rec-stepper-step
        label="This is an extremely long step title designed to test how the layout handles multiline text wrapping and constraints"
        description="Create an account and set up your billing profile"
      />
      <rec-stepper-step
        label="Second step"
        description="Verify email and ensure all notification preferences are correct"
      />
      <rec-stepper-step label="Final step" />
      <rec-stepper-completed>Completed, click back button to get to previous step</rec-stepper-completed>
    </rec-stepper>

    <rec-group justify="center" wrap="nowrap" gap="8px" style="margin-top: 24px;">
      <button
        [attr.style]="active === 0 ? disabledStyle : enabledStyle"
        [disabled]="active === 0"
        (click)="active = active > 0 ? active - 1 : active"
      >Previous step</button>
      <button
        [attr.style]="active === 3 ? disabledStyle : enabledStyle"
        [disabled]="active === 3"
        (click)="active = active < 3 ? active + 1 : active"
      >Next step</button>
    </rec-group>
  </rec-stack>
`;

export const Default: Story = {
  render: (args) => ({
    props: {
      ...args,
      active: 1,
      enabledStyle: buttonStyle,
      disabledStyle: buttonStyleDisabled,
    },
    template,
  }),
  args: {
    size: "large",
    orientation: "horizontal",
  },
};

export const Small: Story = {
  render: (args) => ({
    props: {
      ...args,
      active: 1,
      enabledStyle: buttonStyle,
      disabledStyle: buttonStyleDisabled,
    },
    template,
  }),
  args: {
    size: "small",
    orientation: "horizontal",
  },
};

export const Vertical: Story = {
  render: (args) => ({
    props: {
      ...args,
      active: 1,
      enabledStyle: buttonStyle,
      disabledStyle: buttonStyleDisabled,
    },
    template,
  }),
  args: {
    size: "large",
    orientation: "vertical",
  },
};

export const LayoutStressTest: Story = {
  render: (args) => ({
    props: {
      ...args,
      active: 1,
      enabledStyle: buttonStyle,
      disabledStyle: buttonStyleDisabled,
    },
    template: stressTestTemplate,
  }),
  args: {
    size: "large",
    orientation: "horizontal",
  },
};

/**
 * `overStyled` escape hatch on the root — `overClass`/`overStyle` are only
 * forwarded onto `.root` when `overStyled` is `true`, see
 * `docs/STYLING_SYSTEM.md` §6.
 */
export const OverStyledEscapeHatch: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 600px;">
        <rec-stepper [active]="1" [overStyled]="true" [overStyle]="{ 'background-color': '#fff3f5' }">
          <rec-stepper-step label="One" />
          <rec-stepper-step label="Two" />
          <rec-stepper-step label="Three" />
        </rec-stepper>
      </rec-stack>
    `,
  }),
};
