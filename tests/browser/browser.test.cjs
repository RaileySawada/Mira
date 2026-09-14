const { spawn } = require("node:child_process");
const { mkdtemp, writeFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");

test("production study flows, themes, mobile overlays and offline reload", async () => {
  const server = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      "4179",
      "--strictPort",
    ],
    { stdio: "ignore", windowsHide: true },
  );
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch("http://127.0.0.1:4179");
      if (response.ok) break;
    } catch {
      /* Wait for the preview process to start. */
    }
    await delay(100);
  }
  const profile = await mkdtemp(path.join(tmpdir(), "mira-browser-"));
  const chrome = spawn(
    process.env.CHROME_PATH ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-port=9333",
      "--user-data-dir=" + profile,
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true },
  );
  let socket;
  try {
    let tabs;
    for (let i = 0; i < 60; i++) {
      try {
        tabs = await (await fetch("http://127.0.0.1:9333/json")).json();
        break;
      } catch {
        await delay(200);
      }
    }
    expect(tabs).toBeTruthy();
    socket = new WebSocket(
      tabs.find((tab) => tab.type === "page").webSocketDebuggerUrl,
    );
    await new Promise((resolve) =>
      socket.addEventListener("open", resolve, { once: true }),
    );
    let id = 0;
    const pending = new Map();
    const errors = [];
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const resolve = pending.get(message.id);
        pending.delete(message.id);
        resolve(message);
      }
      if (message.method === "Runtime.exceptionThrown")
        errors.push(message.params.exceptionDetails.text);
      if (message.method === "Page.javascriptDialogOpening")
        void send("Page.handleJavaScriptDialog", { accept: true });
    });
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const current = ++id;
        const timeout = setTimeout(() => {
          pending.delete(current);
          reject(new Error("CDP timeout: " + method));
        }, 15000);
        pending.set(current, (message) => {
          clearTimeout(timeout);
          if (message.error) reject(new Error(JSON.stringify(message.error)));
          else resolve(message.result);
        });
        socket.send(JSON.stringify({ id: current, method, params }));
      });
    }
    async function evaluate(expression) {
      const result = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails)
        throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    }
    async function waitFor(expression) {
      for (let i = 0; i < 80; i++) {
        if (await evaluate("Boolean(" + expression + ")")) return;
        await delay(100);
      }
      throw new Error("Timed out: " + expression);
    }
    async function click(text) {
      await evaluate(
        `(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}); if (!button) throw new Error('Missing button: ' + ${JSON.stringify(text)}); button.click(); })()`,
      );
      await delay(150);
    }
    async function fill(selector, value) {
      await evaluate(
        `(() => { const input = document.querySelector(${JSON.stringify(selector)}); const setter = Object.getOwnPropertyDescriptor(input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set; setter.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`,
      );
    }
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1100,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: "http://127.0.0.1:4179" });
    await waitFor("document.querySelector('h1')");
    expect(await evaluate("document.body.innerText")).toMatch(
      /Your next chapter/,
    );
    expect(
      await evaluate("document.querySelectorAll('main .panel svg').length"),
    ).toBe(0);
    expect(
      await evaluate(
        "document.querySelector('a[aria-label=\"Mira home\"]').textContent.trim()",
      ),
    ).toBe("");
    await evaluate("window.scrollTo(0, 250)");
    const priorScroll = await evaluate("window.scrollY");
    await click("New reviewer");
    expect(await evaluate("getComputedStyle(document.body).position")).toBe(
      "fixed",
    );
    expect(
      await evaluate(
        "getComputedStyle(document.documentElement).scrollbarGutter",
      ),
    ).toBe("auto");
    expect(await evaluate("document.documentElement.clientWidth")).toBe(
      await evaluate("innerWidth"),
    );
    const lockedTop = await evaluate(
      "document.querySelector('main').getBoundingClientRect().top",
    );
    await evaluate("window.scrollTo(0, 999)");
    expect(
      await evaluate(
        "document.querySelector('main').getBoundingClientRect().top",
      ),
    ).toBe(lockedTop);

    await fill("dialog input", "Biology basics");
    await fill("dialog textarea", "A first little discovery.");
    await fill("dialog .panel textarea", "Powerhouse of the cell?");

    // The answer textarea lives in its own label; address the second card textarea directly.
    await evaluate(
      "(() => { const input = document.querySelectorAll('dialog .panel textarea')[1]; Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, 'Mitochondria'); input.dispatchEvent(new Event('input', { bubbles: true })); })()",
    );
    await click("+ Create a new topic");
    await fill(
      'dialog input[placeholder="e.g. Human anatomy"]',
      "Cell biology",
    );
    await click("Save reviewer");
    expect(
      await evaluate(
        "JSON.parse(localStorage.getItem('mira.study.v1')).topics[0].name",
      ),
    ).toBe("Cell biology");
    expect(
      await evaluate(
        "(() => { const data = JSON.parse(localStorage.getItem('mira.study.v1')); return data.reviewers[0].topicId === data.topics[0].id; })()",
      ),
    ).toBe(true);

    await waitFor("!document.querySelector('dialog')");
    expect(await evaluate("scrollY")).toBe(priorScroll);
    expect(
      await evaluate(
        "JSON.parse(localStorage.getItem('mira.study.v1')).reviewers.length",
      ),
    ).toBe(1);
    await evaluate("document.querySelector('a[href=\"/reviewers\"]').click()");
    await waitFor(
      "document.body.innerText.includes('Room for every little discovery.')",
    );
    await evaluate(
      "document.querySelector('button[aria-label=\"Filter by topic\"]').click()",
    );
    await fill('input[role="combobox"]', "does not exist");
    await waitFor("document.body.innerText.includes('No matches.')");
    await fill('input[role="combobox"]', "cell");
    await evaluate(
      "document.querySelector('input[role=combobox]').dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}))",
    );
    expect(
      await evaluate(
        "document.querySelector('button[aria-label=\"Filter by topic\"]').textContent.trim()",
      ),
    ).toBe("Cell biology");
    await click("Edit");
    await evaluate(
      "document.querySelector('button[aria-label=\"Topic\"]').click()",
    );
    await fill('dialog input[role="combobox"]', "CELL");
    await evaluate(
      "document.querySelector('dialog input[role=combobox]').dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}))",
    );
    expect(
      await evaluate(
        "document.querySelector('button[aria-label=\"Topic\"]').textContent.trim()",
      ),
    ).toBe("Cell biology");
    await evaluate(
      "document.querySelector('button[aria-label=\"Topic\"]').click()",
    );
    await evaluate(
      "document.querySelector('dialog input[role=combobox]').dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true, cancelable:true}))",
    );
    expect(await evaluate("document.querySelector('dialog').open")).toBe(true);

    await click("+ Create a new topic");
    await fill(
      'dialog input[placeholder="e.g. Human anatomy"]',
      "  CELL BIOLOGY  ",
    );
    await click("Save reviewer");
    expect(
      await evaluate(
        "JSON.parse(localStorage.getItem('mira.study.v1')).topics.length",
      ),
    ).toBe(1);
    await evaluate("document.querySelector('a[href=\"/quizzes\"]').click()");
    await waitFor("document.body.innerText.includes('Choose your focus')");
    await click("Start quiz →");
    await fill("dialog textarea", "Mitochondria");
    await click("Check answer");
    await click("Finish & save results");
    await waitFor(
      "document.body.innerText.includes('Your progress is saved.')",
    );
    expect(
      await evaluate(
        "JSON.parse(localStorage.getItem('mira.study.v1')).attempts[0].correct",
      ),
    ).toBe(1);
    await click("Back to learning");

    await evaluate("document.querySelector('a[href=\"/topics\"]').click()");
    await waitFor("document.body.innerText.includes('Follow your curiosity.')");
    await click("New topic");
    await fill("dialog input", "Biology");
    await click("Save topic");
    expect(
      await evaluate(
        "JSON.parse(localStorage.getItem('mira.study.v1')).topics.some(topic => topic.name === 'Biology')",
      ),
    ).toBe(true);
    await evaluate("document.querySelector('a[href=\"/settings\"]').click()");
    await waitFor("document.body.innerText.includes('Your space. Your pace.')");
    await fill("main form input", "Mira learner");
    await click("Save preferences");
    expect(
      await evaluate(
        "JSON.parse(localStorage.getItem('mira.study.v1')).settings.name",
      ),
    ).toBe("Mira learner");
    await evaluate(`(() => {
    const backup = JSON.parse(localStorage.getItem('mira.study.v1'));
    backup.settings.name = 'Imported learner';
    const transfer = new DataTransfer();
    transfer.items.add(new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' }));
    const input = document.querySelector('input[type=file]');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
    await waitFor(
      "document.body.innerText.includes('Your backup has been imported.')",
    );
    expect(
      await evaluate(
        "JSON.parse(localStorage.getItem('mira.study.v1')).settings.name",
      ),
    ).toBe("Imported learner");
    await evaluate(`(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['{"version":99}'], 'bad.json', { type: 'application/json' }));
    const input = document.querySelector('input[type=file]');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
    await waitFor("document.querySelector('[role=alert]')");
    expect(
      await evaluate(
        "JSON.parse(localStorage.getItem('mira.study.v1')).reviewers.length",
      ),
    ).toBe(1);

    await evaluate("document.querySelector('a[href=\"/\"]').click()");
    await waitFor("document.body.innerText.includes('Your next chapter')");

    await evaluate("document.querySelector('a[href=\"/settings\"]').click()");
    await waitFor("document.querySelector('[aria-label=\"Color theme\"]')");
    expect(await evaluate("location.hash")).toBe("");
    expect(await evaluate("location.pathname")).toBe("/settings");
    expect(
      await evaluate("document.body.innerText.includes('Local workspace')"),
    ).toBe(false);
    expect(
      await evaluate(
        "document.querySelector('button[aria-label=\"Open settings\"]') === null",
      ),
    ).toBe(true);
    await evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await evaluate("document.querySelector('a[href=\"/terms\"]').click()");
    await waitFor(
      "document.querySelector('h1').textContent === 'Terms & conditions.'",
    );
    expect(await evaluate("window.scrollY")).toBe(0);
    await evaluate("history.back()");
    await waitFor("location.pathname === '/settings'");
    expect(await evaluate("window.scrollY")).toBe(0);
    async function chooseTheme(index) {
      await evaluate(
        `document.querySelectorAll('[aria-label="Color theme"] button')[${index}].click()`,
      );
      await delay(650);
    }
    await chooseTheme(1);
    expect(await evaluate("document.documentElement.dataset.theme")).toBe(
      "dark",
    );
    expect(
      await evaluate("getComputedStyle(document.body).backgroundColor"),
    ).toBe("rgb(24, 25, 30)");
    expect(
      await evaluate(
        "JSON.parse(localStorage.getItem('mira.study.v1')).settings.theme",
      ),
    ).toBe("dark");
    const settingsDark = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    await writeFile(
      path.join(profile, "settings-dark.png"),
      Buffer.from(settingsDark.data, "base64"),
    );
    await send("Page.reload");
    await waitFor("document.querySelector('[aria-label=\"Color theme\"]')");
    expect(await evaluate("document.documentElement.dataset.theme")).toBe(
      "dark",
    );
    await chooseTheme(0);
    expect(await evaluate("document.documentElement.dataset.theme")).toBe(
      "light",
    );
    const settingsLight = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    await writeFile(
      path.join(profile, "settings-light.png"),
      Buffer.from(settingsLight.data, "base64"),
    );
    await chooseTheme(2);
    await send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-color-scheme", value: "dark" }],
    });
    await waitFor("document.documentElement.dataset.theme === 'dark'");
    await send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-color-scheme", value: "light" }],
    });
    await waitFor("document.documentElement.dataset.theme === 'light'");
    await evaluate(
      `(() => { const buttons = document.querySelectorAll('[aria-label="Color theme"] button'); buttons[1].click(); buttons[0].click(); buttons[1].click(); })()`,
    );
    await delay(700);
    expect(await evaluate("document.documentElement.dataset.theme")).toBe(
      "dark",
    );
    await send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await chooseTheme(0);
    expect(await evaluate("document.documentElement.dataset.theme")).toBe(
      "light",
    );
    await send("Emulation.setEmulatedMedia", { features: [] });
    await evaluate("document.querySelector('a[href=\"/reviewers\"]').click()");
    await waitFor(
      "document.body.innerText.includes('Room for every little discovery.')",
    );
    await click("New reviewer");
    for (let i = 0; i < 5; i++) await click("Add a flashcard");
    expect(await evaluate("getComputedStyle(document.body).overflow")).toBe(
      "hidden",
    );
    expect(
      await evaluate(
        "getComputedStyle(document.querySelector('.modal-content')).scrollbarWidth",
      ),
    ).toBe("thin");
    expect(
      await evaluate(
        "document.querySelector('.modal-content').scrollHeight > document.querySelector('.modal-content').clientHeight",
      ),
    ).toBe(true);
    await click("Cancel");
    expect(await evaluate("getComputedStyle(document.body).overflow")).not.toBe(
      "hidden",
    );

    await evaluate("document.querySelector('a[href=\"/\"]').click()");
    await waitFor("document.body.innerText.includes('Your next chapter')");
    const screenshot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    await writeFile(
      path.join(profile, "desktop.png"),
      Buffer.from(screenshot.data, "base64"),
    );
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await delay(200);
    expect(
      await evaluate("document.documentElement.scrollWidth <= innerWidth"),
    ).toBe(true);
    await evaluate(
      "document.querySelector('button[aria-label=\"Open navigation menu\"]').focus(); document.querySelector('button[aria-label=\"Open navigation menu\"]').click()",
    );
    await waitFor("document.querySelector('#mobile-sidebar[open]')");
    expect(
      await evaluate(
        "document.querySelector('#mobile-sidebar').contains(document.activeElement)",
      ),
    ).toBe(true);
    expect(await evaluate("getComputedStyle(document.body).overflow")).toBe(
      "hidden",
    );
    await delay(250);
    const drawer = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(
      path.join(profile, "mobile-drawer.png"),
      Buffer.from(drawer.data, "base64"),
    );
    await evaluate(
      "document.querySelector('#mobile-sidebar a[href=\"/topics\"]').click()",
    );
    await waitFor(
      "location.pathname === '/topics' && !document.querySelector('#mobile-sidebar')",
    );
    expect(await evaluate("getComputedStyle(document.body).overflow")).not.toBe(
      "hidden",
    );
    await evaluate(
      "document.querySelector('button[aria-label=\"Open navigation menu\"]').focus(); document.querySelector('button[aria-label=\"Open navigation menu\"]').click()",
    );
    await waitFor("document.querySelector('#mobile-sidebar[open]')");
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
      nativeVirtualKeyCode: 27,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
      nativeVirtualKeyCode: 27,
    });
    await waitFor("!document.querySelector('#mobile-sidebar')");
    expect(
      await evaluate("document.activeElement.getAttribute('aria-label')"),
    ).toBe("Open navigation menu");
    await evaluate(
      "document.querySelector('button[aria-label=\"Open navigation menu\"]').click()",
    );
    await waitFor("document.querySelector('#mobile-sidebar[open]')");
    await delay(250);
    await send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: 380,
      y: 350,
      button: "left",
      clickCount: 1,
    });
    await send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: 380,
      y: 350,
      button: "left",
      clickCount: 1,
    });
    await waitFor("!document.querySelector('#mobile-sidebar')");
    await evaluate("document.querySelector('a[href=\"/\"]').click()");
    await waitFor("document.body.innerText.includes('Your next chapter')");
    expect(
      await evaluate(
        "document.querySelector('.mobile-header img').naturalWidth",
      ),
    ).toBe(1254);
    expect(
      await evaluate(
        "document.querySelector('link[rel=icon]').getAttribute('href')",
      ),
    ).toBe("/favicon.png");
    expect(
      await evaluate(
        "document.querySelector('meta[property=\"og:image\"]').content",
      ),
    ).toBe("/icon.png");
    const mobile = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    await writeFile(
      path.join(profile, "mobile.png"),
      Buffer.from(mobile.data, "base64"),
    );

    await evaluate("document.querySelector('a[href=\"/settings\"]').click()");
    await waitFor("document.querySelector('[aria-label=\"Color theme\"]')");
    await chooseTheme(1);
    expect(
      await evaluate("document.documentElement.scrollWidth <= innerWidth"),
    ).toBe(true);
    const mobileSettings = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    await writeFile(
      path.join(profile, "settings-mobile.png"),
      Buffer.from(mobileSettings.data, "base64"),
    );
    await evaluate(
      "window.savedTransition = document.startViewTransition; document.startViewTransition = undefined",
    );
    await chooseTheme(0);
    expect(await evaluate("document.documentElement.dataset.theme")).toBe(
      "light",
    );
    await evaluate("document.startViewTransition = window.savedTransition");
    for (const route of ["guide", "contribute", "privacy", "terms", "about"]) {
      await evaluate(`document.querySelector('a[href="/${route}"]').click()`);
      await waitFor(`location.pathname === '/${route}'`);
      expect(await evaluate("scrollY")).toBe(0);
      expect(
        await evaluate(
          "document.querySelectorAll('article section').length > 0",
        ),
      ).toBe(true);
    }
    await evaluate("document.querySelector('a[href=\"/settings\"]').click()");
    await waitFor("document.querySelector('[aria-label=\"Color theme\"]')");

    await waitFor("navigator.serviceWorker.controller !== null");
    await send("Network.emulateNetworkConditions", {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
    await send("Page.reload");
    await waitFor("document.querySelector('h1')");
    expect(await evaluate("document.body.innerText")).toMatch(
      /Your space. Your pace./,
    );
    expect(await evaluate("location.pathname")).toBe("/settings");
    expect(
      await evaluate(
        "JSON.parse(localStorage.getItem('mira.study.v1')).attempts.length",
      ),
    ).toBe(1);
    expect(errors).toEqual([]);
    console.log(
      "PASS: inline topics, duplicate reuse, study flows, imports, clean routes, themes, mobile drawer/focus/Escape/backdrop, branding, docs, offline reload.",
    );
    console.log("Screenshots: " + profile);
  } finally {
    socket?.close();
    chrome.kill();
    server.kill();
  }
}, 90000);
