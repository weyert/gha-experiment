#!/usr/bin/env node
import { promisify } from "util";
import fs from "node:fs/promises";
import { spawn, exec } from "node:child_process";

const [, , target] = process.argv;
const execPromise = promisify(exec);

// eslint-disable-next-line no-console
let targetWorkspace = process.env.WORKSPACE_NAME;
if (!targetWorkspace) {
  if (target) {
    targetWorkspace = target;
  }
}

if (!targetWorkspace) {
  throw Error(`Failed to lookup target`);
}

console.log(`Cleaning up source artifacts for target: '${targetWorkspace}'...`);
const { stdout, stderr, error } = await execPromise(
  `pnpm exec turbo run build --filter=${targetWorkspace} --dry-run=json`
);

// skippable packages
const ignorablePackages = ["@tapico/test-helpers", "@tapico/appstore-shared"];

//
let buildArtifacts = new Set();
try {
  const workplan = JSON.parse(stdout);
  const { tasks = [] } = workplan;
  tasks.forEach((task) => {
    const { taskId, package: pkg, directory, inputs = {} } = task;

    if (ignorablePackages.includes(pkg)) {
      console.warn(`Source artifacts of package '${pkg}' will not be deleted.`);
      return;
    }

    //
    const inputEntries = Object.keys(inputs).map(
      (file) => `${directory}/${file}`
    );
    const filteredInputEntries = inputEntries.filter((item) => {
      // avoid deleting any package.json files
      return !item.includes("package.json");
    });

    filteredInputEntries.forEach((file) => buildArtifacts.add(file, true));
  });
} catch (err) {
  console.error(`Failed with error, error:`, err);
}

if (buildArtifacts.size === 0) {
  process.exit(0);
}

// remove file when it exists
async function removeFile(filename) {
  try {
    const fileStat = await fs.access(filename);
    await fs.rm(filename, { force: false });
  } catch (err) {
    console.log(`Error for ${filename}:`, err);
  }
}

const entries = Array.from(buildArtifacts).map((entry) => {
  console.log(`Removing entry: '${entry}'`);
  return removeFile(entry);
});
