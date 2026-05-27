"use strict";

/**
 * Loads the screen
 * @returns {void} - Nothing
 */
function IntroBedroomEndLoad() {
	CommonBackground = "Black";
}

/**
 * Runs & draws the screen
 * @returns {void} - Nothing
 */
function IntroBedroomEndRun() {
	if ((CommonCutscene == 2) || (CommonCutscene == 3)) DrawRect(0, 0, 2000, 1000, "#000000BF");
	if (CommonCutscene <= 3)
		for (let L = 0; L <= CommonCutscene; L++)
			DrawText(TextGet("Line" + L.toString()), 1000, 300 + L * 100, "White", "Silver");
}

/**
 * Handles click events
 * @returns {void} - Nothing
 */
function IntroBedroomEndClick() {
	CommonCutscene++;
	if (CommonCutscene >= 2) CommonBackground = "TeacherCollegeMiaSleep";
	if (CommonCutscene >= 5) SaveGameDialog("Intro", "FirstBossMeeting");
}