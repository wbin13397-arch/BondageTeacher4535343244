"use strict";
var EpilogueType = "";
var EpilogueSequence = 0;

/**
 * Loads the Epilogue screen
 * @returns {void} - Nothing
 */
function EpilogueLoad() {
	if (StartCredits == null) CommonReadCSV("StartCredits", "Intro", "Start", "GameCredits");
	EpilogueSequence = 0;
	StartCreditsPosition = 0;
	if (EpilogueType === "") {
		if (LogQuery("College", "Leave")) {
			if (!LogQuery("Mia", "Breakup")) {
				if (DialogCurrentDS("Mia", "Dom")) EpilogueType = "LeaveCollegeMaidWorkMiaMistress";
				else if (DialogCurrentDS("Mia", "Sub")) EpilogueType = "LeaveCollegeMistressWorkMiaMaid";
				else if (CharacterGet("Mia").Love >= 25) EpilogueType = "LeaveCollegeMarryMia";
				else EpilogueType = "LeaveCollegeMaidWorkWithMia";
			} else {
				if (DialogCurrentDS("Sidney", "Dom")) EpilogueType = "LeaveCollegeSubmitToSidney";
				else if (DialogCurrentDS("Sidney", "Sub")) EpilogueType = "LeaveCollegeDominateSidney";
				else EpilogueType = "LeaveCollegeMaidWorkAlone";
			} 
		}
	}
	CommonBackground = "Epilogue/" + EpilogueType;
}

/**
 * Runs & draws the Epilogue screen
 * @returns {void} - Nothing
 */
function EpilogueRun() {

	// Draw the credits and buttons by sequence
	if (EpilogueSequence >= 1) {
		DrawRect(0, 0, 2000, 1000, "#00000080");
		if (StartCredits != null) StartDrawCredits();
		DrawText(TextGet(EpilogueType + "0"), 550, 200, "White", "Black");
	}
	if (EpilogueSequence >= 2) DrawText(TextGet(EpilogueType + "1"), 550, 300, "White", "Black");
	if (EpilogueSequence >= 3) DrawText(TextGet(EpilogueType + "2"), 550, 400, "White", "Black");
	if (EpilogueSequence >= 4) DrawText(TextGet(EpilogueType + "3"), 550, 500, "White", "Black");
	if (EpilogueSequence >= 5) DrawText(TextGet("End"), 550, 600, "White", "Black");
	if (EpilogueSequence >= 6) DrawButton(350, 800, 400, 60, TextGet("Return"), "White", "");

	// Draw the thank you bubbles
	if (EpilogueSequence >= 1) {
		StartPatronSet();
		DrawRect(1100, 810, 800, 180, "#000000A0");
		DrawEmptyRect(1100, 810, 800, 180, "#FFFFFF", 1);
		DrawPortrait(StartPortrait, 1101, 811, 178, 178);
		DrawEmptyRect(1280, 810, 0, 180, "#B0B0B0", 1);
		DrawText(TextGet("ThankYou"), 1590, 865, "White", "Black");
		DrawText(StartPatron, 1590, 935, "White", "Black");
	}

}

/**
 * Handles click events in the Epilogue screen
 * @returns {void} - Nothing
 */
function EpilogueClick() {
	if ((EpilogueSequence >= 6) && MouseIn(350, 800, 400, 60)) CommonSetScreen("Intro", "Start");
	if (EpilogueSequence < 6) EpilogueSequence++;
}
