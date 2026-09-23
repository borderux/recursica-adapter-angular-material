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
import { GroupComponent } from "../group/group.component";
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
      imports: [
        FormControlWrapperComponent,
        DemoFormControlDirective,
        GroupComponent,
      ],
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

/**
 * `error` takes priority over `assistiveText` — matching the React
 * reference (`VisualErrorState` there).
 */
export const VisualErrorState: Story = {
  args: {
    label: "Encryption Protocol",
    assistiveText: "We'll never share your email.",
    error: "Strict validation limits reached. Handshake rejected securely.",
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
 * The 4 stories below (`Default`/`RequiredArchitecture`/
 * `WithoutAssistiveIcons`/`NativeChildrenDirectly`) exist purely to give
 * this file 1:1 name/config parity with the React reference's own
 * `FormControlWrapper.stories.tsx`, per `docs/CREATING_AN_ADAPTER.md` step
 * 10 — each combines 2-3 concerns the way Mantine's originals do, on top
 * of (not replacing) the atomic `Stacked`/`SideBySide`/`WithHelperText`/
 * `Required`/`VisualErrorState` stories above, which stay as the
 * single-concern coverage.
 */

/** Mirrors the React reference's `Default` story exactly. */
export const Default: Story = {
  args: {
    label: "Account Username",
    formLayout: "stacked",
    assistiveText: "Validation occurs immediately natively.",
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-form-control-wrapper [formLayout]="formLayout" [label]="label" [assistiveText]="assistiveText">
        <input recDemoFormControl type="email" placeholder="you@example.com" style="width: 100%; box-sizing: border-box;" />
      </rec-form-control-wrapper>
    `,
  }),
};

/** Mirrors the React reference's `RequiredArchitecture` story exactly. */
export const RequiredArchitecture: Story = {
  args: {
    label: "Root Password",
    formLayout: "side-by-side",
    required: true,
    assistiveText: "Bypass string structure required to initiate protocol.",
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-form-control-wrapper [formLayout]="formLayout" [label]="label" [required]="required" [assistiveText]="assistiveText">
        <input recDemoFormControl type="email" placeholder="you@example.com" style="width: 100%; box-sizing: border-box;" />
      </rec-form-control-wrapper>
    `,
  }),
};

/** Mirrors the React reference's `WithoutAssistiveIcons` story exactly. */
export const WithoutAssistiveIcons: Story = {
  args: {
    label: "Server Domain",
    assistiveText:
      "A standard text boundary without default native icon parameters bounding.",
    assistiveWithIcon: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-form-control-wrapper [formLayout]="formLayout" [label]="label" [assistiveText]="assistiveText" [assistiveWithIcon]="assistiveWithIcon">
        <input recDemoFormControl type="email" placeholder="you@example.com" style="width: 100%; box-sizing: border-box;" />
      </rec-form-control-wrapper>
    `,
  }),
};

/**
 * Mirrors the React reference's `NativeChildrenDirectly` story, which wraps
 * a raw, un-styled `<input type="checkbox">` (no `TextField` mapping) to
 * prove native-child compatibility. Every story in this file already wraps
 * a bare native `<input>` — there's no `TextField`-equivalent component
 * here yet to bypass the way the React version bypasses its `TextField`
 * map — so this reuses the same `recDemoFormControl` directive already
 * established throughout this file for the id/`aria-describedby` wiring
 * demo, applied to a checkbox instead of a text input to match the React
 * story's exact "Raw HTML Checkbox" content.
 */
export const NativeChildrenDirectly: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Bypassing any wrapped-input mapping to show exactly how native `<input>` hooks execute inside the raw wrapper.",
      },
    },
  },
  args: {
    label: "Raw HTML Checkbox",
    formLayout: "side-by-side",
    assistiveText: "This wraps a raw HTML input tag mapping correctly.",
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-group gap="10px" wrap="nowrap">
        <rec-form-control-wrapper [formLayout]="formLayout" [label]="label" [assistiveText]="assistiveText">
          <input recDemoFormControl type="checkbox" style="margin: 0; width: 16px; height: 16px;" />
        </rec-form-control-wrapper>
      </rec-group>
    `,
  }),
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
