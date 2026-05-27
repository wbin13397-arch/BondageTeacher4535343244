"use strict";
var DetentionEndBackground = "";

/**
 * Loads the Detention End screen
 * @returns {void} - Nothing
 */
function DetentionEndLoad() {
	CommonBackground = DetentionEndBackground;
}

/**
 * Runs & draws the Detention End screen
 * @returns {void} - Nothing
 */
function DetentionEndRun() {
	DrawRect(0, 0, 2000, 1000, "#000000A0");
	if (CommonCutscene >= 1)
		for (let L = 1; L <= CommonCutscene; L++)
			DrawText(TextGet(((CommonBackground == "TeacherClassStandingAloneCuffed") ? "Cuffed" : "Normal") + L.toString()), 1000, 200 + L * 100, "White", "Black");
}

/**
 * Handles click events in the Detention End screen
 * @returns {void} - Nothing
 */
function DetentionEndClick() {
	CommonCutscene++;
	if (CommonCutscene >= 6) {
		CommonWeek++;
		SaveGameDialog("Home", "HomeBedroom");
	}
}