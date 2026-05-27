"use strict";

/**
 * Loads the boss office screen
 * @returns {void} - Nothing
 */
function BossOfficeLoad() {
	CommonBackground = "TeacherCollegeBossOffice";
	CommonSceneTime = 0;
}

/**
 * Runs & draws boss office screen
 * @returns {void} - Nothing
 */
function BossOfficeRun() {
	DrawRect(0, 0, 2000, 1000, "#000000A0");
	if (CommonCutscene <= 2)
		for (let L = 0; L <= CommonCutscene; L++)
			DrawText(TextGet("Week" + CommonWeek.toString() + "Intro" + L.toString()), 1000, 400 + L * 100, "White", "Black");
}

/**
 * Handles click events in the boss office screen
 * @returns {void} - Nothing
 */
function BossOfficeClick() {
	CommonCutscene++;
	if (CommonCutscene >= 3) DialogLoad("Evelyn" + CommonWeek.toString());
}