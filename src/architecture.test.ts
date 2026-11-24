import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractImportSpecifiers,
  findBoundaryViolations,
  findCircularDependencies,
  findDuplicateBlocks,
} from "./architecture-checks";

const ROOT_DIR = path.resolve(process.cwd());
const SRC_DIR = path.join(ROOT_DIR, "src");
const TESTS_DIR = path.join(ROOT_DIR, "tests");
const MAX_LINES = 250;

function collectFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function isTestFile(filePath: string): boolean {
  return /\.(test|spec)\.(ts|tsx)$/.test(filePath);
}

function getFeatureDirs(): string[] {
  const featuresDir = path.join(SRC_DIR, "features");
  if (!fs.existsSync(featuresDir)) return [];
  return fs
    .readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

describe("architecture boundaries", () => {
  const allSrcFiles = collectFiles(SRC_DIR);
  const allTestFiles = collectFiles(TESTS_DIR);
  const allCodeFiles = [...allSrcFiles, ...allTestFiles];
  const nonTestSrcFiles = allSrcFiles.filter((file) => !isTestFile(file));

  it("enforces <= 250 lines on every .ts and .tsx file in src/ and tests/", () => {
    const violations: string[] = [];
    for (const file of allCodeFiles) {
      const lineCount = fs.readFileSync(file, "utf8").split("\n").length;
      if (lineCount > MAX_LINES) {
        violations.push(`${path.relative(ROOT_DIR, file)} (${lineCount})`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("forbids lint and typecheck suppression comments in src/ and tests/", () => {
    const forbidden = new RegExp(
      `eslint-${"disable"}|@ts-${"ignore"}|@ts-${"nocheck"}`,
    );
    const violations: string[] = [];
    for (const file of allCodeFiles) {
      if (forbidden.test(fs.readFileSync(file, "utf8"))) {
        violations.push(path.relative(ROOT_DIR, file));
      }
    }
    expect(violations).toEqual([]);
  });

  it("forbids useEffect and useLayoutEffect anywhere in src/", () => {
    const violations = nonTestSrcFiles
      .filter((file) => /\buseEffect\b|\buseLayoutEffect\b/.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT_DIR, file));
    expect(violations).toEqual([]);
  });

  it("ensures every feature directory has schemas.ts and data-access.ts", () => {
    const features = getFeatureDirs();
    expect(features.length).toBeGreaterThan(0);
    for (const feature of features) {
      const dir = path.join(SRC_DIR, "features", feature);
      expect(fs.existsSync(path.join(dir, "schemas.ts"))).toBe(true);
      expect(fs.existsSync(path.join(dir, "data-access.ts"))).toBe(true);
    }
  });

  it('requires import "server-only" at top of env.ts, data-access, and loaders', () => {
    const serverFiles: string[] = [path.join(SRC_DIR, "lib", "env.ts")];
    for (const feature of getFeatureDirs()) {
      const featureDir = path.join(SRC_DIR, "features", feature);
      for (const name of ["data-access.ts", "loaders.ts"]) {
        const candidate = path.join(featureDir, name);
        if (fs.existsSync(candidate)) serverFiles.push(candidate);
      }
      const dataAccessDir = path.join(featureDir, "data-access");
      for (const file of collectFiles(dataAccessDir)) {
        if (!isTestFile(file)) serverFiles.push(file);
      }
    }

    for (const file of serverFiles) {
      const content = fs.readFileSync(file, "utf8").trimStart();
      const ok =
        content.startsWith('import "server-only"') ||
        content.startsWith("import 'server-only'");
      expect(ok, `${path.relative(ROOT_DIR, file)} needs server-only`).toBe(
        true,
      );
    }
  });

  it("restricts process.env to src/lib/env.ts and forbids NEXT_PUBLIC_ secrets", () => {
    const envFile = path.join(SRC_DIR, "lib", "env.ts");
    const violations = nonTestSrcFiles
      .filter((file) => file !== envFile)
      .filter((file) => /\bprocess\.env\b/.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT_DIR, file));
    expect(violations).toEqual([]);
    expect(fs.readFileSync(envFile, "utf8")).not.toMatch(/NEXT_PUBLIC_/);

    const envExample = path.join(ROOT_DIR, ".env.example");
    if (fs.existsSync(envExample)) {
      expect(fs.readFileSync(envExample, "utf8")).not.toMatch(/NEXT_PUBLIC_/);
    }
  });

  it("enforces BFF, client, UI, and cross-feature isolation", () => {
    const violations = findBoundaryViolations(nonTestSrcFiles, SRC_DIR, ROOT_DIR);

    for (const feature of getFeatureDirs()) {
      const featureDir = path.join(SRC_DIR, "features", feature);
      for (const file of collectFiles(featureDir).filter((f) => !isTestFile(f))) {
        const specs = extractImportSpecifiers(fs.readFileSync(file, "utf8"));
        const rel = path.relative(ROOT_DIR, file);
        for (const s of specs) {
          const match = s.match(/^@\/features\/([^/]+)\//);
          if (match && match[1] !== feature) {
            violations.push(`cross-feature: ${rel} -> ${s}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("forbids circular dependencies across src/", () => {
    expect(findCircularDependencies(nonTestSrcFiles, SRC_DIR, ROOT_DIR)).toEqual(
      [],
    );
  });

  it("forbids duplicated non-trivial code blocks across feature and app files", () => {
    const uiDir = path.join(SRC_DIR, "components", "ui") + path.sep;
    const checkedFiles = nonTestSrcFiles.filter((f) => !f.startsWith(uiDir));
    expect(findDuplicateBlocks(checkedFiles, ROOT_DIR)).toEqual([]);
  });
});
