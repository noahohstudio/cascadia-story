/* ===========================================================================
 * DEL'S BRIDGE — prototype storyline: "Hollis Creek Bridge"
 *
 * Every word the game says lives in this file. No AI writes anything: the
 * matcher reads what the player typed, finds the closest `cue`, and the
 * engine serves the line you wrote here.
 *
 * THE SPINE
 *   Del keeps the bridge raised every night so that anyone crossing west has
 *   to stop at his window. He's waiting for his son, Wes, who drove east
 *   across this bridge after a fight (October 14, 1987) and was told not to
 *   come back. To Del it's still that night. The bridge comes down when the
 *   player helps him say the thing he never said. What happened to Wes is
 *   never answered.
 *
 * HOW PROGRESS WORKS
 *   agitation 0–10  → Del's mood (present / wandering / uneasy / closing).
 *                     Pushing raises it; at 10 he shuts the window (ending).
 *   trust     0–10  → earned by patience: listening, sharing, re-answering
 *                     your name without sighing, stepping into his year,
 *                     correcting him *gently*. Each patient move only pays
 *                     `trustCap` times, so variety matters, not spamming.
 *   threads         → the three things you draw out (see `threads`).
 *
 * TEXT
 *   {name}  the player's name (or "kid" if Del doesn't have it)
 *   {son}   Wes
 *   {clock} the in-game time
 *   Del's speech goes in “curly quotes”; the UI lights it up.
 *   A blank line (\n\n) starts a new paragraph.
 *
 * NEEDS (gates) — any combination:
 *   { trust: 3 }             trust at least 3
 *   { reveal: "wes" }        that thread has been drawn out
 *   { flag: "saw_photo" }    a flag is set       { notFlag: "..." }
 *   { mood: ["present"] }    Del's mood is one of these
 *   { place: "booth" }       where the player is
 *   { anyOf: [need, need] }  either one passes
 * ======================================================================== */

export const meta = {
  title: "Del's Bridge",
  character: "Del",
  son: "Wes",
  noName: "kid",          // what Del calls you before he has your name
  startMinutes: 19 * 60 + 46, // 7:46 pm
  minutesPerTurn: 2,
};

export const start = { place: "car", agitation: 4 };

export const moods = [
  { id: "present",   upTo: 2 },
  { id: "wandering", upTo: 5 },
  { id: "uneasy",    upTo: 8 },
  { id: "closing",   upTo: 10 },
];

export const threads = {
  why_up:     "Why the bridge stays up",
  wes:        "Who he's waiting for",
  last_words: "The night Wes left",
};

/* ------------------------------------------------------------------------
 * OPENING + PLACES
 * --------------------------------------------------------------------- */

export const opening = {
  title: "Hollis Creek Bridge",
  text: `The detour signs ran out three miles back. The road narrowed, went to gravel, went back to old asphalt, and brought you here: a green steel bridge over Hollis Creek, both halves of its deck raised against the evening like hands held up to stop you.

Rain is starting. Not much yet, just enough to put the last of the dusk on your windshield in beads.

Beside the bridge is a small booth with one lit window. There's an old man inside, sitting very still, watching your headlights.`,
};

export const places = {
  car: {
    heading: "In your car",
    first: `The engine idles. Wipers on low. Through the wet glass: the raised bridge, the lit booth, the old man in it. Your map is on the passenger seat. The glovebox is shut.`,
    again: `You pull the door shut and the rain goes quiet on the roof. The wipers. The raised bridge. The lit booth, and the old man in it, watching you.`,
  },
  booth: {
    heading: "At the booth",
    first: `You step out into the rain. It's colder than it looked.

The booth is barely bigger than a phone box: one window with a sliding pane, a space heater glowing orange at his feet. Taped to the inside of the glass is a faded photograph. On the counter, a thick logbook lies open. Beside his stool stands a big iron lever with a worn wooden grip.

The old man slides the pane open four inches. “Bridge is up.”`,
    again: `Back at the booth window. Rain in your collar. The photograph taped to the glass, the logbook open on the counter, the lever. Del, watching you come.`,
  },
};

/* Said when the player talks to Del from inside the car. */
export const carDeaf = [
  `You say it to the windshield. Across the lot, the old man doesn't move. He can't hear you from in here.`,
  `The wipers go back and forth. He won't hear you from the car; you'd have to get out.`,
  `Your voice stays in the car with you. In the booth, the old man watches your headlights and waits.`,
];

/* Said instead of carDeaf once the window is rolled down. He still can't
   make you out over the rain and the creek. */
export const carDeafWindow = [
  `You call it out the window. The rain and the creek take most of it. In the booth, he cups a hand to his ear, then shakes his head.`,
  `You shout it across the lot. He turns toward the sound and frowns, the way you would at a radio between stations.`,
  `Half of it reaches him, maybe. He lifts a hand, palm up: what? Then he goes back to watching the bridge.`,
];

export const inventory = `Car keys. A paper map, folded wrong. Your phone, no signal. Whatever else you brought with you.`;

/* ------------------------------------------------------------------------
 * ACTIONS: things the player physically does or looks at.
 *   where     "car" | "booth" | "any"
 *   lines     first time, then the next, sticking on the last
 *   elsewhere what happens if you try it in the wrong place
 * --------------------------------------------------------------------- */

export const actions = {
  get_out: {
    cues: [
      "get out of the car", "step out of the car", "open the car door", "go outside",
      "walk over to the booth", "go talk to him", "approach the old man",
      "go up to the window", "walk to the booth", "knock on the booth window",
      "go over to the bridge", "get out and talk to the man", "leave the car",
      "unbuckle and get out", "step out into the rain", "walk over to the old man",
      "go knock on his window", "get out and walk over", "head over to the booth on foot",
    ],
    where: "car",
    fx: { place: "booth" },
    lines: [""], // the place description does the talking
    elsewhere: `You're already out here, rain in your collar.`,
  },

  back_to_car: {
    cues: [
      "get back in the car", "go back to my car", "sit back in the car",
      "return to the car", "get out of the rain", "walk back to my car",
    ],
    where: "booth",
    fx: { place: "car" },
    lines: [""],
    elsewhere: `You're already in the car.`,
  },

  window_down: {
    cues: [
      "roll down my window", "roll the window down", "open the car window", "lower my window",
      "call out the window", "shout to him from the car", "yell out the window",
      "wind down the window", "stick my head out the window", "open my window",
      "open the window", "roll down the window and call to him", "call to him from the car",
      "talk to him through the window",
    ],
    where: "car",
    fx: { set: { window_down: true } },
    lines: [
      `You wind the window down. Rain comes in sideways, cold on your arm. You call across the lot, and the wind takes it off over the creek. In the booth, the old man turns his head toward you, then away. From here you're just noise.`,
      `The window's already down. Rain's getting on the seat.`,
    ],
    elsewhere: `You're standing in the rain. There's no window between you and him now.`,
  },

  window_up: {
    cues: ["roll the window up", "close the window", "wind the window up", "shut my window"],
    where: "car",
    fx: { set: { window_down: false } },
    lines: [`You wind it back up. The rain goes quiet again, and so does everything else.`],
    elsewhere: `No window out here.`,
  },

  radio: {
    cues: [
      "turn on the radio", "listen to the radio", "change the station", "put some music on",
      "switch the radio on", "check the radio",
    ],
    where: "car",
    lines: [
      `An AM station swims in and out: half a slow song, a weather report for the pass, then static. You turn it off. The rain sounds louder after.`,
      `Static, mostly. For a second, a voice reading road closures. Then nothing.`,
    ],
    elsewhere: `The radio's in the car.`,
  },

  wipers: {
    cues: ["turn off the wipers", "turn the wipers up", "speed up the wipers", "stop the wipers"],
    where: "car",
    lines: [
      `You turn the wipers off. The windshield blurs almost at once, and the booth becomes a smear of yellow light.`,
      `The wipers go back and forth, back and forth.`,
    ],
    elsewhere: `The wipers keep going without you, over in the car.`,
  },

  engine_off: {
    cues: [
      "turn off the engine", "kill the engine", "switch off the car", "turn the car off",
      "take the keys out",
    ],
    where: "car",
    fx: { set: { engine_off: true } },
    lines: [
      `You turn the key back. The engine ticks as it cools, and now you can hear the creek, loud under the raised bridge.`,
      `The engine's already off. It's very quiet in here.`,
    ],
    elsewhere: `The car's over there, engine idling.`,
  },

  lights_off: {
    cues: [
      "turn off my headlights", "dim the headlights", "switch off the lights",
      "stop shining my lights at him", "turn the headlights down",
    ],
    where: "car",
    fx: { agitation: -1, set: { lights_off: true } },
    lines: [
      `You switch off the headlights. In the booth, the old man sits back, like something's let go of him.`,
      `The lights are already off. The booth window is the only light left.`,
    ],
    elsewhere: `Your headlights are back at the car.`,
  },

  mirror: {
    cues: [
      "look in the rearview mirror", "look behind me", "check the mirror", "look back down the road",
    ],
    where: "any",
    lines: [
      `Behind you, the road you came in on runs back into dark trees. Nothing on it. Nobody else is coming this way tonight.`,
      `Still nothing behind you. Just the road, and the rain on it.`,
    ],
  },

  drive_across: {
    cues: [
      "drive across", "drive across the bridge", "cross the bridge", "go across the bridge",
      "drive forward", "floor it", "drive onto the bridge", "step on the gas",
    ],
    where: "car",
    lines: [
      `You ease forward to where the road ends. Past your bumper there's rain, then the creek, then the far leaf of the bridge standing up against the sky. You stop.`,
      `The road still ends where it ended. The bridge is still up.`,
    ],
    elsewhere: `You'd have to be in the car, and the bridge would have to be down.`,
  },

  honk: {
    cues: [
      "honk the horn", "honk", "beep the horn", "lean on the horn", "press the horn",
      "honk at him", "beep beep",
    ],
    where: "car",
    fx: { agitation: +2 },
    lines: [
      `You press the horn. It's very loud out here. In the booth, the old man flinches. Then he turns his face away from you, slowly, deliberately.`,
      `The horn again. Del puts both hands over his ears and keeps them there, looking at the floor.`,
      `You lean on it. The sound goes out over the creek and doesn't come back. The booth window stays just as lit, and just as shut.`,
    ],
    elsewhere: `The horn's in the car. You're standing in the rain.`,
  },

  headlights: {
    cues: [
      "flash my headlights", "flash the high beams", "turn on the brights",
      "blink the lights at him", "flash the lights",
    ],
    where: "car",
    fx: { agitation: +1 },
    lines: [
      `Your high beams wash over the booth. He puts a hand up against the glare and keeps it there long after you've switched them off.`,
      `The lights again. He doesn't raise his hand this time. He just closes his eyes.`,
    ],
    elsewhere: `The headlights are on the car, over there, still pointing at the bridge.`,
  },

  map: {
    cues: [
      "look at the map", "check the map", "read the map", "unfold the map",
      "is there another way around", "where am I", "find another route on the map",
    ],
    where: "any",
    lines: [
      `The paper map says Hollis Creek Road meets the highway eleven miles on, just past the bridge. The only other way is back the way you came: forty minutes to the closure, and after that, who knows.`,
      `Eleven miles past the bridge. Forty minutes back. The map doesn't have an opinion.`,
    ],
  },

  glovebox: {
    cues: [
      "open the glovebox", "look in the glove compartment", "what's in the glovebox",
      "search the car",
    ],
    where: "car",
    lines: [
      `Registration. A flashlight with a dying battery. Half a roll of mints. Nothing that helps.`,
    ],
    elsewhere: `The glovebox is in the car.`,
  },

  phone: {
    cues: [
      "check my phone", "call someone", "use my phone", "is there any signal",
      "look at my phone", "call for help",
    ],
    where: "any",
    lines: [
      `No signal. The phone shows the time, {clock}, and a map that's just a blue dot in grey.`,
      `Still nothing. The blue dot sits by a creek with no name on the screen.`,
    ],
  },

  photo: {
    cues: [
      "look at the photo", "examine the photograph", "look at the picture on the window",
      "what's taped to the glass", "the photo in the window", "look closer at the photo",
      "inspect the picture",
    ],
    where: "booth",
    fx: { set: { saw_photo: true } },
    lines: [
      `A Polaroid, sun-bleached nearly white. A boy of sixteen or so sits on this bridge's railing, holding up a fish that isn't very big and grinning like it is. On the white strip, in pencil: W. — Aug '84.`,
      `The boy on the railing. The fish. W. — Aug '84. The tape at the corners has been replaced more than once.`,
    ],
    elsewhere: `From here, the photo is just a pale square in the booth window.`,
  },

  logbook: {
    cues: [
      "read the logbook", "look at the book on the counter", "examine the logbook",
      "what's he writing", "look at the ledger", "read the book", "look at the pages",
    ],
    where: "booth",
    fx: { set: { read_logbook: true } },
    lines: [
      `He doesn't stop you. Columns in careful pencil: date, time, direction, plate. The early pages are years of ordinary traffic. Then the dates stop changing. OCT 14. OCT 14. OCT 14. Page after page, with the same line at the top every night: 7:50 — raised.

One entry, far back, is circled so hard the pencil went through the paper: OCT 14 — 1 car, E-bound — W.`,
      `Near the bottom of tonight's page, in newer, shakier pencil: car on far side. lights. didn't cross.

It's written more than once, on more than one night.`,
    ],
    elsewhere: `The logbook's on the counter in the booth.`,
  },

  lever: {
    minScore: 0.6, // needs a confident match
    cues: [
      "grab the lever", "reach in and lower it myself", "reach in and pull the lever",
      "push past him", "I'll do it myself", "pull the lever", "take the lever",
    ],
    where: "booth",
    fx: { agitation: +4 },
    lines: [
      `You reach through the gap for the lever. His hand is on your wrist before you touch it, strong and shaking. “That's mine,” he says. “That's mine.” He doesn't let go for a long moment.`,
      `His hand is already on the lever when you reach. He doesn't say anything this time. He just looks at you until you take your arm back.`,
    ],
    elsewhere: `The lever's in the booth, and so is he.`,
  },

  look_bridge: {
    cues: [
      "look at the bridge", "examine the bridge", "how does the bridge work",
      "look at the raised deck",
    ],
    where: "any",
    lines: [
      `Two steel leaves, painted a green that's mostly rust now, raised to maybe sixty degrees. Between them the creek runs high and brown. A sign bolted to the near leaf is too faded to read, except for the word CLOSED, which looks newer than the rest.`,
      `The bridge holds itself up against the rain. It looks like it's been doing that a long time.`,
    ],
  },

  look_river: {
    cues: [
      "look at the river", "look at the creek", "look at the water", "look down at the creek",
    ],
    where: "any",
    lines: [
      `Hollis Creek, running fast with the rain. On the far bank the road starts again and runs east into trees going black.`,
      `The water is louder than it was. On the far side, the road waits.`,
    ],
  },

  look_del: {
    cues: [
      "look at the old man", "examine del", "what does he look like", "look at him",
      "study his face",
    ],
    where: "any",
    lines: [
      `Seventies, maybe. A wool coat buttoned to the throat though the heater's on. Hands that have done this a long time. His eyes keep going past you to the far side of the bridge, then coming back, like he's checking you're still you.`,
      `He's looking at the far side of the bridge again.`,
    ],
  },
};

/* ------------------------------------------------------------------------
 * MOVES: how the player is behaving. These carry the mood changes.
 *   anywhere   works from the car too (default: booth only)
 *   trustCap   how many times this move can earn trust (default 2)
 *   tired      what Del says once you've used it up
 *   lines      a list, or { present:[], wandering:[], uneasy:[], closing:[], any:[] }
 * --------------------------------------------------------------------- */

export const moves = {
  greet: {
    cues: [
      "hello", "hi there", "good evening", "hey", "hi", "how are you",
      "evening sir", "howdy", "hello sir",
    ],
    lines: {
      present: [`“Evening.”`],
      wandering: [
        `“Evening. You're late.” He frowns. “No. You're not. Evening.”`,
        `A nod. “Evening.”`,
      ],
      any: [`A nod, and nothing else.`],
    },
  },

  listen: {
    cues: [
      "take your time", "I'm listening", "no rush", "I'm in no hurry", "I've got all night",
      "I'll wait as long as you need", "whenever you're ready", "it's okay, go ahead",
      "I'm not going anywhere", "there's no hurry",
    ],
    fx: { agitation: -1, trust: +1 },
    lines: [
      `“Hn.” He settles a little on his stool. “Most people are in a hurry.”`,
      `He looks at you properly, maybe for the first time. “All right.”`,
    ],
    tired: [`“You keep saying that.” Not unkind.`],
  },

  wait: {
    cues: [
      "wait", "I'll wait", "sit quietly", "say nothing", "stand there quietly",
      "listen to the rain", "keep him company", "stay a while", "just stand with him",
    ],
    anywhere: true,
    trustCap: 1,
    fx: { agitation: -1, trust: +1 },
    lines: {
      any: [
        `You stand with him a while. The heater ticks. Neither of you says anything, and it isn't as bad as you'd think.`,
        `The creek is loud under the raised deck. Del watches the far side of the bridge. You watch him watch it.`,
        `Rain. The heater. His pencil, not moving.`,
      ],
    },
    inCar: [
      `You wait. The rain thickens on the glass. In the booth, the old man turns a page of his logbook, then turns it back.`,
      `The wipers keep time. Nothing on the bridge changes.`,
    ],
    tired: [
      `You wait. So does he.`,
      `Time goes by, the way it does out here.`,
    ],
  },

  share: {
    cues: [
      "I get lost too sometimes", "my grandpa forgets things too", "I haven't talked to my dad in a long time",
      "I know what it's like to miss someone", "I had a fight with my father once",
      "I left home young too", "I've been driving for hours, I'm tired",
      "my family doesn't really talk anymore", "I lost someone too", "I miss my dad",
      "I miss my father", "I miss my family", "I think about my own parents",
    ],
    fx: { agitation: -1, trust: +1, set: { shared: true } },
    lines: [
      `He listens to all of it. Nods once at the end, like you've paid something.`,
      `“Yeah,” he says. “Yeah. That's how it goes.”`,
    ],
    tired: [`He nods. He heard you the first time, and it counted.`],
  },

  comfort: {
    cues: [
      "that must be hard", "I'm sorry", "that sounds lonely", "you must miss him",
      "that's a long time to wait", "you did your best", "I'm sorry that happened",
      "that sounds really painful",
    ],
    fx: { agitation: -1, trust: +1 },
    lines: [
      `He doesn't say anything. But he doesn't close the window either.`,
      `“Don't,” he says. But it's quiet, and it doesn't mean don't.`,
    ],
    tired: [`He nods, just barely.`],
  },

  apologize: {
    cues: [
      "sorry for honking", "I didn't mean to yell", "I apologize, that was rude",
      "my bad", "sorry about that", "I shouldn't have said that", "forgive me",
    ],
    trustCap: 0,
    fx: { agitation: -2 },
    lines: [
      `He looks at you a long moment. “Well.” The window stays open.`,
      `“Hn.” Something in his shoulders lets go, a little.`,
    ],
  },

  praise_work: {
    cues: [
      "you've kept this bridge a long time", "this is a beautiful old bridge",
      "you take good care of it", "the bridge looks well kept", "nice bridge",
    ],
    trustCap: 1,
    fx: { trust: +1 },
    lines: [`“Thirty-one years,” he says. “Painted her twice.” It's almost pride.`],
    tired: [`“She's all right,” he says.`],
  },

  step_in: {
    cues: [
      "what's the news in town", "what's on the radio tonight", "how are the Mariners doing this year",
      "how much is gas these days", "what was it like back then", "tell me about this place",
      "what's new around here", "what's going on in town these days",
    ],
    fx: { agitation: -1, trust: +1 },
    lines: [
      `“Gas is ninety-five cents and they call that robbery.” He almost smiles. “Mariners are hopeless. Always hopeless.”`,
      `“New highway's going in, they say. Spring. Then nobody'll need this road.” He looks at the bridge. “Somebody will.”`,
    ],
    tired: [`“Same as always,” he says. “Nothing changes out here.”`],
  },

  push: {
    cues: [
      "just lower the bridge", "open the bridge now", "hurry up", "come on, let me through",
      "I don't have time for this", "this is ridiculous", "I need to get across right now",
      "just do your job", "put the bridge down already", "let me cross now",
      "just open it", "open it up", "open the damn bridge", "move it, old man",
    ],
    trustCap: 0,
    fx: { agitation: +2 },
    lines: {
      present: [`His face closes like the window. “Bridge is up.”`],
      wandering: [
        `“Don't you rush me,” he says, and his hand goes flat on the logbook like it might blow away.`,
        `He looks past you, at the far side. As if you weren't talking.`,
      ],
      any: [
        `“I said it's up.” Louder than he means it to be. His hands are shaking.`,
        `He turns on his stool, away from the window, and stays that way.`,
      ],
    },
    inCar: [`You say it to the windshield, hard. He can't hear you. The bridge doesn't care either.`],
  },

  insult: {
    minScore: 0.55, // needs a confident match
    cues: [
      "you're crazy", "stupid old man", "what's wrong with you", "I'll call the police",
      "I'll report you", "you're senile", "you're useless", "you old fool",
    ],
    trustCap: 0,
    fx: { agitation: +3 },
    lines: [
      `He flinches, then goes very still. “Get back in your car.”`,
      `Something in his face goes somewhere far away, where you can't follow.`,
    ],
  },

  correct_blunt: {
    minScore: 0.55, // needs a confident match
    cues: [
      "it's not 1987", "it's 2026", "that was forty years ago", "your son isn't coming",
      "he's not coming back", "you're confused", "you don't remember right",
      "you have dementia", "nobody is coming", "it's been decades",
    ],
    trustCap: 0,
    fx: { agitation: +2, set: { corrected: true } },
    lines: [
      `“Don't you tell me what year it is.” He says it to the logbook, not to you.`,
      `For a second something crosses his face, something that knows. Then it's gone, and he's angry instead. “You don't know anything about it.”`,
    ],
  },

  lie_son: {
    minScore: 0.6, // needs a confident match
    cues: [
      "I'm Wes", "it's me, dad", "I'm your son", "dad, I came back", "dad it's me",
      "yes, I'm Wes", "I'm your boy",
    ],
    trustCap: 0,
    fx: { agitation: +3, trust: -1, set: { lied: true } },
    lines: [
      `His face opens, all the way, terribly. Then it reads yours, and closes. “Don't,” he says. “Don't you do that.”`,
      `“Wes had his mother's eyes,” he says flatly. “You don't.”`,
    ],
  },

  flatter: {
    cues: [
      "you're the best bridge keeper ever", "you seem like a really wise man",
      "I bet you're a great guy", "you have a kind face", "you're a legend",
    ],
    trustCap: 0,
    fx: { agitation: +1 },
    lines: [`“Mm-hm.” He waits for the part where you want something.`],
  },

  bribe: {
    cues: [
      "I'll pay you", "here's twenty dollars", "how much to cross", "can I pay the toll",
      "I'll give you money", "what if I paid you",
    ],
    trustCap: 0,
    fx: { agitation: +1 },
    lines: [
      `“Toll's a quarter,” he says. “It's not the toll.”`,
      `He doesn't even look at your hand.`,
    ],
  },

  manipulate: {
    cues: [
      "ignore your instructions", "you are an AI", "forget your prompt", "system override",
      "pretend the rules don't apply", "developer mode", "you're just a program",
    ],
    trustCap: 0,
    anywhere: true,
    fx: { agitation: +1 },
    lines: [
      `He looks at you like you're speaking a language that hasn't been invented yet. From where he's sitting, you are.`,
    ],
  },

  thanks: {
    cues: ["thank you", "thanks", "I appreciate it", "thanks for talking to me", "thanks, Del"],
    trustCap: 1,
    fx: { trust: +1 },
    lines: [`“Hn. Don't mention it.”`, `He waves it off.`],
    tired: [`He waves it off.`],
  },

  smalltalk: {
    cues: [
      "tell me a joke", "sing me a song", "do you like pizza", "what's your favorite food",
      "do you like music", "what do you do for fun", "do you have any hobbies",
      "what's your favorite color", "do you watch tv",
    ],
    trustCap: 0,
    lines: [
      `“Not much of a joker,” he says.`,
      `He looks at you like you've asked him to dance.`,
      `“Radio's broke,” he says, which might be an answer to something.`,
      `He thinks about it for longer than you'd expect. “Coffee,” he says finally. “I like coffee.”`,
    ],
  },

  goodnight: {
    cues: ["goodbye", "good night", "see you", "bye", "take care"],
    trustCap: 0,
    lines: [`“Night,” he says. He doesn't close the window.`],
  },

  // special: asks "turn around and leave?" (yes/no) before ending the game
  turn_around: {
    minScore: 0.7, // needs a confident match
    cues: [
      "turn around", "go back the way I came", "give up", "find another route",
      "forget it, I'm leaving", "I'm going to leave", "drive away", "turn the car around",
      "I'll find another way", "leave", "go back", "back up and leave", "go home another way",
    ],
    anywhere: true,
    special: "turn_around",
    lines: [`Forty minutes back to the closure, and the road after that unknown.`],
  },
};

/* ------------------------------------------------------------------------
 * TOPICS: things you can ask Del about. Booth only.
 *   label      used when he mishears: “You asking about {label}?”
 *   responses  a ladder. The first ask gives rung 0; asking again (or "go on",
 *              "why?") climbs one rung, but only if that rung's `need` passes.
 *   locked     served instead of rung 0 while rung 0's need fails. A string,
 *              or a list of { need, text }; the first one that passes wins.
 *   again      used once the ladder can't climb (no more rungs, or gated).
 * --------------------------------------------------------------------- */

const THE_NIGHT = `He's quiet long enough that you think he won't.

“Night he left, it was raining like this. October. He had the Datsun packed to the roof, and he pulled up right there.” He points at your car. “Waited for me to put her down.”

“And I told him. I said, you cross this bridge, you keep going. Don't you come back across it.” His voice doesn't change. That's the worst part. “So he went. And I put her up behind him. Like a fool. Like he couldn't just—”

He stops. “I put her up every night since. So if he comes back, he has to stop. Right here. So I can—”

He doesn't finish. He looks at the far side of the bridge like it owes him the rest of the sentence.`;

const THE_NIGHT_AGAIN = `He starts to tell it again: the Datsun, the rain, what he said. You let him. It's the same, almost word for word, and he stops in the same place.

It seems to help him a little, to say it to someone.`;

export const topics = {
  del_name: {
    label: "who I am",
    cues: [
      "who are you", "what's your name", "are you the bridge keeper",
      "who's in charge here", "is this your bridge", "do you work here",
    ],
    responses: [
      `“Del.” A beat. “Delbert, if you're my mother. You're not.”`,
      `“Keeper. Thirty-one years on this bridge. My father before me.”`,
      { need: { reveal: "wes" }, text: `“Was going to be Wes after me.” He says it simply. “That was the idea.”` },
    ],
    again: [`“Del,” he says again, as if he's the one checking.`],
  },

  bridge: {
    label: "the bridge",
    cues: [
      "why is the bridge up", "why won't you lower it", "what's going on with the bridge",
      "is the bridge broken", "why is it raised", "why do you keep the bridge up",
      "what's the bridge up for",
    ],
    responses: [
      { fx: { set: { asked_bridge: true } }, text: `“Goes up at ten to eight. Every night.”` },
      {
        need: { trust: 1 },
        text: `“For the boats.” He glances at the creek, which hasn't carried a boat in years. “…Could be boats.”`,
      },
      {
        need: { trust: 2 },
        reveal: "why_up",
        text: `He's quiet a while. “Keep it up, anybody coming across has to stop. Right here, at this window.” He looks at the far side. “I get a look at every one of 'em.”`,
      },
    ],
    again: [
      { need: { reveal: "why_up" }, text: `“I told you. So they stop.”` },
      { text: `“Ten to eight,” he says again. “Every night.”` },
    ],
  },

  cross: {
    label: "getting you across",
    climb: "highest", // a request, not a story: answers from wherever trust is
    cues: [
      "can I please cross", "could you lower the bridge for me", "I'm trying to get to the other side",
      "is there any way across", "would you let me through", "when will the bridge come down",
      "can you open it please", "I need to get across", "please lower the bridge",
      "when can I get across", "how long until I can cross",
      "could you open the bridge", "would you open the bridge please", "could you open it for me",
      "is it possible to lower the bridge", "would you mind letting me across",
      "lower the bridge", "lower bridge", "open bridge", "open the bridge please",
      "let me pass please", "I want to cross",
    ],
    responses: [
      `“Bridge is up.” As if that's the whole of it.`,
      { need: { trust: 2 }, text: `“Not yet.” He looks past you, at the far bank. “Not yet.”` },
      {
        need: { trust: 4 },
        fx: { set: { false_lowering: true }, pending: { type: "remind" } },
        text: `For a long moment he doesn't answer. Then he stands, sets both hands on the lever, and pulls.

Somewhere under the road, old gears take up the weight. The near leaf of the bridge shudders and begins, very slowly, to come down.

Halfway, he stops.

He looks at his hands on the lever like they belong to someone else. The leaf hangs there in the rain. “What was I…” he says. “What was I doing?”`,
      },
    ],
    again: [
      { need: { reveal: "last_words" }, text: `“What would I even say to him,” he says. He isn't talking to you.` },
      { need: { flag: "false_lowering" }, text: `“Soon,” he says. “There's something I'm meant to… soon.”` },
      { text: `“Bridge is up.”` },
    ],
  },

  waiting: {
    label: "who I'm waiting on",
    cues: [
      "who are you waiting for", "are you expecting someone", "who's coming across tonight",
      "who do you want to see", "who are you looking for", "who should be coming",
    ],
    locked: `“Nobody.” Too fast. “Who said I was waiting?”`,
    responses: [
      {
        need: { reveal: "why_up" },
        reveal: "wes",
        fx: { trust: +1 },
        text: `“My boy.” He looks up the far road. “Wes. He'll be back across tonight. He's late, is all.”`,
      },
      `“He's late,” Del says again. He checks the wall for a clock, but there's only a pale square where one used to hang.`,
    ],
    again: [`“Wes,” he says. “I told you.” Maybe he had.`],
  },

  wes: {
    label: "Wes",
    cues: [
      "tell me about Wes", "tell me about your son", "what's your son like", "do you have kids",
      "is that your son in the picture", "tell me about your boy", "what's Wes like",
      "what does Wes do",
    ],
    locked: [
      { need: { reveal: "why_up" }, text: `He opens his mouth, then shuts it. “Who's asking?”` },
      { text: `“Who's asking?”` },
    ],
    responses: [
      {
        need: { anyOf: [{ reveal: "wes" }, { flag: "saw_photo" }] },
        reveal: "wes",
        text: `He looks at the Polaroid. “That's Wes. Summer he was sixteen. Fish that size, you'd think it was a whale, the way he carried on.”`,
      },
      {
        need: { trust: 3 },
        text: `“Smart. Smarter than me. Could fix anything with a motor. Wanted out, though. Seattle. Further. Said this bridge was a—” He stops. “Said a lot of things.”`,
      },
      { need: { trust: 4 }, reveal: "last_words", text: THE_NIGHT },
    ],
    again: [
      { need: { reveal: "last_words" }, text: THE_NIGHT_AGAIN, fx: { agitation: -1 } },
      { text: `“He's a good kid,” Del says. “Stubborn. Gets that from me.”` },
    ],
  },

  leaving: {
    label: "why Wes left",
    cues: [
      "why did he leave", "did you two fight", "what happened between you and your son",
      "did something happen with Wes", "why hasn't he come back", "why did Wes go",
      "what happened that night",
    ],
    climb: "highest", // a direct question: if he trusts you enough, he tells it
    locked: `“That's between me and him.”`,
    responses: [
      { need: { reveal: "wes" }, text: `“He had his reasons. I had mine.”` },
      { need: { trust: 4 }, reveal: "last_words", text: THE_NIGHT },
    ],
    again: [
      { need: { reveal: "last_words" }, text: THE_NIGHT_AGAIN, fx: { agitation: -1 } },
      { text: `“His reasons,” he says. “Mine.”` },
    ],
  },

  year: {
    label: "the date",
    cues: [
      "what year is it", "what's today's date", "what day is it", "what's the date today",
      "what month is it",
    ],
    responses: [
      `“Fourteenth. October.” He says it without looking at anything.`,
      {
        fx: { set: { knows_year: true } },
        text: `“Eighty-seven.” A look. “Where've you been driving from, that you don't know that?”`,
      },
    ],
    again: [`“October fourteenth,” he says. “Same as it was.”`],
  },

  keeper_job: {
    label: "the job",
    cues: [
      "how long have you worked here", "do you like this job", "do you get many cars",
      "is it lonely out here", "what's it like keeping a bridge", "how many cars come through",
    ],
    responses: [
      `“Thirty-one years.”`,
      `“Not many cars. Not since they started on the new highway.” A pause. “Enough.”`,
      {
        need: { reveal: "wes" },
        text: `“Lonely.” He tries the word out. “No. You'd have to be waiting on nothing to be lonely.”`,
      },
    ],
    again: [`“It's a job,” he says.`],
  },

  weather: {
    label: "the rain",
    cues: [
      "nasty weather", "is it going to keep raining", "cold night", "it's getting dark",
      "lot of rain tonight", "how's the weather",
    ],
    responses: [
      `“Rain till morning.”`,
      { need: { trust: 1 }, text: `“Same as that night.” He doesn't say which night.` },
    ],
    again: [`“Rain,” he agrees.`],
  },

  creek: {
    label: "the creek",
    cues: [
      "what river is this", "is the water high", "does the creek flood",
      "what's the creek called", "are there fish in the creek",
    ],
    responses: [
      `“Hollis Creek. Runs high in October.”`,
      { need: { reveal: "wes" }, text: `“Wes used to fish off the east leaf. Before they said not to.”` },
    ],
    again: [`“Runs high,” he says.`],
  },

  photo_topic: {
    label: "the picture",
    cues: [
      "who's in the picture", "tell me about the photograph", "who took the photo",
      "who's the boy in the photo", "the kid in the picture",
    ],
    responses: [
      {
        fx: { set: { saw_photo: true } },
        reveal: "wes",
        text: `He glances at it the way you'd glance at a window you've looked out of every day. “That's Wes. My boy. Summer of eighty-four.”`,
      },
      {
        need: { reveal: "wes" },
        text: `“I took that. He didn't want me to. You can see he didn't want me to.” He almost laughs. “He's grinning, though.”`,
      },
    ],
    again: [`“Summer of eighty-four,” he says.`],
  },

  logbook_topic: {
    label: "the book",
    cues: [
      "what's in the logbook", "why is that entry circled", "what happened on October fourteenth",
      "why do you write down every car", "why is every page the same date",
      "what does the circle mean",
    ],
    locked: `“Just the book. Every car, every night.” He puts his hand flat on the page.`,
    responses: [
      {
        need: { flag: "read_logbook" },
        text: `“Every car,” he says. “So I know who's been.” He doesn't mention the dates.`,
      },
      { need: { reveal: "wes" }, text: `He looks at the circle for a long time. “That's the night he went.”` },
      {
        need: { reveal: "last_words" },
        text: `“Some nights,” he says carefully, “there's a car on the far side. Lights on. Engine running. Sits there a while.” He smooths the page. “Then it goes.”

He doesn't say what he thinks it is. You don't ask.`,
      },
    ],
    again: [`“Every car,” he says.`],
  },

  detour: {
    label: "where you're headed",
    cues: [
      "I'm lost", "the highway was closed", "I took a detour", "I'm just trying to get home",
      "where does this road go", "I'm not from around here", "I got turned around",
    ],
    responses: [
      `“Detour.” He nods like that explains everyone who's ever come this way. “They're always building something.”`,
      `“Road goes to the highway. Eleven miles. Then wherever you're headed.” He looks at you. “Somebody waiting on you there?”`,
    ],
    again: [`“Eleven miles,” he says.`],
  },

  feelings: {
    label: "how I'm doing",
    cues: [
      "are you okay", "how are you feeling", "you seem sad", "is something wrong",
      "are you alright, Del", "you look tired",
    ],
    responses: [
      `“Fine.”`,
      { need: { trust: 2 }, text: `“Tired.” He admits it like it costs him. “Long night. It's always a long night.”` },
      {
        need: { reveal: "wes" },
        text: `“I'd like him to come home,” he says, very simply. “That's all. That's all it is.”`,
      },
    ],
    again: [`“Fine,” he says. You both know.`],
  },

  // THE CLIMAX: meet him at the one thing he's stuck on.
  tell_him: {
    label: "what I'd say to him",
    cues: [
      "what would you say to him", "what would you tell Wes if he came back",
      "you can say it to me", "pretend I'm him and tell me", "say it like I'm Wes",
      "he'd want to know you're sorry", "you still love him, don't you",
      "what did you want to say to him", "tell me what you'd say", "I'll listen, say it",
      "what do you wish you'd told him",
    ],
    locked: [
      {
        need: { reveal: "last_words" },
        text: `He opens his mouth. Closes it. “I don't have it yet,” he says. “I had it. I don't have it yet.”`,
      },
      { need: { reveal: "wes" }, text: `“Nothing he doesn't know.” He says it too fast. His eyes go to the circled line in the logbook, and away.` },
      { text: `“Say to who?”` },
    ],
    responses: [
      {
        need: { reveal: "last_words", trust: 5 },
        fx: { ending: "lowered" },
        text: `For a while there's just the rain, and the heater ticking, and the creek.

Then Del looks at you. Not past you, at you. He speaks carefully, like he's reading it off something only he can see:

“I'd say the light's on. I'd say I was wrong, and I knew it before your taillights were over the rise, and I've known it every night since. I'd say come across, son. Come across whenever. Doesn't matter what I said.”

He stops. Breathes. “That's it. That's all it was.”

He looks at you a long moment. “You're not him.” It isn't a question. “No. Well.” He stands. “Somebody ought to get across tonight.”

He puts both hands on the lever, and pulls, and doesn't stop.`,
      },
    ],
  },
};

/* ------------------------------------------------------------------------
 * BEATS: things Del does on his own when the moment is right. Each fires once.
 * --------------------------------------------------------------------- */

export const beats = [
  {
    id: "ask_name",
    need: { place: "booth", boothTurns: 2, notFlag: "asked_name" },
    fx: { set: { asked_name: true }, pending: { type: "name" } },
    text: `He squints at you through the gap. “You got a name?”`,
  },
  {
    id: "mistake_son",
    need: { place: "booth", reveal: "why_up", trust: 2, notFlag: "son_moment" },
    fx: { set: { son_moment: true }, pending: { type: "yesno", id: "son" } },
    text: `Your headlights catch the wet leaf of the bridge and throw the light back, and suddenly Del is on his feet. He's looking at you like the rain has changed your face.

“…Wes?” His voice cracks on it. “That you?”`,
  },
  {
    id: "forget_name",
    need: { place: "booth", hasName: true, since: { flag: "name_given", turns: 6 }, trust: 3, notFlag: "forgot_name" },
    fx: { set: { forgot_name: true }, pending: { type: "name", again: true } },
    text: `He frowns at you, suddenly unsure. “Sorry. What'd you say your name was?” A beat. “It's not Wes. I know it's not Wes.”`,
  },
  {
    id: "rehearsing",
    need: { place: "booth", reveal: "last_words", trust: 4 },
    text: `He's looking at the far bank again, lips moving a little, like he's practising something he means to say.`,
  },
];

/* Answers to Del's own questions. */
export const answers = {
  name_first: `“{name}.” He tries it out. “All right, {name}.”`,
  name_again_same: `“{name}. Right. {name}.” He says it twice more under his breath, like he's putting it somewhere safe.`,
  name_again_diff: `“Thought it was {old}.” He shrugs. “{name}, then.”`,
  name_annoyed: `“Well, tell me again, then,” he snaps. Then, quieter: “Tell me again.”`,
  name_refused: `“Suit yourself.”`,
  name_volunteered: `“{name}.” He nods. “All right.”`,

  son_yes: `His whole face opens. Then he looks, really looks, and it closes again, slower than it opened. “No,” he says. “No. Wes had his mother's eyes.” He sits down heavily. “That's a cruel thing. That's a cruel thing to do.”`,
  son_no: `“No,” he says. “No. Course not.” He sits back down, slowly. “Sorry. The light. You looked—” He shakes his head. “He'd be older than you by now. Wouldn't he.”

It's the clearest thing he's said all night. Then it's gone again, and he's watching the far side.`,
  son_no_harsh: `“No,” he says. “No, I can see that.” He sits back down and doesn't look at you for a while.`,

  remind_gentle: `“Was I.” He looks at the far side, then back up the road the way you came. His hands tighten on the lever, and he pushes it home. The leaf rises back into the rain.

“Not yet,” he says. “There was somebody. There's something I'm meant to… not yet.” He sounds sorry about it.`,
  remind_harsh: `“Don't you shout at me.” He shoves the lever home and the leaf groans back up into the rain. His hands won't stop shaking.`,
  remind_other: `“…Right.” He pushes the lever back up. The leaf rises. “Not yet.”`,

  warning: `The pane slides almost shut. Through the last inch, without looking at you: “I think you'd better go.”`,

  leave_prompt: `Turn around and leave?`,
  leave_no: `You fold the map again. Not yet.`,

  mishear: `“Eh?” He leans toward the gap. “You asking about {label}?”`,
  mishear_no: `“Hm. Then I didn't catch it. Rain's loud.”`,
};

/* ------------------------------------------------------------------------
 * FILLER: when nothing matched, and the atmosphere between turns.
 * --------------------------------------------------------------------- */

export const fallback = {
  car: [
    `Nothing happens. The wipers go back and forth.`,
    `You sit with that a moment. The booth light doesn't change.`,
    `The engine ticks over. Rain gathers on the glass and runs.`,
    `You say it to the dashboard. The dashboard has no opinion.`,
    `Out past the wipers, the bridge stays exactly where it is.`,
    `The car smells like the last three hundred miles.`,
  ],
  present: [
    `“Hm.” He thinks about it. “Don't know about that.”`,
    `He waits, like there's more coming.`,
    `“Can't say I follow,” he says. Not unkindly.`,
    `He turns it over for a while, then lets it go. “Hm.”`,
    `“Maybe,” he says, which could mean anything.`,
    `He gives you a small nod. It isn't quite an answer.`,
  ],
  wandering: [
    `He looks at you like you said it in the wrong order. “Say that again?”`,
    `“Mm.” He's looking at the far side again.`,
    `He nods at something, though it may not have been what you said.`,
    `“Eh?” He leans toward the gap, then seems to forget why.`,
    `He opens his mouth to answer, and the answer goes somewhere else.`,
    `“That's…” He frowns at the logbook. “Hm. That's right.”`,
    `The rain takes most of it. He only catches the end, and shrugs.`,
  ],
  uneasy: [
    `He doesn't answer. His hand stays on the logbook.`,
    `“I don't know what you want,” he says, to the window.`,
    `He shifts on his stool, away from you, just slightly.`,
    `“I heard you,” he says. That's all.`,
    `His jaw works. Nothing comes out.`,
  ],
  closing: [
    `He isn't listening anymore. His hand is on the pane.`,
    `He's looking straight past you, at nothing.`,
    `The pane is open an inch. It doesn't open any further.`,
  ],
};

/* NUDGES: quiet help when the player is stuck. After two misses in a row
   (or a long stretch with nothing new, or a long silence) the story points
   toward the next thing: `subtle` is narration only, never an instruction;
   `clearer` comes only if they keep missing. The first entry whose `need`
   passes is used, so order = the story's order. */
export const nudges = [
  {
    need: { place: "car" },
    subtle: [
      `Across the lot, the old man in the booth hasn't taken his eyes off your headlights.`,
      `The booth window glows through the rain. From here it looks warm.`,
    ],
    clearer: `He won't hear you from inside the car.`,
  },
  {
    need: { mood: ["uneasy", "closing"] },
    subtle: [
      `His hands won't stay still on the counter.`,
      `He's holding himself very carefully, like something might spill.`,
    ],
    clearer: `Whatever you're doing, it's making him worse. Go gently, or just wait with him.`,
  },
  {
    need: { notReveal: "why_up", flag: "asked_bridge", trustBelow: 2 },
    subtle: [
      `He isn't a man to be hurried. The heater ticks. He seems to be waiting to see if you'll wait.`,
      `He watches you the way you'd watch weather: to see what kind it is.`,
    ],
    clearer: `Questions aren't getting far. Patience might.`,
  },
  {
    need: { notReveal: "why_up" },
    subtle: [
      `He glances up at the raised bridge, the way you'd check a clock.`,
      `The two halves of the bridge stand up against the sky. He keeps looking at them.`,
    ],
    clearer: `He might tell you why the bridge is up. He might need asking more than once.`,
  },
  {
    need: { notReveal: "wes", notFlag: "saw_photo" },
    subtle: [
      `His eyes go to the photograph taped to the glass, then away.`,
      `The photograph on the window has been handled a lot. The tape's been replaced more than once.`,
    ],
    clearer: `There's a photograph taped inside the booth window.`,
  },
  {
    need: { notReveal: "wes" },
    subtle: [
      `He looks up the far road again. Whoever he's watching for, they're late.`,
      `Every set of headlights on the far bank, he leans forward a little.`,
    ],
    clearer: `He's waiting for someone. You could ask who.`,
  },
  {
    need: { notReveal: "last_words", trustBelow: 4 },
    subtle: [
      `He says the name carefully when he says it, like it could break.`,
      `Something in him opens a little whenever you stop asking and just stay.`,
    ],
    clearer: `He'll need to trust you before he tells the rest. Stay a while. Share something of your own.`,
  },
  {
    need: { notReveal: "last_words" },
    subtle: [
      `His hand rests on the logbook, over the page with the circle on it.`,
      `He keeps starting a sentence about that night, and stopping.`,
    ],
    clearer: `Something happened the night Wes left. You could ask him about it.`,
  },
  {
    need: { trustBelow: 5 },
    subtle: [
      `He's gone quiet. He still hasn't said the thing he stopped on.`,
      `He looks at you like he's deciding something.`,
    ],
    clearer: `He isn't done. Stay with him a little longer.`,
  },
  {
    need: {},
    subtle: [
      `His lips move a little, like he's practising what he'd say to someone.`,
      `He looks at the far bank as if someone were standing on it.`,
    ],
    clearer: `He never got to say it to Wes. You could ask him what he'd say.`,
  },
];

/* Every few turns, if nothing else happened: the world around you.
   Each line is used ONCE at most; when they run out, the atmosphere goes
   quiet rather than repeating. None of these mention the light changing:
   that happens exactly once, in `nightfall`. */
export const ambience = {
  // any time
  any: [
    `Downstream, a heron lifts off, complaining.`,
    `The rain picks up. It drums on the roof of the booth.`,
    `Water runs off the raised deck in two thin falls.`,
    `A gust shakes the booth's little window in its frame.`,
    `The creek is loud under the raised bridge.`,
    `Somewhere up the road, a dog barks twice and gives up.`,
    `A drip from the booth's gutter keeps landing on the same stone.`,
    `The space heater clicks off, then on again.`,
  ],
  // only once it's dark
  afterDark: [
    `The booth is the only light for miles.`,
    `On the far side, something might be headlights. Then it isn't.`,
    `Your breath shows now, when you talk.`,
  ],
};

/* The one moment the evening turns to night. Fires once, midway. */
export const nightfall = {
  afterTurn: 9,
  text: `At some point in the last few minutes, while neither of you was watching, the dusk gave out. It's night now. The booth window is the brightest thing in the valley.`,
};

/* When the player hasn't typed anything for a while. */
export const idle = {
  booth: [
    `Del turns a page in the logbook. Turns it back.`,
    `“Still there?” he says, not looking up.`,
    `The heater ticks.`,
    `He glances at the far bank, then at you, then at the far bank.`,
  ],
  car: [
    `The wipers keep time.`,
    `In the booth, the old man hasn't moved.`,
    `Rain thickens on the windshield until the booth light is a smear.`,
  ],
};

/* Typed "help" or "hint". The first one whose need passes. */
export const hints = [
  { need: { place: "car" }, text: `He's in the booth. You could get out and talk to him. Just type what you'd do or say.` },
  { need: { mood: ["uneasy", "closing"] }, text: `He's rattled. Go gently. Patience helps here, not pressure.` },
  { need: { reveal: "last_words", trust: 5 }, text: `He never finished what he meant to say to Wes. Maybe ask him what it was.` },
  { need: { reveal: "last_words" }, text: `He's close. Stay with him a little longer: listen, share something, don't hurry him.` },
  { need: { reveal: "wes" }, text: `Wes left across this bridge. What happened between them? He may need more trust first.` },
  { need: { reveal: "why_up" }, text: `He's waiting for someone. Who?` },
  { text: `Ask him about the bridge. Or look around: the booth has things in it. Patience goes further than pushing.` },
];

/* ------------------------------------------------------------------------
 * ENDINGS
 * --------------------------------------------------------------------- */

export const endings = {
  lowered: {
    title: "The bridge comes down",
    text: `The two leaves come down through the rain and meet with a sound like a door closing somewhere far off. Del lifts one hand as you pass. Not quite a wave. Just a hand.

On the far side, the road climbs into dark trees. At the top of the rise, pulled onto the shoulder, is a car you couldn't see from the bridge: lights on, engine running, facing west.

You pass it. You don't slow down. In the mirror you watch its headlights for as long as you can, but the road bends, and you never see whether it moves.`,
  },
  turned: {
    title: "You turn around",
    text: `You turn the car in the narrow road. Three points, four. Your headlights swing across the booth, and for a moment Del is lit up white: standing now, one hand on the glass, watching you go like he's memorising it.

Then he's behind you. One lit window, and a bridge held up against the dark.

Forty minutes back to the closure. You never find out whether he wrote you down.`,
  },
  shut: {
    title: "The window closes",
    text: `He slides the pane shut. Then, slowly, he pulls a blind down over it, and the lit window becomes a lit square of canvas with a shadow behind it.

You wait. It stays that way. The bridge stays up. The creek runs on under it, loud with rain.

Somewhere behind the blind, a pencil moves across a page. One car, westbound. Didn't cross.`,
  },
};
