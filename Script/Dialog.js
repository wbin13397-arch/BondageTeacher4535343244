"use strict";
var DialogCurrent = null;
var DialogCurrentName = null;
var DialogStage = null;
var DialogText = null;
var DialogOption = [];
var DialogOptionFocus = null;
var DialogSecret = [];
var DialogInventory = [];
var DialogCharacter = null;
var DialogCharacterPortrait = "";
var DialogBackground = null;
var DialogBackgroundFilter = "";
var DialogPath = [];
var DialogVariable = new Map();

/**
 * Returns TRUE if the game is currently in an active dialog
 * @returns {boolean} - TRUE if there's an active dialog
 */
function DialogIsActive() {
	return (DialogCurrent != null);
}

/**
 * Builds the DialogCurrent object with all properties to run the character dialog
 * @param {string} FullPath - The full CSV path to query
 * @returns {void} - Nothing
 */
function DialogBuild(FullPath) {

	// Loops in the full dialog CSV file
	DialogCurrent = [];
	for (let D of CommonCSVCache[FullPath]) {

		// Creates the dialog line based on the number of columns in the CSV
		let Line = {};
		if (D.length > 0) Line.Source = D[0];
		if (D.length > 1) Line.Destination = D[1];
		if (D.length > 2) Line.Option = D[2];
		if (D.length > 3) Line.Text = D[3];
		if (D.length > 4) Line.Condition = D[4];
		if (D.length > 5) Line.Script = D[5];
		if (D.length > 6) Line.Love = D[6];
		if (D.length > 7) Line.Domination = D[7];
		if (D.length > 8) Line.Character = D[8];
		if (D.length > 9) Line.Background = D[9];
		if (D.length > 10) Line.Icon = D[10];

		// Adds the dialog line
		DialogCurrent.push(Line);

	}

	// Translate the dialog if needed and perform substitutions
	TranslationDialogPrepare();

}

/**
 * Loads a CSV dialog in memory
 * @param {string} DialogName - The dialog file name to load
 * @returns {void} - Nothing
 */
function DialogLoad(DialogName) {

	// Gets the CSV path
	DialogCurrentName = DialogName;
	DialogCurrent = null;
	DialogStage = null;
	DialogText = null;
	DialogOption = [];
	DialogSecret = [];
	DialogInventory = [];
	DialogCharacter = CharacterGet("Teacher");
	DialogBackground = null;
	DialogBackgroundFilter = "";
	DialogPath = [];
	const FullPath = "Screen/" + CommonModule + "/" + CommonScreen + "/Dialog_" + DialogName + ".csv";

	// If it's already in Cache, we load it from there
	if (CommonCSVCache[FullPath]) {
		DialogBuild(FullPath);
		return;
	}

	// If not in cache, we load the CSV from the folder
	CommonGet(FullPath, function () {
		if (this.status == 200) {
			CommonCSVCache[FullPath] = CommonParseCSV(this.responseText);
			DialogBuild(FullPath);
		}
	});

}

/**
 * Returns TRUE if the stage doesn't have any intro text
 * @param {string} Stage - The dialog file name to load
 * @returns {void} - Nothing
 */
function DialogEmptyStageIntro(Stage) {
	if ((DialogCurrent == null) || (Stage == null) || (Stage == "")) return false;
	for (let D of DialogCurrent)
		if ((D.Source == Stage) && (D.Option == ""))
			return false;
	return true;
}

/**
 * Assigns the active dialog character and status
 * @param {string} Name - The name of the character, can contain a "-" to assign a status
 * @returns {void} - Nothing
 */
function DialogSetCharacter(Name) {
	if (Name == null) return DialogCharacter = null;
	if (Name.indexOf("-") > 0) {
		DialogCharacter = CharacterGet(Name.split("-")[0]);
		DialogCharacterPortrait = Name.split("-")[1];
	} else {
		DialogCharacter = CharacterGet(Name);
		DialogCharacterPortrait = "";
	}
}

/**
 * Draws the possible backgrounds out of screen to put them in cache, to speed up the user experience
 * @param {string} Stage - The current dialog stage to analyze
 * @param {number} Level - The level of recursivness, it stops at zero
 * @returns {void} - Nothing
 */
function DialogPreCacheRecursive(Stage, Level) {
	if ((Level <= 0) || (Stage == null) || (Stage == "")) return;
	for (let D of DialogCurrent)
		if (D.Source == Stage)
			if ((D.Condition == null) || (D.Condition == "") || CommonDynamicFunctionParams(D.Condition)) {
				if ((D.Background != null) && (D.Background != "") && (D.Background != "MiniGameBackgroundFreeBondage") && (D.Option !== "SecretDialog")) {
					let FileName = `Screen/${CommonModule}/${CommonScreen}/Background/${D.Background}.jpg`;
					let Obj = DrawCacheImage.get(FileName);
					if ((Obj == null) || (Obj.width == null) || (Obj.width <= 0))
						DrawImageResize(FileName, 2000, 1000, 1, 1);
				}
				DialogPreCacheRecursive(D.Destination, Level - 1);
			}
}

/**
 * Loads a specific dialog stage in memory
 * @param {string} DialogName - The dialog file name to load
 * @returns {void} - Nothing
 */
function DialogLoadStage(StageName) {

	// For each dialog options
	DialogStage = StageName;
	DialogOption = [];
	DialogSecret = [];
	DialogInventory = [];
	for (let D of DialogCurrent)
		if (D.Source == DialogStage)
			if ((D.Condition == null) || (D.Condition == "") || CommonDynamicFunctionParams(D.Condition)) {

				// Assigns the base text & background
				if (D.Option == "") DialogText = D.Text;
				if ((D.Character != "") && (D.Option == "")) DialogSetCharacter(D.Character);
				if ((D.Background != "") && (D.Option == "")) DialogBackground = D.Background;

				// Adds a secret/hidden dialog option or a regular one
				if (D.Option == "SecretDialog") {
					DialogSecret.push({
						Destination: D.Destination,
						Text: D.Text,
						Script: D.Script,
						Left: CommonIsNumeric(D.Love) ? parseInt(D.Love) : 0,
						Top: CommonIsNumeric(D.Domination) ? parseInt(D.Domination) : 0,
						Width: CommonIsNumeric(D.Character) ? parseInt(D.Character) : 0,
						Height: CommonIsNumeric(D.Background) ? parseInt(D.Background) : 0
					});
				} else if (D.Option.startsWith("InventoryDialog")) {
					let ItemName = D.Option.substr(15);
					if (InventoryAvailable(ItemName)) {
						let Obj = CommonCloneDeep(D);
						Obj.Option = ItemName;
						DialogInventory.push(Obj);
					}
				} else DialogOption.push(D);

			}

	// Keeps the full path in memory
	if ((DialogText != null) && (DialogText != "") && (DialogCharacter != null))
		DialogPath.push( { Stage: StageName, Background: DialogBackground, Character: DialogCharacter.Name, Portrait: DialogCharacterPortrait } );

	// Goes into the possible dialog options at 4 levels deep and tries to precache the backgrounds
	DialogPreCacheRecursive(DialogStage, 4);

}

/**
 * Runs the current dialog
 * @returns {void} - Nothing
 */
function DialogDraw() {

	// Exits right away if not loaded yet
	if (!DialogIsActive()) return;

	// If the dialog is paused by a mini-game
	if (MiniGameCurrent != "") return CommonDynamicFunction("MiniGame" + MiniGameCurrent + "Draw()");

	// If no stage is loaded, we start at "Entry"
	if (DialogStage == null) DialogLoadStage("Entry");

	// Draws the background image
	if (DialogBackground == "MiniGameBackgroundFreeBondage")
		MiniGameFreeBondageDrawBackground();
	else
		DrawImageResize(`Screen/${CommonModule}/${CommonScreen}/Background/${DialogBackground}.jpg`, 0, 0, 2000, 1000);

	// Draws a custom filter over the background image if needed
	if ((DialogBackgroundFilter != null) && (DialogBackgroundFilter != ""))
		DrawRect(0, 0, 2000, 1000, DialogBackgroundFilter);

	// Draws the current text box
	if ((DialogText != null) && (DialogText != "")) {
		DrawRect(0, 800, 2000, 200, "#000000A0");
		DrawEmptyRect(0, 800, 2000, 200, "#FFFFFF", 1);
		if (DialogCharacter == null) {
			DrawTextWrap(DialogText, 10, 810, 1980, 195, "White");
		} else {
			if (!CommonIsMobile && MouseIn(1, 801, 198, 198)) DrawRect(1, 801, 198, 198, "#FFAACC");
			DrawPortrait(DialogCharacter.Name + DialogCharacterPortrait, 1, 801, 198, 198);			
			DrawEmptyRect(200, 800, 0, 200, "#B0B0B0", 1);
			DrawEmptyRect(750, 870, 700, 1, "#FFFFFF", 1);
			if (DialogCharacter.Name == "Teacher") {
				DrawTextWrap(DialogCharacter.DisplayName, 210, 808, 1780, 60, "White");
			} else {
				DrawTextWrap(DialogCharacter.DisplayName, 210, 808, 1380, 60, "White");
				CharacterDrawMeter(DialogCharacter, 1060, 805, "White");
			}
			DrawTextWrap(DialogText, 210, 870, 1780, 130, "White");
		}
	}

	// Count the number of options available to give
	let OptionCount = 0;
	for (let O of DialogOption)
		if (O.Option != "")
			OptionCount++;

	// Draws the possible options (answers that the player can give)
	DialogOptionFocus = null;
	if (OptionCount > 0) {
		DrawMainCanvas.font = CommonGetFont(28);
		let Y = 400 - (OptionCount * 50);
		for (let O of DialogOption)
			if (O.Option != "") {
				let ForeColor = "#FFFFFF";
				let BackColor = "#000000A0";
				if (MouseIn(1601, Y + 1, 393, 91)) {
					DialogOptionFocus = O;
					if (!CommonIsMobile) {
						ForeColor = "#000000";
						BackColor = "#FFAACC";
					}
				}
				DrawEmptyRect(1600, Y, 395, 93, "#FFFFFF", 1);
				DrawRect(1601, Y + 1, 393, 91, BackColor);
				if ((O.Icon == null) || (O.Icon == "")) {
					DrawTextWrap(O.Option, 1615, Y, 374, 93, ForeColor, null, 2, 19);
				} else {
					DrawImageResize("Image/Icon/" + O.Icon + ".png", 1606, Y + 11, 70, 70);
					DrawTextWrap(O.Option, 1686, Y, 298, 93, ForeColor, null, 2, 19);
				}
				Y = Y + 100;
			}
		DrawMainCanvas.font = CommonGetFont(36);
	}

	// Count the number of inventory options available to give
	let InventoryCount = 0;
	for (let I of DialogInventory)
		if (I.Option != "")
			InventoryCount++;

	// Draws the possible inventory options on the left if there's no dialog choice
	if (InventoryCount > 0) {
		let Y = 400 - (InventoryCount * 100);
		for (let I of DialogInventory)
			if (I.Option != "") {
				let ForeColor = "#FFFFFF";
				let BackColor = "#000000A0";
				if (MouseIn(6, Y + 1, 188, 188)) {
					DialogOptionFocus = I;
					if (!CommonIsMobile) {
						ForeColor = "#000000";
						BackColor = "#FFAACC";
					}
				}
				DrawEmptyRect(5, Y, 190, 190, "#FFFFFF", 1);
				DrawRect(6, Y + 1, 188, 188, BackColor);
				DrawImageResize("Image/Inventory/" + I.Option + ".png", 10, Y + 5, 180, 180);
				Y = Y + 200;
			}
	}

	// Draws the cheat buttons and picture flash if needed
	CheatDialogDraw();
	PictureFlashDraw();

}

/**
 * Keyboard handler for dialog
 * @type {KeyboardEventListener}
 */
function DialogKeyDown(event) {

	// If the dialog is paused by a mini-game
	if (MiniGameCurrent == "Rhythm") return MiniGameRhythmKeyDown(event);

	// In localhost dev environment, the C key clears image and text cache to reload it
	if ((event.code == "KeyC") && (location.host == "localhost")) {
		DrawCacheImage.clear();
		let Stage = DialogStage;
		const FullPath = "Screen/" + CommonModule + "/" + CommonScreen + "/Dialog_" + DialogCurrentName + ".csv";
		CommonCSVCache[FullPath] = null;
		CommonGet(FullPath, function () {
			if (this.status == 200) {
				CommonCSVCache[FullPath] = CommonParseCSV(this.responseText);
				DialogBuild(FullPath);
				DialogLoadStage(Stage);
			}
		});
		return true;
	}
}

/**
 * Mouse wheel handler for dialog
 * @type {KeyboardEventListener}
 */
function DialogMouseWheel(event) {
}

/**
 * Mouse down handler for dialog
 * @type {MouseEventListener}
 */
function DialogClick(event) {

	// If the dialog is paused by a mini-game
	if (MiniGameCurrent != "") return CommonDynamicFunction("MiniGame" + MiniGameCurrent + "Click()");

	// If the click is handled by the cheat engine
	if (CheatDialogClick()) return;

	// If we must open the character profile
	if ((DialogText != null) && (DialogText != "") && (DialogCharacter != null) && MouseIn(1, 801, 198, 198))
		return ProfileOpen(DialogCharacter);

	// Forces the draw on mobile to get the current dialog focused option
	if (CommonIsMobile) DialogDraw();

	// if there's only one option, we auto continue
	if ((DialogOption.length == 1) && (DialogOptionFocus == null)) {
		CharacterAlterMeter(DialogCharacter, DialogOption[0].Love, DialogOption[0].Domination);
		DialogLoadStage(DialogOption[0].Destination);
		if ((DialogOption.length > 0) && (DialogOption[0].Script != "")) CommonDynamicFunctionParams(DialogOption[0].Script);
		return;
	}

	// If there's more than one option, the user must pick one
	if ((DialogOptionFocus != null) && (DialogOptionFocus.Destination != "")) {
		DialogOption = [];
		DialogSecret = [];
		DialogInventory = [];
		DialogOption.push({ Destination: DialogOptionFocus.Destination, Option: "" });
		DialogText = DialogOptionFocus.Text;
		if (DialogOptionFocus.Character != "") DialogSetCharacter(DialogOptionFocus.Character);
		if (DialogOptionFocus.Background != "") DialogBackground = DialogOptionFocus.Background;
		CharacterAlterMeter(DialogCharacter, DialogOptionFocus.Love, DialogOptionFocus.Domination);
		if (DialogEmptyStageIntro(DialogOptionFocus.Destination)) DialogLoadStage(DialogOptionFocus.Destination);
		if (DialogOptionFocus.Script != "") CommonDynamicFunctionParams(DialogOptionFocus.Script);
		return;
	}

	// If there's a secret dialog option clicked, we launch that stage
	for (let S of DialogSecret)
		if (MouseIn(S.Left, S.Top, S.Width, S.Height)) {
			DialogLoadStage(S.Destination);
			if (S.Script !== "") CommonDynamicFunctionParams(S.Script);
		}

}

/**
 * Returns true if the Domination factor of the current character is between two numbers
 * @param {string} From - The from value
 * @param {string} To - The to value
 * @returns {boolean} - Returns TRUE if in between
 */
function DialogDominationBetween(From, To) {
	if (!CommonIsNumeric(From) || !CommonIsNumeric(To) || (DialogCharacter == null) || (DialogCharacter.Domination == null)) return false;
	return (DialogCharacter.Domination >= parseInt(From)) && (DialogCharacter.Domination <= parseInt(To));
}

/**
 * Returns true if the Domination factor is lower or equal than the parameter value
 * @param {string} Value - The value to evaluate
 * @returns {boolean} - Returns TRUE if lower or equal
 */
function DialogDominationLower(Value) {
	if (!CommonIsNumeric(Value) || (DialogCharacter == null) || (DialogCharacter.Domination == null)) return false;
	return (DialogCharacter.Domination <= parseInt(Value));
}

/**
 * Returns true if the Domination factor is greater or equal than the parameter value
 * @param {string} Value - The value to evaluate
 * @returns {boolean} - Returns TRUE if greater or equal
 */
function DialogDominationGreater(Value) {
	if (!CommonIsNumeric(Value) || (DialogCharacter == null) || (DialogCharacter.Domination == null)) return false;
	return (DialogCharacter.Domination >= parseInt(Value));
}

/**
 * Returns true if the Love factor of the current character is between two numbers
 * @param {string} From - The from value
 * @param {string} To - The to value
 * @returns {boolean} - Returns TRUE if in between
 */
function DialogLoveBetween(From, To) {
	if (!CommonIsNumeric(From) || !CommonIsNumeric(To) || (DialogCharacter == null) || (DialogCharacter.Love == null)) return false;
	return (DialogCharacter.Love >= parseInt(From)) && (DialogCharacter.Love <= parseInt(To));
}

/**
 * Returns true if the Love factor is lower or equal than the parameter value
 * @param {string} Value - The value to evaluate
 * @returns {boolean} - Returns TRUE if lower or equal
 */
function DialogLoveLower(Value) {
	if (!CommonIsNumeric(Value) || (DialogCharacter == null) || (DialogCharacter.Love == null)) return false;
	return (DialogCharacter.Love <= parseInt(Value));
}

/**
 * Returns true if the Love factor is greater or equal than the parameter value
 * @param {string} Value - The value to evaluate
 * @returns {boolean} - Returns TRUE if greater or equal
 */
function DialogLoveGreater(Value) {
	if (!CommonIsNumeric(Value) || (DialogCharacter == null) || (DialogCharacter.Love == null)) return false;
	return (DialogCharacter.Love >= parseInt(Value));
}

/**
 * Moves the week counter to advance time
 * @param {string} Week - The number of weeks to advance
 * @returns {void} - Nothing
 */
function DialogAdvanceWeek(Week) {
	if (!CommonIsNumeric(Week)) Week = "1";
	CommonWeek = CommonWeek + parseInt(Week);
}

/**
 * Alters the grades positivily or negatively for the current character
 * @param {string} Value - The value to change, must be a number
 * @param {Character} Char - The character affected by that change
 * @returns {void} - Nothing
 */
function DialogChangeGrades(Value, Char) {
	if (Char == null) Char = DialogCharacter;
	if (Char == null) return;
	if (!CommonIsNumeric(Value)) return;
	CharacterDefaultGrades(Char);
	if (Char.Grades == null) return;
	Char.Grades = Char.Grades + parseInt(Value);
	if (Char.Grades > 100) Char.Grades = 100;
	if (Char.Grades < 0) Char.Grades = 0;
}

/**
 * Alters the grades positivily or negatively for all students encountered so far
 * @param {string} Value - The value to change, must be a number
 * @returns {void} - Nothing
 */
function DialogChangeGradesAll(Value) {
	for (let Char of Character)
		DialogChangeGrades(Value, Char);
}

/**
 * Returns TRUE if the grades of all improves in a value between these numbers
 * @param {string} From - The From value
 * @param {string} To - The To value
 * @returns {boolean} - Returns TRUE if in between
 */
function DialogGradesDeltaBetween(From, To) {
	if (!CommonIsNumeric(From) || !CommonIsNumeric(To)) return false;
	let Delta = 0;
	for (let C of Character)
		if (C.Grades != null)
			Delta = Delta + C.Grades - CharacterGetDefaultGrades(C.Name);
	return (Delta >= parseInt(From)) && (Delta <= parseInt(To));
}

/**
 * Returns TRUE if the specified character is known by the player
 * @param {string} Name - The name of that character
 * @returns {boolean} - Returns TRUE if known
 */
function DialogCharacterIsKnown(Name) {
	return (CharacterGet(Name) != null);
}

/**
 * Changes the love value of a target character
 * @param {string} Name - The name of that character
 * @param {string} Value - The value to change
 * @returns {void} - Nothing
 */
function DialogChangeLove(Name, Value) {
	let Char = CharacterGet(Name);
	if (!CommonIsNumeric(Value) || (Char == null) || (Char.Love == null)) return;
	Char.Love = Char.Love + parseInt(Value);
}

/**
 * Sets a value of one of the temporary dialog variable
 * @param {string} Name - The name of the variable
 * @param {string} Value - The value to set
 * @returns {void} - Nothing
 */
function DialogVariableSet(Name, Value) {
	DialogVariable.set(Name, Value);
}

/**
 * Sets a value of one of the temporary dialog variable
 * @param {string} Name - The name of the variable
 * @param {string} Value - The value to randomize with (ex: 3 will result as "0", "1" or "2")
 * @returns {void} - Nothing
 */
function DialogVariableSetRandom(Name, Value) {
	if (CommonIsNumeric(Value) == false) Value = "1";
	Value = parseInt(Value);
	if (Value < 1) Value = 1;
	DialogVariable.set(Name, Math.floor(Math.random() * Value).toString());
}

/**
 * Returns TRUE if a dialog variable is set to a specified value
 * @param {string} Name - The name of the variable
 * @param {string} Value - The value to check
 * @returns {boolean} - TRUE if there's a match
 */
function DialogVariableIs(Name, Value) {
	return DialogVariable.get(Name) === Value;
}

/**
 * Returns TRUE if the parameter status matches the current DS relationship with the player
 * @param {string} Char - The name of the character to evaluate
 * @param {string} Status - The status to evaluate ("", "Dom", "Sub", "Owner", "Slave")
 * @returns {boolean} - TRUE if the status matches the current DS relationship
 */
function DialogCurrentDS(Char, Status) {
	if ((Char == null) || (Char === "")) Char = DialogCharacter.Name;
	if ((Char == null) || (Char === "")) return false;
	if ((Status === "") && !LogQuery(Char, "Submit") && !LogQuery(Char, "Dominate")) return true;
	if ((Status === "Dom") && LogQuery(Char, "Submit")) return true;
	if ((Status === "Sub") && LogQuery(Char, "Dominate")) return true;
	if ((Status === "Owner") && LogQuery(Char, "Slave")) return true;
	if ((Status === "Slave") && LogQuery(Char, "Owner")) return true;
	return false;
}

/**
 * Sets the background filter color for current dialog
 * @param {string} NewFilter - The new filter to apply
 * @returns {void} - Nothing
 */
function DialogSetBackgroundFilter(NewFilter) {
	if (NewFilter == null) NewFilter = "";
	DialogBackgroundFilter = NewFilter;
}

/**
 * Sets the background filter color for current dialog
 * @param {string} EndType - The type of end to trigger
 * @returns {void} - Nothing
 */
function DialogGameEnd(EndType) {
	if (EndType == null) EndType = "";
	EpilogueType = EndType;
	CommonSetScreen("Outro", "Epilogue");
}

/**
 * Returns TRUE if the main teacher character is single
 * @returns {boolean} - Returns TRUE if single
 */
function DialogTeacherIsSingle() {
	if (!LogQuery("Mia", "Breakup")) return false; // FALSE if dating Mia
	if (!DialogCurrentDS("Evelyn", "")) return false; // FALSE if in a relationship with Evelyn
	return true;
}
