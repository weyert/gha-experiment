#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as execa from "execa";
import fs from "node:fs/promises";

// shims for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//
const monorepoDirectory = path.resolve(__dirname, "../");

/**
 * Execute the given shell command
 * @param {*} command
 * @param {*} options
 * @returns Promise<string | Error>
 */
export async function executeCommand(command, options = undefined) {
  try {
    const commandResult = await execa.execaCommand(command, options);
    if (commandResult.exitCode === 0) {
      return commandResult.stdout;
    } else {
      throw new Error(`Failed to execute command`);
    }
  } catch (error) {
    throw error;
  }
}

/**
 *
 */
async function mainModule() {
  try {
    const commandResult = await executeCommand(
      `pnpm exec turbo run build --filter=*-service --dry-run=json`
    );
    if (process.env.LOG_LEVEL === "debug") {
      console.log(`commandResult:`, commandResult);
    }
    const { tasks: taskJsons, packages } = JSON.parse(commandResult);

    for (const taskInfo of taskJsons) {
      const { package: serviceName, directory } = taskInfo;
      const isService = packages.includes(serviceName);
      if (!isService) {
        continue;
      }

      try {
        // Execute command for all valid backend services
        const serviceFullPath = path.resolve(monorepoDirectory, directory);
        console.log(
          `::group::Running initialisation job for service '${serviceName}'`
        );
        console.log(
          `Running the intialise script for service ${serviceName} at ${serviceFullPath}`
        );

        // Check if the `init.js` file that is defined for creating topics via ArgoCD job
        const creatorFileExists = await fs.readFile(
          path.join(serviceFullPath, `init.ts`)
        );
        if (!creatorFileExists) {
          console.error(
            `Failed to find the job for creating PubSub topics 'init.ts'`
          );
          console.log(`::endgroup::`);
          continue;
        }

        //
        const serviceShortName = serviceName
          .replace("@tapico/", "")
          .replace("-service", "");
        console.log(
          `Creating subscriptions against service short name '${serviceShortName}'`
        );
        if (process.env.LOG_LEVEL === "debug") {
          console.log(`Searching for initialise job at: ${serviceFullPath}`);
        }

        //
        console.log(`\n\nBuilding the dependencies for '${serviceName}'...`);
        const buildShellResult = await executeCommand(
          `pnpm exec turbo run build --filter=...${serviceName}`,
          {
            cwd: serviceFullPath,
            env: {
              PUBSUB_EMULATOR_HOST: "127.0.0.1:8085",
              PUBSUB_PROJECT_ID: "dev01-242909",
              SERVICE_NAME: serviceShortName,
              REGION: process.env.REGION ?? "europe-west1",
              NAMESPACE: process.env.NAMESPACE ?? "local",
            },
            extendEnv: true,
          }
        );

        if (process.env.LOG_LEVEL === "debug") {
          console.log(`buildShellResult:`, buildShellResult);
        }

        // pnpm --silent dlx ts-node init.ts
        // pnpm exec tapico-scripts dev --enable-watching=false ./init.ts
        const shellResult = await executeCommand(
          `pnpm exec tapico-scripts dev --enable-watching=false ./init.ts`,
          {
            cwd: serviceFullPath,
            env: {
              PUBSUB_EMULATOR_HOST: "127.0.0.1:8085",
              PUBSUB_PROJECT_ID: "dev01-242909",
              SERVICE_NAME: serviceShortName,
              REGION: process.env.REGION ?? "europe-west1",
              NAMESPACE: process.env.NAMESPACE ?? "local",
            },
            extendEnv: true,
          }
        );

        if (process.env.LOG_LEVEL === "debug") {
          console.log(`shellResult:`, shellResult);
        }
        console.log(`::endgroup::`);
      } catch (error) {
        console.log(`::endgroup::`);
        if (error.code === "ENOENT") {
          console.error(
            `Failed to find the job for creating PubSub topics 'init.ts'\n`
          );
        } else {
          if (process.env.LOG_LEVEL === "debug") {
            console.error(`Error:`, error);
          } else {
            console.error(`Error:`, error.message);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

await mainModule();
