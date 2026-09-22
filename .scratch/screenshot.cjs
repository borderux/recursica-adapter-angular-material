const { chromium } = require("/Users/mattmassey/.npm/_npx/6bcb61ec6d5aea22/node_modules/playwright");

const BASE = "http://localhost:6007";

const targets = [
  { id: "ui-kit-readonlyfield--default", file: "read-only-field--default.png" },
  { id: "ui-kit-readonlyfield--empty-value", file: "read-only-field--empty-value.png" },
  { id: "ui-kit-readonlyfield--custom-empty-text", file: "read-only-field--custom-empty-text.png" },
  { id: "ui-kit-readonlyfield--custom-empty-renderer", file: "read-only-field--custom-empty-renderer.png" },
  { id: "ui-kit-readonlyfield--stacked-default", file: "read-only-field--stacked-default.png" },
  { id: "ui-kit-readonlyfield--side-by-side", file: "read-only-field--side-by-side.png" },
  { id: "ui-kit-readonlyfield--with-edit-icon", file: "read-only-field--with-edit-icon.png" },
  { id: "ui-kit-readonlyfield--data-types", file: "read-only-field--data-types.png" },
  { id: "ui-kit-withreadonlywrapper--editable", file: "with-read-only-wrapper--editable.png" },
  { id: "ui-kit-withreadonlywrapper--read-only", file: "with-read-only-wrapper--read-only.png" },
  { id: "ui-kit-withreadonlywrapper--read-only-with-custom-template", file: "with-read-only-wrapper--read-only-with-custom-template.png" },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  for (const t of targets) {
    const url = `${BASE}/iframe.html?id=${t.id}&viewMode=story`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `/Users/mattmassey/work/recursica-adapter-angular-material/.scratch/${t.file}` });
    console.log("captured", t.id);
  }
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
