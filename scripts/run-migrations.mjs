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
 * @private
 * JobError
 * Thrown when an error occurs while executing the migration job
 */
function JobError(message, commandResult) {
  this.constructor.prototype.__proto__ = Error.prototype; // Make this an instanceof Error.
  Error.call(this); // Does not seem necessary. Perhaps remove this line?
  Error.captureStackTrace(this, this.constructor); // Creates the this.stack getter
  this.name = this.constructor.name; // Used to cause messages like "UserError: message" instead of the default "Error: message"
  this.message = message; // Used to set the message
  this.commandResult = commandResult;
}

/**
 * @private
 * Execute the given shell command
 * @param {*} command
 * @param {*} options
 * @returns Promise<string | Error>
 */
export async function executeCommand(command, options = undefined) {
  try {
    const commandResult = await execa.execaCommand(command, {
      ...options,
      reject: false,
    });
    if (commandResult.exitCode === 0) {
      return commandResult.stdout;
    } else {
      throw new JobError(`Failed to execute command`, commandResult);
    }
  } catch (error) {
    if (!error instanceof JobError) {
      console.log(`Error=`, error);
    }
    throw error;
  }
}

/**
 * @const
 * A mapping table to map the migrations path between services
 */
const MIGRATIONS_MAPPING = {
  onboarding: {
    configFile: "./dist/database/ormconfig.js",
    searchPath: "dist/database/migrations/<kind>/eu/*.js",
  },
  default: {
    configFile: "./dist/src/ormconfig.js",
    searchPath: "dist/migration/postgres/<kind>/eu/*.js",
  },
};

/**
 * @private
 * Execute an migration job for the given service and migration kind
 * @param {*} jobInfo the job information
 */
async function runMigration(jobInfo) {
  const serviceName = jobInfo.serviceName;
  const { migrationKind = "schema" } = jobInfo;
  console.log(
    `  - Running migration job '${migrationKind}' for ${serviceName}`
  );

  const migrationName = MIGRATIONS_MAPPING.hasOwnProperty(serviceName)
    ? serviceName
    : "default";
  const migrationPath = MIGRATIONS_MAPPING[migrationName].searchPath.replace(
    "<kind>",
    migrationKind
  );
  const configFile = MIGRATIONS_MAPPING[migrationName].configFile.replace(
    "<kind>",
    migrationKind
  );
  if (process.env.LOG_LEVEL === "debug") {
    console.log(`db.migration_path.${migrationName}: ${migrationPath}`);
  }

  // Step 1: Retrieve list of all pending migrations
  try {
    const listMigrationsResult = await executeCommand(
      `pnpm exec typeorm -d ${configFile} migration:show`,
      {
        env: {
          NAMESPACE: "local",
          SERVICE_NAME: serviceName,
          POSTGRES_HOST: "127.0.0.1",
          POSTGRES_PORT: "5442",
          POSTGRES_DATABASE: "default",
          POSTGRES_SCHEMA: serviceName,
          POSTGRES_USER: "cloudsqladmin",
          POSTGRES_PASSWORD: "postgres",
          //
          DATABASE_MIGRATION_PATHS: migrationPath,
          DATABASE_CONFIG_PATH: "dist",
          DATABASE_CONFIG_EXTENSION: "js",
        },
        extendEnv: true,
        cwd: jobInfo.path,
      }
    );
    console.log(listMigrationsResult);
  } catch (err) {
    //
    console.log(`Failed:`, err);
    return;
  }

  // Step 2: Run all the schema migrations
  const commandResult = await executeCommand(
    `pnpm run --reporter-hide-prefix --if-present migrate-postgres`,
    {
      env: {
        NAMESPACE: "development",
        SERVICE_NAME: serviceName,
        //
        POSTGRES_HOST: "127.0.0.1",
        POSTGRES_PORT: "5442",
        POSTGRES_DATABASE: "default",
        POSTGRES_SCHEMA: serviceName,
        POSTGRES_USER: "cloudsqladmin",
        POSTGRES_PASSWORD: "postgres",
        //
        DATABASE_MIGRATION_PATHS: migrationPath,
        DATABASE_CONFIG_PATH: "dist",
        DATABASE_CONFIG_EXTENSION: "js",
      },
      extendEnv: true,
      cwd: jobInfo.path,
    }
  );

  return commandResult;
}

/**
 * @private
 * @param {*} jobInfo
 */
async function runJobs(jobInfo) {
  const serviceName = jobInfo.serviceName;
  const isSupportedService =
    ["monitoring", "isp"].includes(serviceName) === false;
  if (!isSupportedService) {
    console.log(`Unsupported service '${serviceName}`);
    return;
  }

  console.log(`\n\nRunning migration job for '${serviceName}`);
  await runMigration({
    ...jobInfo,
    migrationKind: "schema",
  });

  await runMigration({
    ...jobInfo,
    migrationKind: "data",
  });
}

/**
 * @private
 */
async function mainModule(services) {
  let commandResult;
  try {
    commandResult = await executeCommand(
      `pnpm exec turbo run build --filter=*-service --summarize --dry-run=json`
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
        const serviceFullPath = path.resolve(monorepoDirectory, directory);

        // Run the database migration jobs for each the services
        const serviceShortName = serviceName
          .replace("@tapico/", "")
          .replace("-service", "");
        const isRequestedService =
          services.length === 0 ? true : services.includes(serviceShortName);
        if (!isRequestedService) {
          if (process.env.LOG_LEVEL === "debug") {
            console.log(
              `Service '${serviceShortName}' is not requested ${services.join(
                ","
              )}`
            );
          }
          continue;
        }

        await runJobs({
          name: serviceName,
          serviceName: serviceShortName,
          path: serviceFullPath,
        });
      } catch (error) {
        console.log(error, error.name);
        if (
          process.env.LOG_LEVEL === "debug" ||
          process.env.LOG_LEVEL === "error"
        ) {
          console.log(`Error:`, error);
        }
      }
    }
  } catch (err) {
    if (
      process.env.LOG_LEVEL === "debug" ||
      process.env.LOG_LEVEL === "error"
    ) {
      console.error(`Error:`, err);
    }
  }
}

// Main entry point for the script file
const cliArguments = process.argv.slice(2);
await mainModule(cliArguments);
