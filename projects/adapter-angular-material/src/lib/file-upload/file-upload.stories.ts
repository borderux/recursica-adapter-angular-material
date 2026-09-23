import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FileUploadComponent } from "./file-upload.component";
import type { RecursicaFileUploadItem } from "../file-input/file-input-item";
import { StackComponent } from "../stack/stack.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `FileUpload.stories.tsx` /
 * `test/golden/ui-kit-fileupload--*.png`. State held in each story's own
 * `props`, reassigned inline in the template — same convention
 * `file-input.stories.ts`/`checkbox-group.stories.ts` already establish.
 */
function mockFile(name: string, size = 1024): File {
  return new File([new Uint8Array(size)], name);
}

const meta: Meta<FileUploadComponent> = {
  title: "UI-Kit/FileUpload",
  component: FileUploadComponent,
  decorators: [
    moduleMetadata({
      imports: [FileUploadComponent, StackComponent],
    }),
  ],
  argTypes: {
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    multiple: { control: "boolean" },
    accept: { control: "text" },
  },
};
export default meta;

type Story = StoryObj<FileUploadComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          assistiveText="Max file size 5MB"
          [files]="files"
          (filesAdded)="files = files.concat($any($event).map((file) => ({ file })))"
          (fileRemove)="files = files.filter((item) => (item.id ?? item.file.name) !== $event)"
        ></rec-file-upload>
      </rec-stack>
    `,
    props: { files: [] as RecursicaFileUploadItem[] },
  }),
};

export const WithFiles: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          assistiveText="Max file size 5MB"
          [files]="files"
          (filesAdded)="files = files.concat($any($event).map((file) => ({ file })))"
          (fileRemove)="files = files.filter((item) => (item.id ?? item.file.name) !== $event)"
        ></rec-file-upload>
      </rec-stack>
    `,
    props: {
      files: [
        { file: mockFile("document.pdf") },
        { file: mockFile("image.png") },
        { file: mockFile("spreadsheet.xlsx") },
      ] as RecursicaFileUploadItem[],
    },
  }),
};

export const EmptyState: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          [files]="files"
          (filesAdded)="files = files.concat($any($event).map((file) => ({ file })))"
          (fileRemove)="files = files.filter((item) => (item.id ?? item.file.name) !== $event)"
        ></rec-file-upload>
      </rec-stack>
    `,
    props: { files: [] as RecursicaFileUploadItem[] },
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 400px;">
        <rec-file-upload label="Upload Files" [disabled]="true" [files]="files"></rec-file-upload>
      </rec-stack>
    `,
    props: {
      files: [{ file: mockFile("document.pdf") }] as RecursicaFileUploadItem[],
    },
  }),
};

export const ErrorState: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 400px;">
        <rec-file-upload label="Upload Files" error="File upload failed. Please try again."></rec-file-upload>
      </rec-stack>
    `,
  }),
};

const starIconTemplate = `
  <ng-template #starIcon>
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z" />
    </svg>
  </ng-template>
`;

export const CustomIcon: Story = {
  render: () => ({
    template: `
      ${starIconTemplate}
      <rec-stack style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          [icon]="starIcon"
          [files]="files"
          (filesAdded)="files = files.concat($any($event).map((file) => ({ file })))"
          (fileRemove)="files = files.filter((item) => (item.id ?? item.file.name) !== $event)"
        ></rec-file-upload>
      </rec-stack>
    `,
    props: { files: [] as RecursicaFileUploadItem[] },
  }),
};

export const LongFilenames: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          [files]="files"
          (filesAdded)="files = files.concat($any($event).map((file) => ({ file })))"
          (fileRemove)="files = files.filter((item) => (item.id ?? item.file.name) !== $event)"
        ></rec-file-upload>
      </rec-stack>
    `,
    props: {
      files: [
        {
          file: mockFile(
            "quarterly-financial-report-final-version-approved.pdf",
          ),
        },
        { file: mockFile("2026-08-team-offsite-photos-and-notes.zip") },
        { file: mockFile("resume.docx") },
      ] as RecursicaFileUploadItem[],
    },
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          assistiveText="Submitted files cannot be changed"
          [readOnly]="true"
          [files]="files"
        ></rec-file-upload>
      </rec-stack>
    `,
    props: {
      files: [
        { file: mockFile("document.pdf") },
        { file: mockFile("image.png") },
      ] as RecursicaFileUploadItem[],
    },
  }),
};

export const AcceptRestriction: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          assistiveText="Only .pdf and .png files are accepted"
          accept=".pdf,.png"
          [files]="files"
          (filesAdded)="files = files.concat($any($event).map((file) => ({ file })))"
          (fileRemove)="files = files.filter((item) => (item.id ?? item.file.name) !== $event)"
        ></rec-file-upload>
      </rec-stack>
    `,
    props: { files: [] as RecursicaFileUploadItem[] },
  }),
};

export const MaxFilesRestriction: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          assistiveText="Up to 2 files allowed"
          [maxFiles]="2"
          [files]="files"
          (filesAdded)="files = files.concat($any($event).map((file) => ({ file })))"
          (fileRemove)="files = files.filter((item) => (item.id ?? item.file.name) !== $event)"
        ></rec-file-upload>
      </rec-stack>
    `,
    props: {
      files: [
        { file: mockFile("document.pdf") },
        { file: mockFile("image.png") },
      ] as RecursicaFileUploadItem[],
    },
  }),
};
