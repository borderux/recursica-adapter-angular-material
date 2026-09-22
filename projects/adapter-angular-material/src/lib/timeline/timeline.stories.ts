import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TimelineComponent } from "./timeline.component";
import { TimelineItemComponent } from "./timeline-item.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * reference's own `Timeline.stories.tsx` exactly: Default, BulletVariants.
 */
const meta: Meta<TimelineComponent> = {
  title: "UI-Kit/Timeline",
  component: TimelineComponent,
  decorators: [
    moduleMetadata({
      imports: [TimelineComponent, TimelineItemComponent],
    }),
  ],
};
export default meta;

type Story = StoryObj<TimelineComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-timeline [active]="1">
        <rec-timeline-item title="Commit created" timestamp="Yesterday" bulletVariant="default">
          You pushed 3 new commits to the repository.
        </rec-timeline-item>
        <rec-timeline-item title="Pull request opened" timestamp="2 days ago" bulletVariant="default">
          You opened a pull request for the feature branch.
        </rec-timeline-item>
        <rec-timeline-item title="Code review completed" timestamp="1 week ago" bulletVariant="default">
          Your pull request was approved by 2 reviewers.
        </rec-timeline-item>
        <rec-timeline-item title="Branch merged" timestamp="2 weeks ago" bulletVariant="default">
          Your feature branch was successfully merged into main.
        </rec-timeline-item>
      </rec-timeline>
    `,
  }),
};

export const BulletVariants: Story = {
  render: () => ({
    template: `
      <ng-template #checkIcon>
        <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </ng-template>
      <ng-template #rectIcon>
        <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
      </ng-template>
      <ng-template #avatarImg>
        <img
          src="https://avatars.githubusercontent.com/u/10353856?s=460&v=4"
          alt="avatar"
          style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;"
        />
      </ng-template>
      <rec-timeline [active]="1">
        <rec-timeline-item title="Default Bullet" timestamp="Standard configuration" bulletVariant="default">
          The default un-configured structural dot.
        </rec-timeline-item>
        <rec-timeline-item title="Icon Bullet" timestamp="Standard sized icons" bulletVariant="icon" [bullet]="checkIcon">
          A standard structural icon node mapping.
        </rec-timeline-item>
        <rec-timeline-item title="Alternative Icon" timestamp="Larger structural bounds" bulletVariant="icon-alternative" [bullet]="rectIcon">
          A slightly larger alternative bounding box for specialized icons.
        </rec-timeline-item>
        <rec-timeline-item title="Avatar Bullet" timestamp="Profile pictures" bulletVariant="avatar" [bullet]="avatarImg">
          Avatar mappings inherently drop borders and leverage specific opacity states.
        </rec-timeline-item>
      </rec-timeline>
    `,
  }),
};
