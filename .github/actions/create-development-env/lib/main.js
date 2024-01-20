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
    console.log(`pwd=`, pwd);
    console.log(`__dirname=`, __dirname);
    const scriptPath = path.resolve(__dirname);
    const relativePath = path.relative(pwd, scriptPath);
    console.log(`scriptPath=`, scriptPath);
    console.log(`relativePath=`, relativePath);
    const loc = path.resolve(relativePath, "..", "..");
    console.log(`loc=`, loc);

    //
    core.startGroup("Running pre-script step");
    await exec.exec(`${loc}/pre.sh`, [], {
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
      await exec.exec(`${loc}/post.sh`, [], {
        cwd: pwd,
      });
      core.endGroup();

      // All done!
      await exec.exec(`${loc}/entrypoint.sh`, [], {
        cwd: pwd,
      });
    } catch (err) {
      console.log(`err:`, err);
      core.setFailed(`compose up failed ${JSON.stringify(err)}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
