const core = require("@actions/core");
const exec = require("@actions/exec");
const compose = require("docker-compose");
const utils = require("./utils");

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

    //
    console.log("Running pre-script", __dirname, __filename);
    core.startGroup("Running pre-script step");
    await exec.exec("../../pre.sh", [], {
      cwd: __dirname,
    });
    core.endGroup();

    //
    const promise =
      services.length > 0
        ? composeV2.upMany(services, options)
        : composeV2.upAll(options);

    try {
      const result = await promise();
      console.log("compose started");
      core.startGroup("Running post-script step");
      await exec.exec("../../post.sh", [], {
        cwd: __dirname,
      });
      core.endGroup();
    } catch (err) {
      core.setFailed(`compose up failed ${JSON.stringify(err)}`);
    }

    // promise
    //   .then(() => {
    //     console.log("compose started");
    //     core.startGroup("Running post-script step");
    //     const endShellPromise = exec.exec("bash ./post.sh", [], {
    //       cwd: __dirname,
    //     });
    //     endShellPromise
    //       .then(() => {
    //         console.log(`Succeeded`);
    //         core.endGroup();
    //       })
    //       .catch(() => {
    //         console.log(`Failed`);
    //       });
    //   })
    //   .catch((err) => {
    //     core.setFailed(`compose up failed ${JSON.stringify(err)}`);
    //   });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
