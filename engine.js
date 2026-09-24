/* Del's Bridge — a small interactive-fiction engine.
 *
 * Interim build: it renders a choice-based scene graph from story.js. The
 * interaction model is being reworked (freeform text input + an AI response
 * layer), so expect this file to change. No build step, no dependencies.
 */

(function () {
  "use strict";

  var SAVE_KEY = "dels-bridge:save";

  var el = {
    scene:   document.querySelector("[data-scene]"),
    title:   document.querySelector("[data-title]"),
    prose:   document.querySelector("[data-prose]"),
    choices: document.querySelector("[data-choices]"),
    restart: document.querySelector("[data-restart]")
  };

  // scene: current scene id · vars: your flags/values · visited: id -> count
  var state = { scene: null, vars: {}, visited: {} };
  var armed = false; // "Start over" needs two clicks

  /* --- Persistence -------------------------------------------------- */

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (saved && typeof saved.scene === "string" && STORY.scenes[saved.scene]) {
        return {
          scene: saved.scene,
          vars: saved.vars || {},
          visited: saved.visited || {}
        };
      }
    } catch (e) {}
    return null;
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }

  /* --- Text ------------------------------------------------------- */

  // "{{name}}" in prose or a choice label is replaced with state.vars.name
  function fill(text) {
    return String(text).replace(/\{\{\s*([\w$.]+)\s*\}\}/g, function (_, key) {
      var value = state.vars[key];
      return value === undefined || value === null ? "" : String(value);
    });
  }

  // A scene's `text` may be one string ("" splits paragraphs on blank lines)
  // or an array of strings, one per paragraph.
  function paragraphs(text) {
    if (text == null) return [];
    if (Array.isArray(text)) return text;
    // A blank line (even one padded with indentation) starts a new paragraph.
    return String(text).split(/\n[ \t]*\n/);
  }

  /* --- Effects & conditions ------------------------------------- */

  // `onEnter` / a choice's `do`: either a function (gets vars to mutate)
  // or a plain object that is merged into vars.
  function applyEffect(effect) {
    if (!effect) return;
    if (typeof effect === "function") { effect(state.vars); return; }
    Object.keys(effect).forEach(function (key) { state.vars[key] = effect[key]; });
  }

  // A choice shows when it has no `when`, when `when` is truthy, or when
  // `when(vars, visited)` returns true.
  function isVisible(choice) {
    if (choice.when === undefined) return true;
    if (typeof choice.when !== "function") return !!choice.when;
    try {
      return !!choice.when(state.vars, state.visited);
    } catch (e) {
      console.error("Del's Bridge: choice \"when\" threw", choice, e);
      return false;
    }
  }

  function destination(choice) {
    if (typeof choice.to === "function") return String(choice.to(state.vars));
    return choice.to;
  }

  /* --- Rendering ------------------------------------------------ */

  // opts.replay === true re-draws a scene without counting the visit or
  // re-running onEnter — used when restoring a saved game on page load, so
  // that reloading the tab can't farm an onEnter effect.
  function render(sceneId, opts) {
    var scene = STORY.scenes[sceneId];
    if (!scene) {
      showError('Missing scene: "' + sceneId + '".\n' +
                'Check the "to" values in story.js.');
      return;
    }

    state.scene = sceneId;
    if (!(opts && opts.replay)) {
      state.visited[sceneId] = (state.visited[sceneId] || 0) + 1;
      applyEffect(scene.onEnter);
    }
    save();

    renderProse(scene.text);
    renderChoices(scene.choices || []);
    disarmRestart();

    // Replay the entrance animation.
    el.scene.classList.remove("is-entering");
    void el.scene.offsetWidth;
    el.scene.classList.add("is-entering");

    // Send keyboard + screen-reader focus to the fresh text.
    el.prose.setAttribute("tabindex", "-1");
    el.prose.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderProse(text) {
    el.prose.textContent = "";
    var parts = paragraphs(text)
      .map(function (part) { return fill(part).trim(); })
      .filter(function (part) { return part !== ""; });
    if (parts.length === 0) {
      el.prose.appendChild(document.createElement("p"));
      return;
    }
    parts.forEach(function (part) {
      var p = document.createElement("p");
      p.textContent = part;
      el.prose.appendChild(p);
    });
  }

  function renderChoices(all) {
    el.choices.textContent = "";
    var choices = all.filter(isVisible);

    if (choices.length === 0) {
      el.choices.classList.add("choices--end");
      var end = document.createElement("li");
      end.className = "the-end";
      end.textContent = STORY.endText || "The End";
      el.choices.appendChild(end);
      el.choices.appendChild(actionItem(STORY.againText || "Begin again", restart));
      return;
    }

    el.choices.classList.remove("choices--end");
    choices.forEach(function (choice, i) {
      el.choices.appendChild(actionItem(fill(choice.label), function () {
        applyEffect(choice.do);
        render(destination(choice));
      }, i + 1));
    });
  }

  function actionItem(label, onClick, number) {
    var li = document.createElement("li");
    var button = document.createElement("button");
    button.type = "button";
    button.className = "choice";

    if (number) {
      var key = document.createElement("span");
      key.className = "choice-key";
      key.textContent = number;
      button.appendChild(key);
    }

    var span = document.createElement("span");
    span.className = "choice-label";
    span.textContent = label;
    button.appendChild(span);

    button.addEventListener("click", onClick);
    li.appendChild(button);
    return li;
  }

  function showError(message) {
    el.prose.textContent = "";
    el.choices.textContent = "";
    var p = document.createElement("p");
    p.className = "engine-error";
    p.textContent = message;
    el.prose.appendChild(p);
  }

  /* --- Start over (two clicks) -------------------------------- */

  function disarmRestart() {
    armed = false;
    if (el.restart) {
      el.restart.removeAttribute("data-armed");
      el.restart.textContent = "Start over";
    }
  }

  function onRestartClick() {
    if (!armed) {
      armed = true;
      el.restart.setAttribute("data-armed", "true");
      el.restart.textContent = "Start over?";
      window.setTimeout(disarmRestart, 3000);
      return;
    }
    restart();
  }

  function restart() {
    clearSave();
    state = { scene: null, vars: {}, visited: {} };
    render(STORY.start);
  }

  /* --- Keyboard --------------------------------------------- */

  function onKeydown(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (/^(input|textarea|select)$/i.test(e.target.tagName)) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) {
      // Only real, numbered choices — not the "begin again" button on an ending.
      var button = el.choices.querySelectorAll(".choice")[n - 1];
      if (button && button.querySelector(".choice-key")) {
        e.preventDefault();
        button.click();
      }
    }
  }

  /* --- Boot ------------------------------------------------ */

  function boot() {
    try {
      if (!STORY || !STORY.scenes) throw new Error("no scenes");
    } catch (e) {
      showError("story.js didn't load, or it has an error. Check the console.");
      return;
    }
    if (!STORY.scenes[STORY.start]) {
      showError('story.js: start scene "' + STORY.start + '" does not exist.');
      return;
    }

    if (STORY.title) {
      document.title = STORY.title;
      if (el.title) el.title.textContent = STORY.title;
    }

    document.addEventListener("keydown", onKeydown);
    if (el.restart) {
      el.restart.hidden = false;
      el.restart.addEventListener("click", onRestartClick);
    }

    var saved = load();
    if (saved) {
      state = saved;
      render(saved.scene, { replay: true });
    } else {
      render(STORY.start);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
