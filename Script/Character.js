"use strict";
var Character = [];
var CharacterDefaultGradesList = [
	{ Name: "Sidney", Grades: 42 },
	{ Name: "Sarah", Grades: 49 },
	{ Name: "Amanda", Grades: 84 },
	{ Name: "Sam", Grades: 71 }
];

/**
 * Creates a character and adds it to the array
 * @param {string} ResourceName - The character resource name
 * @param {string} DisplayName - The character displayed name
 * @returns {void} - Nothing
 */
function CharacterAdd(ResourceName, DisplayName) {

	// Do not add if it's already loaded
	for (let C of Character)
		if (C.Name == ResourceName)
			return;

	// Some characters have default values
	let Love = 0;
	let Domination = 0;
	if (ResourceName == "Mia") Love = 10;
	if (ResourceName == "Sidney") Love = -10;
	if (ResourceName == "Sarah") Domination = 10;
	if (ResourceName == "Evelyn") Domination = -10;
	if (ResourceName == "Charlotte") Love = 5;
	if (ResourceName == "Sam") Love = -5;

	// Creates the object to be added
	let C = {
		Name: ResourceName,
		DisplayName: DisplayName,
		Love: Love,
		Domination: Domination
	};
	CharacterDefaultGrades(C);
	Character.push(C);

}

/**
 * Finds a character by name and returns it's object
 * @param {string} Name - The name of the character
 * @returns {Character} - The character object found
 */
function CharacterGet(Name) {
	for (let C of Character)
		if (C.Name == Name)
			return C;
	return null;
}

/**
 * Returns the position of a specific character in the array
 * @param {Character} Char - The character object
 * @returns {number} - The position
 */
function CharacterGetPosition(Char) {
	if ((Char == null) || (Character.length <= 1)) return 0;
	for (let C = 0; C < Character.length; C++)
		if (Character[C].Name == Char.Name)
			return C;
	return 0;
}

/**
 * Alters the me love/domination meter of a character
 * @param {Character} Char - The character object
 * @param {number} Love - The love factor modification
 * @param {number} Domination - The domination factor modification
 * @returns {void} - Nothing
 */
function CharacterAlterMeter(Char, Love, Domination) {
	if (Char == null) return;
	if (!CommonIsNumeric(Char.Love)) Char.Love = 0;
	if (!CommonIsNumeric(Char.Domination)) Char.Domination = 0;
	if (CommonIsNumeric(Love)) Char.Love = Char.Love + parseInt(Love);
	if (CommonIsNumeric(Domination)) Char.Domination = Char.Domination + parseInt(Domination);
}

/**
 * Draws the love/domination meters on screen
 * @param {Character} Char - The character object
 * @param {number} X - The X position
 * @param {number} Y - The Y position
 * @param {string} TextColor - The color of the text
 * @returns {void} - Nothing
 */
function CharacterDrawMeter(Char, X, Y, TextColor) {
	if ((Char == null) || (Char.Name == "Teacher")) return;
	DrawImageResize("Image/Meter/" + ((Char.Love >= 0) ? "Love" : "Hate") + ".png", X, Y, 60, 60);
	DrawTextWrap(Math.abs(Char.Love).toString(), X + 70, Y + 3, 60, 60, TextColor);
	DrawImageResize("Image/Meter/" + ((Char.Domination >= 0) ? "Domination" : "Submission") + ".png", X + 210, Y, 60, 60);
	DrawTextWrap(Math.abs(Char.Domination).toString(), X + 280, Y + 3, 60, 60, TextColor);
}

/**
 * Returns the default grades for a given character
 * @param {string} Name - The name of that character
 * @returns {number} - The default grades or 0 if the character isn't in the list
 */
function CharacterGetDefaultGrades(Name) {
	for (let C of CharacterDefaultGradesList)
		if (Name == C.Name)
			return C.Grades;
	return null;
}

/**
 * Draws the love/domination meters on screen
 * @param {Character} Char - The character object
 * @param {number} X - The X position
 * @param {number} Y - The Y position
 * @param {string} TextColor - The color of the text
 * @returns {void} - Nothing
 */
function CharacterDefaultGrades(Char) {
	if (Char == null) return;
	if (CommonIsNumeric(Char.Grades)) return;
	Char.Grades = CharacterGetDefaultGrades(Char.Name);
}

/**
 * Returns TRUE if the character should be blinking, based on current time
 * @returns {boolean} - TRUE if the character is currently blinking
 */
function CharacterBlink() {
	return ((Math.round(TimerGetTime() / 400) % 17) == 0) || ((Math.round(TimerGetTime() / 250) % 13) == 0);
}