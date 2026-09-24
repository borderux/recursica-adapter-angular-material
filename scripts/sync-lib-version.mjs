#!/usr/bin/env node
/**
 * ng-packagr merges `projects/adapter-angular-material/package.json` into
 * the generated `dist/package.json`, including its `version` field — it
 * does not consult the root package.json. Changesets only bumps the root
 * version, so without this sync the lib's package.json (and therefore
 * every published dist/package.json) stays pinned wherever it was last
 * hand-edited. Run before `ng build` so dist always ships the real version.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_PACKAGE_JSON = join(__dirname, "..", "package.json");
const LIB_PACKAGE_JSON = join(
  __dirname,
  "..",
  "projects",
  "adapter-angular-material",
  "package.json",
);

const { version } = JSON.parse(readFileSync(ROOT_PACKAGE_JSON, "utf8"));
const libPackageJson = JSON.parse(readFileSync(LIB_PACKAGE_JSON, "utf8"));

libPackageJson.version = version;

writeFileSync(LIB_PACKAGE_JSON, JSON.stringify(libPackageJson, null, 2) + "\n");
