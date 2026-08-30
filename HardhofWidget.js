// ============================================================
// HARDHOF DISC GOLF WIDGET LOADER
// ============================================================
//
// This file is installed once in Scriptable.
// The actual widget is always loaded from GitHub.
//
// If GitHub cannot be reached, the most recently downloaded
// version is used from the local cache.
//
// ============================================================

const REMOTE_URL =
  "https://raw.githubusercontent.com/adistefa/hardhof-widget/main/HardhofWidgetMain.js";

const CACHE_FILE =
  "HardhofWidgetMain.cache.js";

const fm = FileManager.local();

const cachePath = fm.joinPath(
  fm.documentsDirectory(),
  CACHE_FILE
);


// ------------------------------------------------------------
// DOWNLOAD CURRENT VERSION
// ------------------------------------------------------------

async function loadWidgetCode() {

  try {

    const request = new Request(REMOTE_URL);

    request.timeoutInterval = 10;

    const code = await request.loadString();

    // Basic sanity check.
    // Prevent an error page or empty response from replacing
    // the cached working version.

    if (
      !code ||
      code.length < 3000
    ) {
      throw new Error(
        "Downloaded widget code looks invalid."
      );
    }

    // Store latest working version locally.

    fm.writeString(
      cachePath,
      code
    );

    console.log(
      "Hardhof Widget: loaded current version from GitHub."
    );

    return code;

  } catch (error) {

    console.log(
      `Hardhof Widget: GitHub unavailable: ${error}`
    );

    // Fall back to last downloaded version.

    if (fm.fileExists(cachePath)) {

      console.log(
        "Hardhof Widget: using cached version."
      );

      return fm.readString(
        cachePath
      );
    }

    throw new Error(
      "Hardhof Widget could not be loaded and no cached version exists."
    );
  }
}


// ------------------------------------------------------------
// RUN REMOTE WIDGET
// ------------------------------------------------------------

async function runWidget() {

  const code =
    await loadWidgetCode();

  // Execute the downloaded Scriptable script inside
  // an async function so its existing await statements work.

  const AsyncFunction =
    Object.getPrototypeOf(
      async function () {}
    ).constructor;

  const execute =
    new AsyncFunction(code);

  await execute();
}


try {

  await runWidget();

} catch (error) {

  console.error(error);

  if (config.runsInWidget) {

    const widget =
      new ListWidget();

    widget.addText(
      "HARDHOF"
    ).font =
      Font.boldSystemFont(18);

    widget.addSpacer(8);

    widget.addText(
      "Widget unavailable"
    ).font =
      Font.systemFont(14);

    widget.addSpacer(4);

    widget.addText(
      "Check your internet connection."
    ).font =
      Font.systemFont(11);

    Script.setWidget(widget);

  } else {

    const alert =
      new Alert();

    alert.title =
      "Hardhof Widget";

    alert.message =
      String(error);

    alert.addAction(
      "OK"
    );

    await alert.presentAlert();
  }

  Script.complete();
}