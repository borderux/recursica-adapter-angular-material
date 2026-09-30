import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FileUploadComponent } from "./file-upload.component";
import type { RecursicaFileUploadItem } from "../file-input/file-input-item";

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

/**
 * Angular's template expression parser doesn't support arrow-function
 * literals (`(file) => ({ file })`) inline in a binding — only property
 * reads and method calls. These helpers live in real TypeScript, outside
 * the template string, and are exposed to the template via `props` instead
 * — same fix already applied in `file-input.stories.ts` (see that file's
 * own doc comment); this file's own stories were written with the broken
 * inline-arrow-function form despite the header comment above claiming to
 * follow that convention, silently failing every story that used them
 * (confirmed live: Angular JIT template compilation threw a `Parser Error`
 * and the story never rendered at all, caught by `adapter-tester`'s
 * `--divergence-only` run timing out on `page.waitForSelector` for
 * `#storybook-root`, not by reading source).
 */
function toFileItems(files: File[]): RecursicaFileUploadItem[] {
  return files.map((file) => ({ file }));
}

function removeFileItem(
  items: RecursicaFileUploadItem[],
  id: string,
): RecursicaFileUploadItem[] {
  return items.filter((item) => (item.id ?? item.file.name) !== id);
}

const meta: Meta<FileUploadComponent> = {
  title: "UI-Kit/FileUpload",
  component: FileUploadComponent,
  decorators: [
    moduleMetadata({
      imports: [FileUploadComponent],
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
      <div style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          assistiveText="Max file size 5MB"
          [files]="files"
          (filesAdded)="files = files.concat(toFileItems($any($event)))"
          (fileRemove)="files = removeFileItem(files, $event)"
        ></rec-file-upload>
      </div>
    `,
    props: {
      files: [] as RecursicaFileUploadItem[],
      toFileItems,
      removeFileItem,
    },
  }),
};

export const WithFiles: Story = {
  render: () => ({
    template: `
      <div style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          assistiveText="Max file size 5MB"
          [files]="files"
          (filesAdded)="files = files.concat(toFileItems($any($event)))"
          (fileRemove)="files = removeFileItem(files, $event)"
        ></rec-file-upload>
      </div>
    `,
    props: {
      files: [
        { file: mockFile("document.pdf") },
        { file: mockFile("image.png") },
        { file: mockFile("spreadsheet.xlsx") },
      ] as RecursicaFileUploadItem[],
      toFileItems,
      removeFileItem,
    },
  }),
};

export const EmptyState: Story = {
  render: () => ({
    template: `
      <div style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          [files]="files"
          (filesAdded)="files = files.concat(toFileItems($any($event)))"
          (fileRemove)="files = removeFileItem(files, $event)"
        ></rec-file-upload>
      </div>
    `,
    props: {
      files: [] as RecursicaFileUploadItem[],
      toFileItems,
      removeFileItem,
    },
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="width: 400px;">
        <rec-file-upload label="Upload Files" [disabled]="true" [files]="files"></rec-file-upload>
      </div>
    `,
    props: {
      files: [{ file: mockFile("document.pdf") }] as RecursicaFileUploadItem[],
    },
  }),
};

export const ErrorState: Story = {
  render: () => ({
    template: `
      <div style="width: 400px;">
        <rec-file-upload label="Upload Files" error="File upload failed. Please try again."></rec-file-upload>
      </div>
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
      <div style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          [icon]="starIcon"
          [files]="files"
          (filesAdded)="files = files.concat(toFileItems($any($event)))"
          (fileRemove)="files = removeFileItem(files, $event)"
        ></rec-file-upload>
      </div>
    `,
    props: {
      files: [] as RecursicaFileUploadItem[],
      toFileItems,
      removeFileItem,
    },
  }),
};

export const LongFilenames: Story = {
  render: () => ({
    template: `
      <div style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          [files]="files"
          (filesAdded)="files = files.concat(toFileItems($any($event)))"
          (fileRemove)="files = removeFileItem(files, $event)"
        ></rec-file-upload>
      </div>
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
      toFileItems,
      removeFileItem,
    },
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    template: `
      <div style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          assistiveText="Submitted files cannot be changed"
          [readOnly]="true"
          [files]="files"
        ></rec-file-upload>
      </div>
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
      <div style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          assistiveText="Only .pdf and .png files are accepted"
          accept=".pdf,.png"
          [files]="files"
          (filesAdded)="files = files.concat(toFileItems($any($event)))"
          (fileRemove)="files = removeFileItem(files, $event)"
        ></rec-file-upload>
      </div>
    `,
    props: {
      files: [] as RecursicaFileUploadItem[],
      toFileItems,
      removeFileItem,
    },
  }),
};

export const MaxFilesRestriction: Story = {
  render: () => ({
    template: `
      <div style="width: 400px;">
        <rec-file-upload
          label="Upload Files"
          assistiveText="Up to 2 files allowed"
          [maxFiles]="2"
          [files]="files"
          (filesAdded)="files = files.concat(toFileItems($any($event)))"
          (fileRemove)="files = removeFileItem(files, $event)"
        ></rec-file-upload>
      </div>
    `,
    props: {
      files: [
        { file: mockFile("document.pdf") },
        { file: mockFile("image.png") },
      ] as RecursicaFileUploadItem[],
      toFileItems,
      removeFileItem,
    },
  }),
};
