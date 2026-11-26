import fs from "node:fs";
import path from "node:path";

const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

export function extractImportSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const staticRe =
    /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g;
  for (const m of source.matchAll(staticRe)) {
    if (m[1]) specifiers.push(m[1]);
  }
  const dynamicRe = /import\(\s*["']([^"']+)["']\s*\)/g;
  for (const m of source.matchAll(dynamicRe)) {
    if (m[1]) specifiers.push(m[1]);
  }
  return specifiers;
}

function resolveImportPath(
  fromFile: string,
  specifier: string,
  srcDir: string,
): string | null {
  let base: string | null = null;
  if (specifier.startsWith("@/")) {
    base = path.join(srcDir, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = path.resolve(path.dirname(fromFile), specifier);
  }
  if (!base) return null;

  for (const ext of EXTENSIONS) {
    const candidate = base.endsWith(".ts") || base.endsWith(".tsx") ? base : `${base}${ext}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

export function findCircularDependencies(
  files: string[],
  srcDir: string,
  rootDir: string,
): string[] {
  const graph = new Map<string, string[]>();
  for (const file of files) {
    const specs = extractImportSpecifiers(fs.readFileSync(file, "utf8"));
    const deps = specs
      .map((s) => resolveImportPath(file, s, srcDir))
      .filter((d): d is string => d !== null);
    graph.set(file, deps);
  }

  const state = new Map<string, "visiting" | "visited">();
  const stack: string[] = [];
  const cycles: string[] = [];

  function visit(node: string): void {
    const current = state.get(node);
    if (current === "visited") return;
    if (current === "visiting") {
      const start = stack.indexOf(node);
      const cycle = [...stack.slice(start), node]
        .map((f) => path.relative(rootDir, f))
        .join(" -> ");
      cycles.push(cycle);
      return;
    }
    state.set(node, "visiting");
    stack.push(node);
    for (const dep of graph.get(node) ?? []) {
      visit(dep);
    }
    stack.pop();
    state.set(node, "visited");
  }

  for (const file of files) {
    visit(file);
  }
  return cycles;
}

export function findDuplicateBlocks(
  files: string[],
  rootDir: string,
  windowSize = 10,
): string[] {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];

  for (const file of files) {
    const rel = path.relative(rootDir, file);
    const lines = fs
      .readFileSync(file, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 &&
          !line.startsWith("import ") &&
          !line.startsWith("//") &&
          !line.startsWith("*") &&
          line !== "{" &&
          line !== "}" &&
          line !== ");",
      );

    for (let i = 0; i <= lines.length - windowSize; i++) {
      const block = lines.slice(i, i + windowSize).join("\n");
      const firstFile = seen.get(block);
      if (firstFile && firstFile !== rel) {
        duplicates.push(`${firstFile} <-> ${rel}`);
        break;
      }
      if (!firstFile) {
        seen.set(block, rel);
      }
    }
  }
  return duplicates;
}

function isRestrictedClientImport(specifier: string): boolean {
  return (
    specifier === "server-only" ||
    specifier === "@/lib/env" ||
    /(?:^|\/)data-access(?:\/|$)/.test(specifier) ||
    /(?:^|\/)loaders(?:\.ts)?$/.test(specifier)
  );
}

export function findBoundaryViolations(
  nonTestSrcFiles: string[],
  srcDir: string,
  rootDir: string,
): string[] {
  const violations: string[] = [];
  const appDir = path.join(srcDir, "app") + path.sep;
  const uiDir = path.join(srcDir, "components", "ui") + path.sep;

  for (const file of nonTestSrcFiles) {
    const content = fs.readFileSync(file, "utf8");
    const trimmed = content.trimStart();
    const isClient =
      trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'");
    const specs = extractImportSpecifiers(content);
    const rel = path.relative(rootDir, file);

    for (const s of specs) {
      if (isClient && isRestrictedClientImport(s)) {
        violations.push(`client: ${rel} -> ${s}`);
      }
      if (
        file.startsWith(appDir) &&
        (s === "@/lib/env" || /(?:^|\/)data-access(?:\/|$)/.test(s))
      ) {
        violations.push(`app: ${rel} -> ${s}`);
      }
      if (file.startsWith(uiDir) && s.startsWith("@/features/")) {
        violations.push(`ui: ${rel} -> ${s}`);
      }
    }
  }
  return violations;
}
