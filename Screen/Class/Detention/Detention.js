"use strict";
var DetentionCharacterList = [ 
	{ Name: "Sidney", Count: 3 },
	{ Name: "Sarah", Count: 3 },
	{ Name: "Sam", Count: 1 }
];
var DetentionCharacters = [];

/**
 * Picks the next student that enters the detention room
 * @returns {void} - Nothing
 */
function DetentionPickNextStudent() {

	// Only pick a new student once
	if (CommonCutscene > 4) return;

	// Builds a list of all possible characters
	let CharList = [];
	for (let C of DetentionCharacterList)
		if (LogValue(C.Name, "ClassCount") < C.Count)
			CharList.push(C.Name);

	// Picks a character and starts the class
	if (CharList.length > 0) {
		let Char = CommonRandomItemFromList(null, CharList);
		let ClassCount = LogValue(Char, "ClassCount") + 1;
		LogAdd(Char, "ClassCount", ClassCount);
		CharacterAdd(Char, Char);
		DetentionCharacters = [Char];
		DialogLoad(Char + ClassCount.toString());
	} else CommonCutscene = 3;

}

/**
 * Loads the Detention Class screen
 * @returns {void} - Nothing
 */
function DetentionLoad() {
	InventoryAdd("Handcuffs"); // Compatibility, make sure we have handcuffs at that stage
	if ((CommonWeek == 5) && !LogQuery("College", "BasementKey")) return CommonSetScreen("Class", "BossOffice"); // Compatibility, week 5, make sure we meet Evelyn before student
	CommonBackground = "TeacherClassStandingAlone";
	DetentionEndBackground = "TeacherClassStandingAlone";
	CommonSceneTime = 0;
}

/**
 * Runs & draws the Detention Class screen
 * @returns {void} - Nothing
 */
function DetentionRun() {
	DrawRect(0, 0, 2000, 1000, "#000000A0");
	if (CommonCutscene <= 3)
		for (let L = 0; L <= CommonCutscene; L++)
			DrawText(TextGet("Week" + CommonWeek.toString() + "Intro" + L.toString()), 1000, 300 + L * 100, "White", "Black");
}

/**
 * Handles click events in the Detention Class screen
 * @returns {void} - Nothing
 */
function DetentionClick() {
	CommonCutscene++;
	if (CommonCutscene >= 4) DetentionPickNextStudent();
}

/**
 * When the player waits idly in detention
 * @param {string} Value - The value to evaluate
 * @param {string} NewBackground - The new background to setup
 * @returns {void} - Nothing
 */
function DetentionWait(Value, NewBackground) {
	if ((NewBackground != null) && (NewBackground != "")) DetentionEndBackground = NewBackground;
	Value = CommonIsNumeric(Value) ? parseInt(Value) : 1;
	CommonSceneTime = CommonSceneTime + Value;
	if (CommonSceneTime >= 4) CommonSetScreen("Class", "DetentionEnd");
}

/**
 * When the teacher plays on her phone instead of watching detention, it lower the current students grades
 * @returns {void} - Nothing
 */
function DetentionPlayPhone() {
	for (let C of DetentionCharacters)
		DialogChangeGrades(-1, CharacterGet(C));
	DetentionWait();
}
