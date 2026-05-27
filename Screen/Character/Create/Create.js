"use strict";

/**
 * Loads the Character Creation screen
 * @returns {void} - Nothing
 */
function CreateLoad() {
	CommonBackground = "White";
	ElementCreateInput("InputName", "input", "", 20);
}

/**
 * Runs & draws the Character Creation screen
 * @returns {void} - Nothing
 */
function CreateRun() {
	DrawImage("Image/Character/Large/TeacherUnderwear.png", 200, 0);
	DrawText(TextGet("Title"), 1000, 300, "Black", "Silver");
	DrawText(TextGet("EnterName"), 1000, 400, "Black", "Silver");
	ElementPosition("InputName", 1000, 500, 400, 60);
	DrawButton(725, 600, 250, 60, TextGet("Cancel"), "White", "");
	DrawButton(1025, 600, 250, 60, TextGet("Create"), "White", "");
	DrawImage("Image/Character/Large/TeacherDefault.png", 1300, 0);
}

/**
 * Handles click events in the Character Creation screen
 * @returns {void} - Nothing
 */
function CreateClick() {
	if (MouseIn(725, 600, 250, 60)) { 
		CommonSetScreen("Intro", "Start");
		ElementRemove("InputName");
	}
	if (MouseIn(1025, 600, 250, 60)) {
		let Name = ElementValue("InputName").trim();
		if (Name == "") Name = "Lily";
		CharacterAdd("Teacher", Name);
		CharacterAdd("Mia", "Mia");
		CommonSetScreen("Intro", "IntroBedroom");
		ElementRemove("InputName");
	}
}