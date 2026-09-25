import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FileInputComponent } from "./file-input.component";
import type { RecursicaFileUploadItem } from "./file-input-item";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `FileInput.stories.tsx` /
 * `test/golden/ui-kit-fileinput--*.png`. State (the `files` array) is held
 * directly in each story's own `props`, reassigned inline in the template
 * (`(filesAdded)="files = ..."`) — the same convention
 * `checkbox-group.stories.ts` already establishes for controlled-value
 * stories, not a new pattern invented here.
 */
function mockFile(name: string, size = 1024): File {
  return new File([new Uint8Array(size)], name);
}

/**
 * Angular's template expression parser doesn't support arrow-function
 * literals (`(file) => ({ file })`) inline in a binding — only property
 * reads and method calls. These helpers live in real TypeScript, outside
 * the template string, and are exposed to the template via `props` instead.
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

const meta: Meta<FileInputComponent> = {
  title: "UI-Kit/FileInput",
  component: FileInputComponent,
  decorators: [
    moduleMetadata({
      imports: [FileInputComponent],
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

type Story = StoryObj<FileInputComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-file-input
          label="Resume"
          [files]="files"
          (filesAdded)="files = toFileItems($event)"
          (fileRemove)="files = []"
        ></rec-file-input>
      </div>
    `,
    props: { files: [] as RecursicaFileUploadItem[], toFileItems },
  }),
};

export const WithFile: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-file-input
          label="Resume"
          [files]="files"
          (filesAdded)="files = toFileItems($event)"
          (fileRemove)="files = []"
        ></rec-file-input>
      </div>
    `,
    props: {
      files: [{ file: mockFile("resume.pdf") }] as RecursicaFileUploadItem[],
      toFileItems,
    },
  }),
};

export const MultipleFiles: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-file-input
          label="Attachments"
          assistiveText="Up to 5 files"
          [multiple]="true"
          [files]="files"
          (filesAdded)="files = files.concat(toFileItems($event))"
          (fileRemove)="files = removeFileItem(files, $event)"
        ></rec-file-input>
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

export const SideBySide: Story = {
  render: () => ({
    template: `
      <div style="width: 480px;">
        <rec-file-input
          label="Resume"
          assistiveText="PDF or Word document"
          formLayout="side-by-side"
          [files]="files"
          (filesAdded)="files = toFileItems($event)"
          (fileRemove)="files = []"
        ></rec-file-input>
      </div>
    `,
    props: { files: [] as RecursicaFileUploadItem[], toFileItems },
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-file-input label="Resume" [disabled]="true" [files]="files"></rec-file-input>
      </div>
    `,
    props: {
      files: [{ file: mockFile("resume.pdf") }] as RecursicaFileUploadItem[],
    },
  }),
};

export const ErrorState: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-file-input label="Resume" error="A file is required."></rec-file-input>
      </div>
    `,
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-file-input
          label="Attachments"
          assistiveText="Submitted files cannot be changed"
          [multiple]="true"
          [readOnly]="true"
          [files]="files"
        ></rec-file-input>
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
      <div style="width: 320px;">
        <rec-file-input
          label="Resume"
          assistiveText="Only .pdf files are accepted"
          accept=".pdf"
          [files]="files"
          (filesAdded)="files = toFileItems($event)"
          (fileRemove)="files = []"
        ></rec-file-input>
      </div>
    `,
    props: { files: [] as RecursicaFileUploadItem[], toFileItems },
  }),
};

export const MaxFilesRestriction: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-file-input
          label="Attachments"
          assistiveText="Up to 2 files allowed"
          [multiple]="true"
          [maxFiles]="2"
          [files]="files"
          (filesAdded)="files = files.concat(toFileItems($event))"
          (fileRemove)="files = removeFileItem(files, $event)"
        ></rec-file-input>
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
