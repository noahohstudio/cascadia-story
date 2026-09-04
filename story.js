/* ===========================================================================
 * Scribble Story — the story lives here.
 * ===========================================================================
 *
 * This is the only file you need to edit to write your game. Replace the
 * sample below with your own.
 *
 * SHAPE
 *   STORY.title      shown small at the top, and as the browser tab title
 *   STORY.start      id of the first scene
 *   STORY.endText    the words shown when a scene has no choices ("The End")
 *   STORY.againText  label of the replay button on an ending
 *   STORY.scenes     an object of scenes, keyed by id
 *
 * A SCENE
 *   art      (optional) path to an illustration, e.g.
 *            "assets/illustrations/porch.png". If the file isn't there yet,
 *            the page shows a dashed box with the filename so you know what
 *            to draw. Leave it out for a text-only scene.
 *   text     a string, or an array of strings (one per paragraph). In a
 *            single string, a blank line starts a new paragraph. Write
 *            "{{name}}" anywhere to drop in the value of vars.name.
 *   onEnter  (optional) runs when the scene opens. Either an object that is
 *            merged into your vars ({ metGhost: true }) or a function that
 *            receives vars to change ((v) => { v.turns++; }).
 *   choices  an array. No choices (or an empty array) means this is an
 *            ending.
 *
 * A CHOICE
 *   label    the text on the button. Supports "{{name}}" too.
 *   to       the id of the scene it leads to. May also be a function
 *            (v) => v.hasKey ? "vault" : "locked_out".
 *   do       (optional) same idea as onEnter — an object merged into vars,
 *            or a function given vars to change. Runs before you move on.
 *   when     (optional) show this choice only when it's truthy, or when
 *            when(vars, visited) returns true. `visited` is a map of
 *            scene id -> how many times you've been there.
 *
 * Progress saves to the browser automatically. "Start over" clears it.
 * =========================================================================== */

const STORY = {
  title: "The Moss Door",
  start: "porch",
  endText: "· fin ·",
  againText: "Walk up the path again",

  scenes: {
    porch: {
      art: "assets/illustrations/porch.png",
      text: [
        "Rain has been falling since the county line, and your shoes have stopped pretending to keep it out.",
        "The house stands at the top of the path the way houses do in dreams — patient, a storey too tall. The door is painted the green of old moss. Someone has left the porch lamp burning, though it is only just past noon."
      ],
      choices: [
        { label: "Knock", to: "hall" },
        { label: "Try the handle", to: "hall", do: { triedHandle: true } },
        { label: "Step back and count the windows", to: "windows" }
      ]
    },

    windows: {
      art: "assets/illustrations/windows.png",
      text: [
        "You step back onto the wet grass and count. Nine windows, each one holding the same flat square of sky.",
        "In the topmost pane something pale leans close, considers you, and withdraws. The lamp above the door does not flicker."
      ],
      choices: [
        { label: "Go to the door", to: "hall" }
      ]
    },

    hall: {
      art: "assets/illustrations/hall.png",
      text: [
        "The door gives without a sound. Inside: a narrow hall, a coat still dripping on its hook, a clock keeping time for no one.",
        "The house breathes warm around you. A passage runs back toward a smell of bread. Stairs climb into brown shadow."
      ],
      choices: [
        { label: "Follow the passage", to: "kitchen" },
        { label: "Climb the stairs", to: "landing" },
        {
          label: "Wipe your prints from the handle",
          to: "wiped",
          when: (v) => v.triedHandle
        }
      ]
    },

    wiped: {
      // No art — a small beat between rooms.
      text: "You step back onto the porch and polish the brass with your sleeve, though you can't say why it matters now. The house seems, faintly, to approve.",
      onEnter: { triedHandle: false },
      choices: [
        { label: "Go back inside", to: "hall" }
      ]
    },

    kitchen: {
      art: "assets/illustrations/kitchen.png",
      text: [
        "The kitchen is yellow with lamplight, and the oven is warm when you rest a hand against it. Two chairs. One cup, set out and still steaming, as if for you.",
        "The near chair pulls back easily."
      ],
      choices: [
        { label: "Sit, and drink", to: "ending_stay" },
        { label: "Leave the cup. Go back to the hall", to: "hall" }
      ]
    },

    landing: {
      art: "assets/illustrations/landing.png",
      text: [
        "The stairs let you out onto a landing of shut doors. Only one has a key, and the key is on your side of it.",
        "Through the small window your car sits exactly where you left it, hazard lights still ticking in the rain."
      ],
      choices: [
        { label: "Turn the key and go in", to: "ending_room" },
        { label: "Go back down and out to the car", to: "ending_leave" },
        { label: "Back to the hall", to: "hall" }
      ]
    },

    ending_stay: {
      art: "assets/illustrations/ending-stay.png",
      text: [
        "You sit. The tea is exactly the temperature of a held hand. Outside, the rain keeps its own counsel, and you find you are in no hurry at all.",
        "Some houses are only asking you to stay a while. This was one of those."
      ],
      choices: []
    },

    ending_room: {
      art: "assets/illustrations/ending-room.png",
      text: [
        "The key turns like it was cut this morning. Inside: a small bed, a nightlight shaped like a moon, and on the sill the pale thing from the window — closer to a curtain than a child, and only a little sorry to be seen.",
        "It lifts one hand. After a moment, you lift yours."
      ],
      choices: []
    },

    ending_leave: {
      art: "assets/illustrations/ending-leave.png",
      text: [
        "You pull the moss-green door shut behind you and take the steps two at a time. The lamp goes out as you reach the car — not switched off, just finished.",
        "In the mirror the house is already smaller than a house should be. You drive until the radio finds a station."
      ],
      choices: []
    }
  }
};
