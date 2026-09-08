/* ===========================================================================
 * Cascadia Story — the story lives here. This is the file you write in.
 * ===========================================================================
 *
 * PROVISIONAL FORMAT. The engine currently renders a choice-based scene
 * graph. The real interaction model — type anything, an AI responds, with
 * guardrails that keep the story moving — is still being designed, and this
 * format will change to match it. Treat what's below as a placeholder.
 *
 * STORY
 *   title      shown wherever [data-title] is, and as the tab title
 *   start      id of the first scene
 *   endText    words shown when a scene has no choices     (default "The End")
 *   againText  label of the replay button on an ending     (default "Begin again")
 *   scenes     an object of scenes, keyed by id
 *
 * SCENE
 *   text     a string, or an array of strings (one per paragraph). In a
 *            single string, a blank line starts a new paragraph. "{{name}}"
 *            is replaced with vars.name.
 *   onEnter  (optional) runs on entry — an object merged into vars
 *            ({ metGuard: true }) or a function ((v) => { v.turns++ }).
 *   choices  an array; empty (or missing) means this scene is an ending.
 *
 * CHOICE
 *   label    button text (supports "{{name}}")
 *   to       id of the next scene, or a function
 *            (v) => v.hasKey ? "vault" : "locked"
 *   do       (optional) like onEnter — runs before moving on
 *   when     (optional) show only when truthy, or when when(vars, visited)
 *            returns true. `visited` maps scene id -> times entered.
 *
 * Progress saves to the browser automatically; [data-restart] clears it.
 * =========================================================================== */

const STORY = {
  title: "Cascadia Story",
  start: "start",
  endText: "The End",
  againText: "Play again",

  scenes: {
    start: {
      text: "Opening text goes here.",
      choices: [
        { label: "First choice", to: "second" },
        { label: "Second choice", to: "second" }
      ]
    },

    second: {
      text: [
        "A second scene.",
        "Placeholder — the real story and input model come after the UI design."
      ],
      choices: [
        { label: "Back to the start", to: "start" }
      ]
    }
  }
};
