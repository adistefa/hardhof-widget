// Hardhof Widget Installer for Scriptable
// Downloads the latest HardhofWidget.js from GitHub
// and saves it into Scriptable's iCloud documents folder.

const REPO_OWNER = "adistefa";
const REPO_NAME = "hardhof-widget";
const BRANCH = "main";
const TARGET_FILE = "HardhofWidget.js";

const RAW_URL =
  `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${TARGET_FILE}`;

async function main() {
  const alert = new Alert();

  alert.title = "Hardhof Widget";
  alert.message = "Install or update the Hardhof Disc Golf widget?";

  alert.addAction("Install / Update");
  alert.addCancelAction("Cancel");

  const choice = await alert.presentAlert();

  if (choice !== 0) {
    Script.complete();
    return;
  }

  try {
    const req = new Request(RAW_URL);
    const code = await req.loadString();

    if (!code || code.length < 100) {
      throw new Error("Downloaded file looks invalid.");
    }

    const fm = FileManager.iCloud();

    const path = fm.joinPath(
      fm.documentsDirectory(),
      TARGET_FILE
    );

    fm.writeString(path, code);

    const done = new Alert();

    done.title = "Installed";
    done.message =
      "HardhofWidget.js was installed successfully.\n\n" +
      "Now add a medium Scriptable widget to your Home Screen and select HardhofWidget.";

    done.addAction("Open Scriptable");
    done.addCancelAction("Done");

    const result = await done.presentAlert();

    if (result === 0) {
      Safari.open("scriptable://");
    }

  } catch (error) {

    console.error(error);

    const fail = new Alert();

    fail.title = "Installation failed";
    fail.message =
      `${error}\n\n` +
      "Check that HardhofWidget.js exists in the GitHub repository.";

    fail.addAction("OK");

    await fail.presentAlert();
  }

  Script.complete();
}

await main();