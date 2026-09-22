import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  forwardRef,
  inject,
} from "@angular/core";
import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FormControlWrapperComponent } from "./form-control-wrapper.component";
import {
  RECURSICA_FORM_CONTROL,
  RecursicaFormControl,
} from "../utils/recursica-form-control";

/**
 * Demo-only stand-in for a real Recursica input component (`TextField`,
 * etc. — not yet built). Proves the `RECURSICA_FORM_CONTROL`/`ContentChild`
 * id/`aria-describedby` wiring end to end (see
 * `form-control-wrapper.component.ts`'s class doc comment) against a plain
 * `<input>`, the same way a real future field component would: provide
 * itself under the token, own its own `id`, and apply whatever
 * `aria-describedby` ids `FormControlWrapper` computes.
 */
@Directive({
  selector: "input[recDemoFormControl]",
  providers: [
    {
      provide: RECURSICA_FORM_CONTROL,
      useExisting: forwardRef(() => DemoFormControlDirective),
    },
  ],
})
class DemoFormControlDirective implements RecursicaFormControl, AfterViewInit {
  private static nextId = 0;
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  @Input() id = `demo-control-${DemoFormControlDirective.nextId++}`;

  /**
   * `@Input() id` alone doesn't reflect onto the real native `id`
   * attribute — declaring an `@Input()` doesn't create a write-back
   * binding to the DOM the way `class`/`style` are specially handled;
   * it just makes the property settable from a template binding. Verified
   * live: without this, `label[for]` pointed at an id no real element
   * carried at all, silently breaking the label/input association.
   */
  ngAfterViewInit(): void {
    this.elementRef.nativeElement.id = this.id;
  }

  setDescribedByIds(ids: string[]): void {
    if (ids.length) {
      this.elementRef.nativeElement.setAttribute(
        "aria-describedby",
        ids.join(" "),
      );
    } else {
      this.elementRef.nativeElement.removeAttribute("aria-describedby");
    }
  }
}

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention.
 */
const meta: Meta<FormControlWrapperComponent> = {
  title: "UI-Kit/FormControlWrapper",
  component: FormControlWrapperComponent,
  decorators: [
    moduleMetadata({
      imports: [FormControlWrapperComponent, DemoFormControlDirective],
    }),
  ],
  argTypes: {
    formLayout: { control: "radio", options: ["stacked", "side-by-side"] },
    required: { control: "boolean" },
  },
  args: {
    formLayout: "stacked",
    label: "Email address",
    required: false,
  },
};
export default meta;

type Story = StoryObj<FormControlWrapperComponent>;

const template = `
  <rec-form-control-wrapper [formLayout]="formLayout" [label]="label" [required]="required">
    <input recDemoFormControl type="email" placeholder="you@example.com" style="width: 100%; box-sizing: border-box;" />
  </rec-form-control-wrapper>
`;

export const Stacked: Story = {
  render: (args) => ({ props: args, template }),
};

export const SideBySide: Story = {
  args: { formLayout: "side-by-side" },
  render: (args) => ({ props: args, template }),
};

/**
 * `assistiveText`: renders via `<rec-assistive-element>`, wired to the
 * projected `input[recDemoFormControl]`'s `aria-describedby` via
 * `RECURSICA_FORM_CONTROL` — verify live via `getAttribute('aria-describedby')`.
 */
export const WithHelperText: Story = {
  args: { assistiveText: "We'll never share your email." },
  render: (args) => ({
    props: args,
    template: `
      <rec-form-control-wrapper [formLayout]="formLayout" [label]="label" [required]="required" [assistiveText]="assistiveText">
        <input recDemoFormControl type="email" placeholder="you@example.com" style="width: 100%; box-sizing: border-box;" />
      </rec-form-control-wrapper>
    `,
  }),
};

/** `error` takes priority over `assistiveText` — matching the React reference. */
export const WithError: Story = {
  args: {
    assistiveText: "We'll never share your email.",
    error: "Please enter a valid email address.",
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-form-control-wrapper [formLayout]="formLayout" [label]="label" [required]="required" [assistiveText]="assistiveText" [error]="error">
        <input recDemoFormControl type="email" placeholder="you@example.com" style="width: 100%; box-sizing: border-box;" />
      </rec-form-control-wrapper>
    `,
  }),
};

export const Required: Story = {
  args: { required: true },
  render: (args) => ({ props: args, template }),
};

/**
 * `overStyled` escape hatch: `overClass`/`overStyle` are only forwarded
 * onto this component's own root when `overStyled` is `true` — see
 * `docs/STYLING_SYSTEM.md` §6.
 */
export const OverStyledEscapeHatch: Story = {
  args: {
    overStyled: true,
    overStyle: { "background-color": "#2962ff33", padding: "8px" },
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-form-control-wrapper
        [formLayout]="formLayout"
        [label]="label"
        [overStyled]="overStyled"
        [overStyle]="overStyle"
      >
        <input recDemoFormControl type="email" placeholder="you@example.com" style="width: 100%; box-sizing: border-box;" />
      </rec-form-control-wrapper>
    `,
  }),
};
