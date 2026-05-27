"use strict";
var SaveGameMode = "SAVE";
var SaveGameModule = null;
var SaveGameScreen = null;
var SaveGameSlot = null;
var SaveGameFolder = null;
var SaveGameFolderCurrent = 0;

/**
 * Opens the save screen dialog in save mode
 * @param {string} Module - The module to call once saved
 * @param {string} Screen - The screen to call once saved
 * @returns {void} - Nothing
 */
function SaveGameDialog(Module, Screen) {
    SaveGameMode = "SAVE";
    SaveGameModule = Module;
    SaveGameScreen = Screen;
    CommonSetScreen("Character", "SaveGame");
}

/**
 * Loads the save screen
 * @returns {void} - Nothing
 */
function SaveGameLoad() {
    SaveGameFolderCurrent = 0;
    CommonBackground = "White";
    if (SaveGameMode == "SAVE") ElementCreateInput("InputDescription", "input", "", 50);
}

/**
 * Returns a short summary describing the saved game
 * @param {number} Slot - The save slot #
 * @returns {array} - A array with the data
 */
function SaveGameGetSlotSummary(Slot) {
    let Data = localStorage.getItem("BondageTeacherGame" + Slot.toString());
    if ((Data == null) || (Data == "")) return [(Slot + 1).toString() + " - " + TextGet("Empty")];
    Data = JSON.parse(Data);
    let Summary = [(Slot + 1).toString() + " - " + TimeToDateString(Data.Time), Data.Character[0].DisplayName + " - " + TextGet("Week") + Data.Week.toString() + " - " + TextGet("Screen" + Data.Screen)];
    if ((Data.Description != null) && (Data.Description != "")) Summary.push(Data.Description);
    return Summary;
}

/**
 * Returns a short summary describing the saved game
 * @param {number} Folder - The folder #
 * @returns {number} - The number of slots used in that folder
 */
function SaveGameGetFolderUsage(Folder) {
    let Usage = 0;
    for (let S = 0; S <= 9; S++) {
        let Data = localStorage.getItem("BondageTeacherGame" + (S + Folder * 10).toString());
        if ((Data != null) && (Data != "")) Usage++;
    }
    return Usage;
}

/**
 * Saves a game on a given slot
 * @param {number} Slot - The save slot #
 * @returns {void} - Nothing
 */
function SaveGameSaveSlot(Slot) {
    let Data = {
        Character: Character,
        Log: Log,
        Inventory: Inventory,
        Picture: Picture,
        Week: CommonWeek,
        Module: SaveGameModule,
        Screen: SaveGameScreen,
        Time: CommonTime()
    }
    let Description = ElementValue("InputDescription").trim();
    if (Description != "") Data.Description = Description;
    localStorage.setItem("BondageTeacherGame" + Slot.toString(), JSON.stringify(Data));
}

/**
 * Loads a game on a given slot
 * @param {number} Slot - The save slot #
 * @returns {void} - Nothing
 */
function SaveGameLoadSlot(Slot) {
    let Data = localStorage.getItem("BondageTeacherGame" + Slot.toString());
    if ((Data == null) || (Data == "")) return;
    Data = JSON.parse(Data);
    Character = Data.Character;
    if (Character == null) Character = [];
    Log = Data.Log;
    if (Log == null) Log = [];
    Inventory = Data.Inventory;
    if (Inventory == null) Inventory = [{ Name: "Phone" }];
    Picture = Data.Picture;
    if (Picture == null) Picture = CommonCloneDeep(PictureDefault);
    CommonWeek = Data.Week;
    if (!CommonIsNumeric(CommonWeek) || (CommonWeek <= 0) || (CommonWeek >= 100)) CommonWeek = 1;
    CommonSetScreen(Data.Module, Data.Screen);
    ElementRemove("InputDescription");
}

/**
 * Runs the save screen
 * @returns {void} - Nothing
 */
function SaveGameRun() {

    // Draws 10 folders on the left
    SaveGameFolder = null;
    for (let F = 0; F <= 9; F++) {
        let X = 50;
        let Y = 150 + F * 75;
        DrawButton(X, Y, 300, 65, "", (SaveGameFolderCurrent == F) ? "#80FF80" : "White", "");
        if (MouseIn(X, Y, 300, 65)) SaveGameFolder = F;
        DrawTextFit("📁 #" + (F + 1).toString() + " - " + SaveGameGetFolderUsage(F).toString() + "/10", X + 150, Y + 35, 280, "Black", "Silver");
    }

    // Draws 10 save slots on the right
    SaveGameSlot = null;
    for (let S = 0; S <= 9; S++) {
        let X = 375 + (S % 2) * 800;
        let Y = 150 + Math.floor(S / 2) * 150;
        DrawButton(X, Y, 775, 140, "", "White", "");
        if (MouseIn(X, Y, 775, 140)) SaveGameSlot = S;
        let Summary = SaveGameGetSlotSummary(S + SaveGameFolderCurrent * 10);
        if (Summary.length == 1) {
            DrawTextFit(Summary[0], X + 387, Y + 70, 750, "Black", "Silver");
        } else if (Summary.length == 2) {
            DrawTextFit(Summary[0], X + 387, Y + 40, 750, "Black", "Silver");
            DrawTextFit(Summary[1], X + 387, Y + 100, 750, "Black", "Silver");
        } else {
            DrawTextFit(Summary[0], X + 387, Y + 25, 750, "Black", "Silver");
            DrawTextFit(Summary[1], X + 387, Y + 70, 750, "Black", "Silver");
            DrawTextFit(Summary[2], X + 387, Y + 115, 750, "Black", "Silver");
        }
    }

    // Draws the header and bottom buttons, in save mode you can enter a custom description
    if (SaveGameMode == "SAVE") {
        DrawText(TextGet("SaveGame"), 1000, 40, "Black", "Silver");
        DrawText(TextGet("Description"), 490, 105, "Black", "Silver");
        ElementPosition("InputDescription", 1100, 105, 1000, 50);
        DrawButton(675, 910, 300, 65, TextGet("Exit"), "White", "");
        DrawButton(1025, 910, 300, 65, TextGet("Continue"), "White", "");
    } else {
        DrawText(TextGet("LoadGame"), 1000, 75, "Black", "Silver");
        DrawButton(850, 910, 300, 65, TextGet("Back"), "White", "");
    }

}

/**
 * Handles the click in the save screen
 * @returns {void} - Nothing
 */
function SaveGameClick() {

	// Forces the draw on mobile to get the current dialog focused option
	if (CommonIsMobile) SaveGameRun();

    // When the user wants another folder
    if (SaveGameFolder != null) SaveGameFolderCurrent = SaveGameFolder;

    // When the user clicks on a button to load or save a slot
    if ((SaveGameSlot != null) && (SaveGameMode == "SAVE")) SaveGameSaveSlot(SaveGameSlot + SaveGameFolderCurrent * 10);
    if ((SaveGameSlot != null) && (SaveGameMode == "LOAD")) SaveGameLoadSlot(SaveGameSlot + SaveGameFolderCurrent * 10);

    // When the user clicks on bottom buttons to navigate screens
	if (MouseIn(675, 910, 300, 65) && (SaveGameMode == "SAVE")) { CommonSetScreen("Intro", "Start"); ElementRemove("InputDescription"); }
	if (MouseIn(1025, 910, 300, 65) && (SaveGameMode == "SAVE")) { CommonSetScreen(SaveGameModule, SaveGameScreen); ElementRemove("InputDescription"); }
	if (MouseIn(850, 910, 300, 65) && (SaveGameMode == "LOAD")) CommonSetScreen("Intro", "Start");

}
