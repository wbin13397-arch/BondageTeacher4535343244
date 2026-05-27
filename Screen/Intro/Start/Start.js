"use strict";
var StartCredits = null;
var StartCreditsPosition = 0;
var StartPatronTimer = 0;
var StartPatron = "";
var StartPortrait = "Mia";
var StartPortraitList = ["Teacher", "Mia", "Evelyn", "Yuki", "Amanda", "Sarah", "Sidney", "Jane", "Charlotte", "Sam"];

/**
 * Sets a new Patron thank you bubble at every 3 seconds
 * @returns {void} - Nothing
 */
function StartPatronSet() {
	if (StartPatronTimer >= CommonTime()) return;
	StartPatronTimer = CommonTime() + 3000;
	StartPortrait = CommonRandomItemFromList(StartPortrait, StartPortraitList);
	StartPatron = CommonRandomItemFromList(StartPatron, StartThankYouList);
}

/**
 * Draw the credits
 * @returns {void} Nothing
 */
function StartDrawCredits() {

	// Cuts the file to only show the patrons
	if (StartCredits[0][0].trim() == "CreditTypeDevelopers") {
		while (StartCredits[0][0].trim() != "CreditTypePatrons")
			StartCredits.shift();
	}

	// For each credits in the list
	StartCreditsPosition += (TimerRunInterval * 60) / 1000;
	if (StartCreditsPosition > StartCredits.length * 25 || StartCreditsPosition < 0) StartCreditsPosition = 0;
	for (let C = 0; C < StartCredits.length; C++) {

		// Sets the Y position (it scrolls from bottom to top)
		var Y = 800 - Math.floor(StartCreditsPosition * 2) + (C * 50);

		// Draw the text if it's in drawing range
		if ((Y > 0) && (Y <= 800)) {

			// The "CreditTypeRepeat" starts scrolling again, other credit types are translated
			var Cred = StartCredits[C][0].trim();
			if (Cred == "CreditTypeRepeat") {
				StartCreditsPosition = 0;
				return;
			} else {
				if (Cred.substr(0, 10) == "CreditType") DrawText(TextGet(Cred), 1500, Y, "white");
				else {
					if (Cred.indexOf("|") == -1) DrawText(Cred, 320, Y, "white");
					else {
						DrawText(Cred.substring(0, Cred.indexOf("|")), 1300, Y, "white");
						DrawText(Cred.substring(Cred.indexOf("|") + 1, 1000), 1700, Y, "white");
					}
				}
			}

		}

	}

}

/**
 * Loads the Start screen
 * @returns {void} - Nothing
 */
function StartLoad() {
	if (StartCredits == null) CommonReadCSV("StartCredits", CommonModule, CommonScreen, "GameCredits");
	StartCreditsPosition = 0;
	Character = [];
	Log = [];
	Inventory = [{ Name: "Phone" }];
	Picture = CommonCloneDeep(PictureDefault);
	MiniGameTextLoad();
	CommonWeek = 1;
	CommonBackground = "Intro";
}

/**
 * Runs & draws the Start screen
 * @returns {void} - Nothing
 */
function StartRun() {

	// Draw the credits and buttons
	if (StartCredits != null) StartDrawCredits();
	DrawText(TextGet("Title"), 550, 150, "White", "Black");
	if (CheatActive()) DrawText(TextGet("CheatsActive"), 550, 225, "Pink", "Black");
	DrawButton(400, 400, 300, 60, TextGet("NewGame"), "White", "");
	DrawButton(400, 550, 300, 60, TextGet("LoadGame"), "White", "");
	DrawButton(400, 700, 300, 60, TextGet("Language" + TranslationLanguage), "White", "");
	DrawMainCanvas.font = CommonGetFont(24);
	DrawText(GameVersion, 550, 875, "White", "Black");
	DrawMainCanvas.font = CommonGetFont(36);

	// Draw the thank you bubbles
	StartPatronSet();
	DrawRect(1100, 810, 800, 180, "#000000A0");
	DrawEmptyRect(1100, 810, 800, 180, "#FFFFFF", 1);
	DrawPortrait(StartPortrait, 1101, 811, 178, 178);
	DrawEmptyRect(1280, 810, 0, 180, "#B0B0B0", 1);
	DrawText(TextGet("ThankYou"), 1590, 865, "White", "Black");
	DrawText(StartPatron, 1590, 935, "White", "Black");

}

/**
 * Handles click events in the Start screen
 * @returns {void} - Nothing
 */
function StartClick() {
	if (MouseIn(400, 400, 300, 60)) CommonSetScreen("Character", "Create");
	if (MouseIn(400, 550, 300, 60)) {
		SaveGameMode = "LOAD";
		CommonSetScreen("Character", "SaveGame");
	}
	if (MouseIn(400, 700, 300, 60)) TranslationNextLanguage();
}
