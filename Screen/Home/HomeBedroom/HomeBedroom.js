"use strict";

/**
 * Loads the Bedroom screen
 * @returns {void} - Nothing
 */
function HomeBedroomLoad() {
	InventoryAdd("Handcuffs");
	CommonBackground = "Black";
	let Mia = CharacterGet("Mia");
	if (LogQuery("Evelyn", "Submit") || LogQuery("Evelyn", "Dominate")) {
		CommonSetScreen("Home", "BossHouse");
		return;
	}
	if (LogQuery("Mia", "Breakup")) {
		DialogLoad("Alone");
		return;
	}
	if ((Mia.Love != null) && (Mia.Love < 0) && (CommonWeek >= 3)) {
		DialogLoad("MiaBreakup");
		return;
	}
	DialogLoad("Mia" + CommonWeek.toString());
}

/**
 * Runs & draws the Bedroom screen
 * @returns {void} - Nothing
 */
function HomeBedroomRun() {
}

/**
 * Handles click events in the Bedroom screen
 * @returns {void} - Nothing
 */
function HomeBedroomClick() {
}