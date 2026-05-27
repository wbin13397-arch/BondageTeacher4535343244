"use strict";

/**
 * Loads the First Boss Meeting screen
 * @returns {void} - Nothing
 */
function FirstBossMeetingLoad() {
	CharacterAdd("Evelyn", "Evelyn");
	CommonBackground = "TeacherCollegeBossOffice";
	CommonSceneTime = 0;
}

/**
 * Runs & draws the First Boss Meeting screen backgrounds and texts
 * @returns {void} - Nothing
 */
function FirstBossMeetingRun() {
	if ((CommonCutscene >= 1) && (CommonCutscene <= 4)) DrawRect(0, 0, 2000, 1000, "#000000BF");
	for (let L = 1; L <= CommonCutscene && L <= 3; L++)
		DrawText(TextGet("Line" + (L - 1).toString()), 1000, 300 + L * 100, "White", "Silver");
}

/**
 * Handles click events in the First Boss Meeting screen
 * @returns {void} - Nothing
 */
function FirstBossMeetingClick() {
	CommonCutscene++;
	if (CommonCutscene >= 4) DialogLoad("FirstBossMeeting");
}

/**
 * When the player waits alone when waiting for her boss, the boss will surprise her after 4 attempts
 * @param {string} ExitStage - The exit stage to jump to
 * @returns {void} - Nothing
 */
function FirstBossMeetingWaitAlone(ExitStage) {
	CommonSceneTime++;
	if (CommonSceneTime >= 4) {
		if (ExitStage == "SurpriseCuffs1") LogAdd("Evelyn", "IntroSelfCuffed");
		DialogLoadStage(ExitStage);
	}
}