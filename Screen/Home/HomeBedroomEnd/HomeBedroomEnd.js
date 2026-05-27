"use strict";

/**
 * Loads the Bedroom End screen
 * @returns {void} - Nothing
 */
function HomeBedroomEndLoad() {
	CommonBackground = "Black";
}

/**
 * Runs & draws the Bedroom End screen
 * @returns {void} - Nothing
 */
function HomeBedroomEndRun() {
	if ((CommonCutscene == 2) || (CommonCutscene == 3)) DrawRect(0, 0, 2000, 1000, "#000000BF");
	for (let L = 0; L <= CommonCutscene; L++) {
		let Text = "Week" + CommonWeek.toString();
		if (LogQuery("Mia", "Submit")) Text = "Submit" + ((DialogVariable.get("TeacherSleep") == null) ? "" : DialogVariable.get("TeacherSleep"));
		if (LogQuery("Mia", "Dominate")) Text = "Dominate" + ((DialogVariable.get("MiaSleep") == null) ? "" : DialogVariable.get("MiaSleep"));
		if (LogQuery("Mia", "Breakup")) Text = "Single";
		if (LogValue("Evelyn", "Dominate") >= 2) Text = "EvelynSlave" + ((DialogVariable.get("EvelynSleep") == null) ? "" : DialogVariable.get("EvelynSleep"));
		if (LogValue("Evelyn", "Submit") >= 3) Text = "EvelynMistress";
		DrawText(TextGet(Text + "Line" + L.toString()), 1000, 300 + L * 100, "White", "Silver");
	}
}

/**
 * Handles click events in the Bedroom End screen
 * @returns {void} - Nothing
 */
function HomeBedroomEndClick() {
	CommonCutscene++;
	if (CommonCutscene >= 2) {
		if (LogValue("Evelyn", "Dominate") >= 2) CommonBackground = "TeacherCollegeEvelynCollared"
		else if (LogValue("Evelyn", "Submit") >= 3) CommonBackground = "TeacherCollaredEvelynDirector"
		else if (LogQuery("Mia", "Breakup")) CommonBackground = "TeacherCollegeSingle";
		else if (LogQuery("Mia", "Dominate") && (DialogVariable.get("MiaSleep") === "PrisonerWithCharlotte")) CommonBackground = "TeacherCollegeMiaUnderwearCharlotteUnderwear";
		else if (LogQuery("Mia", "Dominate")) CommonBackground = "TeacherCollegeMiaKneelNaked";
		else CommonBackground = "TeacherCollegeMiaSleep";
	}
	if (CommonCutscene >= 4) SaveGameDialog("Class", ((CommonWeek == 3) || (CommonWeek == 5) || (CommonWeek == 7) || (CommonWeek == 9) || (CommonWeek == 11)) ? "BossOffice" : "Detention");
}