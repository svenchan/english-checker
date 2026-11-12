import test from "node:test";
import assert from "node:assert/strict";
import { findFirstPersonMistakes, findServerMistakes } from "../../src/lib/surfaceRules.js";
import { applyFeedbackPolicy } from "../../src/lib/applyFeedbackPolicy.js";

test("findFirstPersonMistakes flags i and its contractions", () => {
  const text = "i think i'm ready and i'll go if i've time or i'd rather stay";
  const mistakes = findFirstPersonMistakes(text);
  assert.deepEqual(
    mistakes.map((mistake) => [mistake.original, mistake.corrected]),
    [
      ["i", "I"],
      ["i'm", "I'm"],
      ["i'll", "I'll"],
      ["i've", "I've"],
      ["i'd", "I'd"]
    ]
  );
  assert.equal(mistakes[0].code, "first_person_i");
  assert.equal(mistakes[0].type, "spelling");
  assert.equal(mistakes[1].explanation, "私を表す\"I\"は大文字で書く。i'm → I'm");
});

test("findFirstPersonMistakes accepts a curly apostrophe and a mixed-case tail", () => {
  const mistakes = findFirstPersonMistakes("i’m here and i'LL go");
  assert.deepEqual(
    mistakes.map((mistake) => mistake.corrected),
    ["I'm", "I'll"]
  );
  assert.equal(mistakes[0].explanation, "私を表す\"I\"は大文字で書く。i’m → I'm");
});

test("findFirstPersonMistakes ignores correct I and lookalike words", () => {
  const mistakes = findFirstPersonMistakes("I think it is inside and isn't i.e. fine. I'll go.");
  assert.deepEqual(mistakes, []);
});

test("applyFeedbackPolicy explains a lone i'll from the server", () => {
  const text = "My friend and i'll go.";
  const feedback = applyFeedbackPolicy(text, { mistakes: [], overallScore: 100 });
  assert.equal(feedback.mistakes.length, 1);
  assert.equal(feedback.mistakes[0].original, "i'll");
  assert.equal(feedback.mistakes[0].corrected, "I'll");
  assert.equal(feedback.mistakes[0].explanation, "私を表す\"I\"は大文字で書く。i'll → I'll");
  assert.equal(feedback.overallScore, 95);
  assert.equal(text.slice(feedback.mistakes[0].start, feedback.mistakes[0].end), "i'll");
});

test("applyFeedbackPolicy drops a model mistake that only fixes first person", () => {
  const feedback = applyFeedbackPolicy("My friend and i'll go.", {
    mistakes: [
      {
        original: "i'll",
        corrected: "I'll",
        explanation: "モデルの説明",
        type: "spelling"
      }
    ]
  });
  assert.equal(feedback.mistakes.length, 1);
  assert.equal(feedback.mistakes[0].explanation, "私を表す\"I\"は大文字で書く。i'll → I'll");
  assert.equal(feedback.overallScore, 95);
});

test("findServerMistakes capitalizes real sentence starts and skips titles", () => {
  const text = "my friend is kind. she is nice. I met Mr. tanaka.";
  const mistakes = findServerMistakes(text);
  assert.deepEqual(
    mistakes.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [
      ["my", "My", "sentence_start_cap"],
      ["she", "She", "sentence_start_cap"]
    ]
  );
  assert.equal(mistakes[1].type, "capitalization");
  assert.equal(mistakes[1].explanation, "文のはじめは大文字にする。she → She");
  const titled = findServerMistakes("I met Mr. tanaka yesterday");
  assert.deepEqual(titled.map((mistake) => [mistake.original, mistake.code]), [
    ["yesterday", "missing_end_punct"]
  ]);
  assert.equal(findServerMistakes("I like the U.S. army and i.e. this.").length, 0);
  assert.equal(findServerMistakes("3. she has a cat.").length, 0);
});

test("findServerMistakes keeps a leading i as spelling only", () => {
  const mistakes = findServerMistakes("i like cats. she is kind.");
  assert.deepEqual(
    mistakes.map((mistake) => [mistake.original, mistake.code]),
    [
      ["i", "first_person_i"],
      ["she", "sentence_start_cap"]
    ]
  );
});

test("applyFeedbackPolicy explains sentence starts from the server", () => {
  const feedback = applyFeedbackPolicy("my friend is kind. she is nice. I met Mr. tanaka.", {
    mistakes: []
  });
  assert.deepEqual(
    feedback.mistakes.map((mistake) => mistake.explanation),
    [
      "文のはじめは大文字にする。my → My",
      "文のはじめは大文字にする。she → She"
    ]
  );
  assert.equal(feedback.overallScore, 90);
});

test("applyFeedbackPolicy drops a model mistake that only capitalizes a sentence start", () => {
  const feedback = applyFeedbackPolicy("I like cats. she is kind.", {
    mistakes: [
      {
        original: "she",
        corrected: "She",
        explanation: "モデルの説明",
        type: "spelling"
      }
    ]
  });
  assert.equal(feedback.mistakes.length, 1);
  assert.equal(feedback.mistakes[0].explanation, "文のはじめは大文字にする。she → She");
  assert.equal(feedback.overallScore, 95);
});

test("applyFeedbackPolicy keeps a wider rewrite that also capitalizes", () => {
  const feedback = applyFeedbackPolicy("my friend is kind", {
    mistakes: [
      {
        original: "my friend is kind",
        corrected: "My friends are kind",
        explanation: "友達は複数だよ。",
        type: "grammar"
      }
    ]
  });
  assert.deepEqual(
    feedback.mistakes.map((mistake) => mistake.explanation),
    [
      "友達は複数だよ。",
      "文の最後には . か ? か ! をつける。kind → kind."
    ]
  );
  assert.equal(feedback.mistakes.some((mistake) => mistake.code === "sentence_start_cap"), false);
  assert.equal(feedback.overallScore, 85);
});

test("findServerMistakes flags only a missing final stop", () => {
  const missing = findServerMistakes("My friend is kind");
  assert.deepEqual(
    missing.map((mistake) => [mistake.original, mistake.corrected, mistake.code, mistake.type]),
    [["kind", "kind.", "missing_end_punct", "punctuation"]]
  );
  assert.equal(missing[0].explanation, "文の最後には . か ? か ! をつける。kind → kind.");
  assert.equal(findServerMistakes("I met Mr. Tanaka.").length, 0);
  assert.equal(findServerMistakes("She is kind.").length, 0);
  assert.equal(findServerMistakes("Is she kind?").length, 0);
  assert.equal(findServerMistakes('She said "hello."').length, 0);
  assert.equal(findServerMistakes("I like cats she is kind").filter((mistake) => mistake.code === "missing_end_punct").length, 1);
});

test("applyFeedbackPolicy explains a missing final stop from the server", () => {
  const feedback = applyFeedbackPolicy("My friend is kind", {
    mistakes: [
      {
        original: "kind",
        corrected: "kind.",
        explanation: "モデルの説明",
        type: "spelling"
      }
    ]
  });
  assert.equal(feedback.mistakes.length, 1);
  assert.equal(feedback.mistakes[0].explanation, "文の最後には . か ? か ! をつける。kind → kind.");
  assert.equal(feedback.overallScore, 95);
});

test("applyFeedbackPolicy replaces a model spelling explanation and keeps grammar", () => {
  const feedback = applyFeedbackPolicy("I like my freind. She like cats.", {
    mistakes: [
      {
        original: "freind",
        corrected: "friend",
        explanation: "つづりをよく見てね。",
        type: "spelling"
      },
      {
        original: "like",
        corrected: "likes",
        explanation: "She は1人だから、動詞 like には s をつけて likes にするよ。",
        type: "grammar"
      }
    ]
  });
  const spelling = feedback.mistakes.find((mistake) => mistake.original === "freind");
  const grammar = feedback.mistakes.find((mistake) => mistake.original === "like");
  assert.equal(spelling.explanation, "つづりが間違っている。freind → friend");
  assert.equal(spelling.code, "spelling");
  assert.equal(spelling.type, "spelling");
  assert.equal(spelling.corrected, "friend");
  assert.equal(grammar.explanation, "She は1人だから、動詞 like には s をつけて likes にするよ。");
  assert.equal(grammar.code, undefined);
  assert.equal(feedback.overallScore, 85);
});

test("applyFeedbackPolicy keeps a spelling fix and a missing final stop on the same word", () => {
  const feedback = applyFeedbackPolicy("I like my freind", {
    mistakes: [
      {
        original: "freind",
        corrected: "friend",
        explanation: "つづりをよく見てね。",
        type: "spelling"
      }
    ]
  });
  assert.deepEqual(
    feedback.mistakes.map((mistake) => mistake.explanation),
    [
      "文の最後には . か ? か ! をつける。freind → freind.",
      "つづりが間違っている。freind → friend"
    ]
  );
  assert.equal(feedback.overallScore, 90);
});

test("findServerMistakes flags a space before a comma, period, question mark, or exclamation", () => {
  const comma = findServerMistakes("I like cats , dogs.");
  assert.deepEqual(
    comma.map((mistake) => [mistake.original, mistake.corrected, mistake.code, mistake.type]),
    [["cats ,", "cats,", "space_before_comma", "punctuation"]]
  );
  assert.equal(comma[0].explanation, "コンマの前に空白はいらない。cats , → cats,");

  const period = findServerMistakes("I like cats .");
  assert.deepEqual(
    period.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [["cats .", "cats.", "space_before_period"]]
  );
  assert.equal(period[0].explanation, "ピリオドの前に空白はいらない。cats . → cats.");

  const terminal = findServerMistakes("Is she kind ? Wow !");
  assert.deepEqual(
    terminal.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [
      ["kind ?", "kind?", "space_before_terminal"],
      ["Wow !", "Wow!", "space_before_terminal"]
    ]
  );
  assert.equal(terminal[0].explanation, "? や ! の前に空白はいらない。kind ? → kind?");
});

test("findServerMistakes flags a missing space after a comma or sentence mark", () => {
  const comma = findServerMistakes("I like cats,dogs.");
  assert.deepEqual(
    comma.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [["cats,dogs", "cats, dogs", "space_after_comma"]]
  );
  assert.equal(comma[0].explanation, "コンマの後には空白を入れる。cats,dogs → cats, dogs");

  const period = findServerMistakes("I like cats.She is kind.");
  assert.deepEqual(
    period.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [["cats.She", "cats. She", "space_after_terminal"]]
  );
  assert.equal(period[0].explanation, ". や ? や ! の後には空白を入れる。cats.She → cats. She");

  const bang = findServerMistakes("Wow!Yes.");
  assert.deepEqual(
    bang.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [["Wow!Yes", "Wow! Yes", "space_after_terminal"]]
  );
});

test("findServerMistakes combines a space before a mark with a missing space after it", () => {
  const comma = findServerMistakes("I like cats ,dogs.");
  assert.deepEqual(
    comma.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [["cats ,dogs", "cats, dogs", "comma_space_both"]]
  );
  assert.equal(
    comma[0].explanation,
    "コンマの前の空白を消して、後に空白を入れる。cats ,dogs → cats, dogs"
  );

  const period = findServerMistakes("I like cats .She is kind.");
  assert.deepEqual(
    period.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [["cats .She", "cats. She", "period_space_both"]]
  );
  assert.equal(
    period[0].explanation,
    "ピリオドの前の空白を消して、後に空白を入れる。cats .She → cats. She"
  );

  const terminal = findServerMistakes("Really ?Yes.");
  assert.deepEqual(
    terminal.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [["Really ?Yes", "Really? Yes", "terminal_space_both"]]
  );
  assert.equal(
    terminal[0].explanation,
    "? や ! の前の空白を消して、後に空白を入れる。Really ?Yes → Really? Yes"
  );
});

test("findServerMistakes leaves numbers, initials, and correct spacing alone", () => {
  assert.deepEqual(findServerMistakes("I have 1,000 cats."), []);
  assert.deepEqual(findServerMistakes("Pi is 3.14 exactly."), []);
  assert.deepEqual(findServerMistakes("I like cats, dogs."), []);
  assert.deepEqual(findServerMistakes("I live in the U.S.A. today."), []);
  assert.deepEqual(
    findServerMistakes("I met Mr.Tanaka today.").map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [["Mr.Tanaka", "Mr. Tanaka", "space_after_terminal"]]
  );
  assert.deepEqual(
    findServerMistakes("See the U.S.army today.").map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [["U.S.army", "U.S. army", "space_after_terminal"]]
  );
  assert.deepEqual(
    findServerMistakes("See e.g.this now.").map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [["e.g.this", "e.g. this", "space_after_terminal"]]
  );
});

test("findServerMistakes collapses a run of spaced dots into one mistake", () => {
  const mistakes = findServerMistakes("I waited . . . Today.");
  assert.deepEqual(
    mistakes.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [["waited . . .", "waited...", "space_before_period"]]
  );
  assert.equal(mistakes[0].explanation, "ピリオドの前に空白はいらない。waited . . . → waited...");
});

test("findServerMistakes capitalizes a word glued to the previous sentence", () => {
  const mistakes = findServerMistakes("I like cats.she is kind.");
  assert.deepEqual(
    mistakes.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [
      ["cats.she", "cats. she", "space_after_terminal"],
      ["she", "She", "sentence_start_cap"]
    ]
  );
  assert.equal(mistakes[1].explanation, "文のはじめは大文字にする。she → She");

  const both = findServerMistakes("I like cats .she is kind.");
  assert.deepEqual(
    both.map((mistake) => [mistake.original, mistake.corrected, mistake.code]),
    [
      ["cats .she", "cats. she", "period_space_both"],
      ["she", "She", "sentence_start_cap"]
    ]
  );
});

test("applyFeedbackPolicy keeps the server spacing message for an exact model copy", () => {
  const feedback = applyFeedbackPolicy("I like cats , dogs.", {
    mistakes: [
      {
        original: "cats ,",
        corrected: "cats,",
        explanation: "モデルの説明",
        type: "spelling"
      }
    ]
  });
  assert.equal(feedback.mistakes.length, 1);
  assert.equal(feedback.mistakes[0].code, "space_before_comma");
  assert.equal(feedback.mistakes[0].explanation, "コンマの前に空白はいらない。cats , → cats,");
  assert.equal(feedback.overallScore, 95);
});

test("applyFeedbackPolicy drops a spacing hit covered by a wider model rewrite", () => {
  const feedback = applyFeedbackPolicy("I like cats , dogs.", {
    mistakes: [
      {
        original: "cats , dogs",
        corrected: "cats and dogs",
        explanation: "and を使うよ。",
        type: "grammar"
      }
    ]
  });
  assert.deepEqual(
    feedback.mistakes.map((mistake) => mistake.explanation),
    ["and を使うよ。"]
  );
  assert.equal(feedback.overallScore, 90);
});

test("applyFeedbackPolicy keeps a wider model rewrite and skips the server hit", () => {
  const feedback = applyFeedbackPolicy("i like cat", {
    mistakes: [
      {
        original: "i like cat",
        corrected: "I like cats",
        explanation: "猫は複数だよ。",
        type: "grammar"
      }
    ]
  });
  assert.deepEqual(
    feedback.mistakes.map((mistake) => mistake.explanation),
    [
      "猫は複数だよ。",
      "文の最後には . か ? か ! をつける。cat → cat."
    ]
  );
  assert.equal(feedback.mistakes.some((mistake) => mistake.code === "first_person_i"), false);
  assert.equal(feedback.overallScore, 85);
});
