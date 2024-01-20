const core = require("@actions/core");
const exec = require("@actions/exec");
const compose = require("docker-compose");
const utils = require("./utils");
const path = require("path");

// Use docker compose v2
// ref: https://github.com/PDMLab/docker-compose/tree/master#import-for-docker-compose-v2
// The migration of Docker was done with Docker Compose. Use the official plugin instead.
// ref: https://docs.docker.com/compose/migrate/
const composeV2 = compose.v2;

async function run() {
  try {
    const composeFiles = utils.parseComposeFiles(
      core.getMultilineInput("compose-file")
    );
    if (!composeFiles.length) {
      return;
    }

    const services = core.getMultilineInput("services", { required: false });

    const options = {
      config: composeFiles,
      log: true,
      cwd: core.getInput("cwd"),
      env: {
        PWD: core.getInput("cwd"),
      },
      composeOptions: utils.parseFlags(core.getInput("compose-flags")),
      commandOptions: utils.parseFlags(core.getInput("up-flags")),
    };

    const pwd = core.getInput("cwd");
    const postScriptLocation = path.resolve(__dirname);
    const relativePath = path.relative(pwd, postScriptLocation);
    console.log(pwd, postScriptLocation, relativePath);

    //
    core.startGroup("Running pre-script step");
    await exec.exec(`${relativePath}/pre.sh`, [], {
      cwd: pwd,
    });
    core.endGroup();

    //
    const promise =
      services.length > 0
        ? composeV2.upMany(services, options)
        : composeV2.upAll(options);

    try {
      const result = await promise;
      core.startGroup("Running post-script step");
      const postScriptLocation = path.resolve(__dirname, "..", "..");
      await exec.exec(`${relativePath}/post.sh`, [], {
        cwd: pwd,
        env: {
          PWD: pwd,
        },
      });
      core.endGroup();

      // All done!
      core.startGroup("Running entrypoint-script step");
      await exec.exec(`${relativePath}/entrypoint.sh`, [], {
        cwd: pwd,
      });
      core.endGroup();
    } catch (err) {
      console.log(`err:`, err);
      core.setFailed(`compose up failed ${JSON.stringify(err)}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
