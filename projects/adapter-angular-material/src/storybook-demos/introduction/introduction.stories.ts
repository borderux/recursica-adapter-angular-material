import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { IntroductionDemoComponent } from "./introduction.component";
import { AdaptersDemoComponent } from "./adapters-demo.component";
import { VersionDemoComponent } from "./version-demo.component";

/**
 * Ported from the Mantine adapter's `Introduction.stories.tsx`. Story names
 * and ids (`introduction--welcome`, `introduction--adapters`) match it, so
 * cross-adapter links work.
 */
const meta: Meta = {
  title: "Introduction",
  decorators: [
    moduleMetadata({
      imports: [
        IntroductionDemoComponent,
        AdaptersDemoComponent,
        VersionDemoComponent,
      ],
    }),
  ],
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj;

export const Welcome: Story = {
  render: () => ({ template: `<storybook-demo-introduction />` }),
};

export const Adapters: Story = {
  render: () => ({ template: `<storybook-demo-adapters />` }),
};

export const VersionInfoStory: Story = {
  name: "Version Info",
  render: () => ({ template: `<storybook-demo-version />` }),
};
