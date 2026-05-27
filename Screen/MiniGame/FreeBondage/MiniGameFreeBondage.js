"use strict";
var MiniGameFreeBondageScene = "";
var MiniGameFreeBondageOptionFocus = "";
var MiniGameFreeBondageOptionSelected = "";
var MiniGameFreeBondageMenu = [];
var MiniGameFreeBondageMenuOffset = 0;
var MiniGameFreeBondageZone = [];
var MiniGameFreeBondageBlush = 0;
var MiniGameFreeBondageBlushTimer = 0;
var MiniGameFreeBondageBlinkTimer = 0;
var MiniGameFreeBondageMeterTimer = 0;
var MiniGameFreeBondageStress = 0;
var MiniGameFreeBondageArousal = 0;
var MiniGameFreeBondageStressProgress = 0;
var MiniGameFreeBondageArousalProgress = 0;
var MiniGameFreeBondageStressValue = 0;
var MiniGameFreeBondageArousalValue = 0;
var MiniGameFreeBondageStressMax = 0;
var MiniGameFreeBondageArousalMax = 0;
var MiniGameFreeBondageStressZone = [];
var MiniGameFreeBondageArousalZone = [];
var MiniGameFreeBondageOptionFocusDialog = "";
var MiniGameFreeBondageDialog = null;
var MiniGameFreeBondageDialogPosition = null;

/**
 * Returns true if the mini game final factor is greater or equal than the parameter value
 * @param {string} Type - Stress or Arousal
 * @param {string} Value - The value to evaluate
 * @returns {boolean} - Returns TRUE if greater or equal
 */
function MiniGameFreeBondageResultGreater(Type, Value) {
	if (!CommonIsNumeric(Value)) return false;
	return ((Type === "Stress") ? MiniGameFreeBondageStressValue : MiniGameFreeBondageArousalValue) >= parseInt(Value);
}

/**
 * Returns true if the mini game final factor is lower or equal than the parameter value
 * @param {string} Type - Stress or Arousal
 * @param {string} Value - The value to evaluate
 * @returns {boolean} - Returns TRUE if lower or equal
 */
function MiniGameFreeBondageResultLower(Type, Value) {
	if (!CommonIsNumeric(Value)) return false;
	return ((Type === "Stress") ? MiniGameFreeBondageStressValue : MiniGameFreeBondageArousalValue) <= parseInt(Value);
}

/**
 * Returns true if the mini game final factor is between two parameter values
 * @param {string} Type - Stress or Arousal
 * @param {string} From - The from value to evaluate
 * @param {string} To - The to value to evaluate
 * @returns {boolean} - Returns TRUE if between from and to
 */
function MiniGameFreeBondageResultBetween(Type, From, To) {
	if (!CommonIsNumeric(From) && !CommonIsNumeric(To)) return false;
    let Value = ((Type === "Stress") ? MiniGameFreeBondageStressValue : MiniGameFreeBondageArousalValue);
	return ((parseInt(Value) >= parseInt(From)) && (parseInt(Value) <= parseInt(To)));
}

/**
 * Called when the session is completed, apply changes to love/domination/grades
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageEndResult(CharName, Grades) {

    // Gets the character
    let Char = CharacterGet(CharName);
    if (Char == null) return;

    // Applies changes to the love value
    let Love = 0;
    if (MiniGameFreeBondageArousalValue <= -100) Love = Love - 3;
    else if (MiniGameFreeBondageArousalValue <= -50) Love = Love - 2;
    else if (MiniGameFreeBondageArousalValue <= 0) Love = Love - 1;
    else if (MiniGameFreeBondageArousalValue >= 100) Love = Love + 3;
    else Love = Love + 1;

    // Applies changes to the domination value
    let Domination = 0;
    if (MiniGameFreeBondageStressValue <= -100) Domination = Domination - 3;
    else if (MiniGameFreeBondageStressValue <= -50) Domination = Domination - 2;
    else if (MiniGameFreeBondageStressValue <= 0) Domination = Domination - 1;
    else if (MiniGameFreeBondageStressValue >= 100) Domination = Domination + 3;
    else Domination = Domination + 1;

    // Saves the changes
    CharacterAlterMeter(Char, Love, Domination);
    DialogChangeGrades(Grades, Char);
    DialogChangeGrades(Domination, Char);

}

/**
 * Builds the free bondage dialog
 * @param {string} FullPath - The full path to get the file
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageBuild(FullPath) {

    // Default values
    MiniGameFreeBondageOptionSelected = "";
    MiniGameFreeBondageMenu = [];
    MiniGameFreeBondageZone = [];
    MiniGameFreeBondageDialogPosition = { X: 150, Y: 200, W: 400, H: 60 };

	// Loops in the full dialog CSV file
	for (let Line of CommonCSVCache[FullPath]) {

        // Gets the base options
        let Stage = "";
        let Type = "";
		if (Line.length > 0) Stage = Line[0];
		if (Line.length > 1) Type = Line[1];

        // Skip if we are not in the correct scene
        if ((Stage != MiniGameStage) && (Stage != "All")) continue;

        // Skip if the condition is not met
        let Condition = null;
        if (Line.length > 14) Condition = Line[14];
        if ((Condition != null) && (Condition != "") && !CommonDynamicFunctionParams(Condition)) continue;

        // Creates a menu button option
        if (Type === "Menu") {
            let Obj = {};
            if (Line.length > 2) Obj.Option = Line[2];
            if (Obj.Option.startsWith("Inventory") && !InventoryAvailable(Obj.Option.substring(9))) continue;
            if (Line.length > 3) Obj.Text = Line[3];
            if (Line.length > 4) Obj.Dialog = Line[4];
            MiniGameFreeBondageMenu.push(Obj);
        }

        // Creates a zone to use inventory or actions
        if (Type === "Zone") {
            let Obj = { Flag: [] };
            if (Line.length > 2) Obj.Option = Line[2];
            if (Obj.Option.startsWith("Inventory") && !InventoryAvailable(Obj.Option.substring(9))) continue;
            if (Line.length > 3) Obj.Name = Line[3];
            if (Line.length > 4) Obj.Dialog = Line[4];
            if (Line.length > 5) Obj.X = parseInt(Line[5]);
            if (Line.length > 6) Obj.Y = parseInt(Line[6]);
            if (Line.length > 7) Obj.W = parseInt(Line[7]);
            if (Line.length > 8) Obj.H = parseInt(Line[8]);
            if (Line.length > 9) Obj.Blush = parseInt(Line[9]);
            if (Line.length > 10) Obj.Blink = parseInt(Line[10]);
            if (Line.length > 11) Obj.Stress = parseFloat(Line[11]);
            if (Line.length > 12) Obj.Arousal = parseFloat(Line[12]);
            if (Line.length > 13) Obj.NextStage = Line[13];
            if (Line.length > 15) Obj.Flag = Line[15].split("|");
            MiniGameFreeBondageZone.push(Obj);
        }

        // Creates the meter zones
        if (Type === "Meter") {
            let Obj = {};
            if (Line.length > 3) Obj.Color = Line[3];
            if (Line.length > 4) Obj.Dialog = Line[4];
            if (Line.length > 5) Obj.From = parseInt(Line[5]);
            if (Line.length > 6) Obj.To = parseInt(Line[6]);
            if (Line.length > 7) Obj.Value = parseInt(Line[7]);
            if ((Line.length > 2) && (Line[2] === "Stress")) MiniGameFreeBondageStressZone.push(Obj);
            if ((Line.length > 2) && (Line[2] === "Arousal")) MiniGameFreeBondageArousalZone.push(Obj);
        }

        // Position of the dialog box
        if ((Type === "Dialog") && (Line.length > 8))
            MiniGameFreeBondageDialogPosition = { X: parseInt(Line[5]), Y: parseInt(Line[6]), W: parseInt(Line[7]), H: parseInt(Line[8]) };

	}

    // If there's more than 10 menu options, we add a "Next" option
    if (MiniGameFreeBondageMenu.length > 10) {
        let Obj = {};
        Obj.Option = "MenuNext";
        Obj.Text = "Next";
        MiniGameFreeBondageMenu.splice(9, 0, Obj);
        MiniGameFreeBondageMenu.push(CommonCloneDeep(Obj));
    }
    if (MiniGameFreeBondageMenuOffset >= MiniGameFreeBondageMenu.length) MiniGameFreeBondageMenuOffset = 0;

}

/**
 * Loads the free bondage mini-game
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageLoad() {

    // Clears the mini-game
    MiniGameStage = "Intro";
    MiniGameFreeBondageBlush = 0;
    MiniGameFreeBondageBlushTimer = CommonTime();
    MiniGameFreeBondageBlinkTimer = 0;
    MiniGameFreeBondageStress = 0;
    MiniGameFreeBondageArousal = 0;
    MiniGameFreeBondageStressProgress = 0;
    MiniGameFreeBondageArousalProgress = 0;
    MiniGameFreeBondageMeterTimer = 0;
    MiniGameFreeBondageStressZone = [];
    MiniGameFreeBondageArousalZone = [];
    MiniGameFreeBondageDialog = null;

    // Sets a specific entry stage if needed
    let EntryStage = MiniGameParameterGet("FreeBondage", "EntryStage")
    if ((EntryStage != null) && (EntryStage !== "")) MiniGameStage = EntryStage;

    // Loads the CSV of the scene
    MiniGameFreeBondageScene = MiniGameParameterGet("MiniGame", "Launch");
	const FullPath = "Screen/MiniGame/FreeBondage/" + MiniGameFreeBondageScene + ".csv";

	// If it's already in Cache, we load it from there
	if (CommonCSVCache[FullPath]) {
		MiniGameFreeBondageBuild(FullPath);
		return;
	}

	// If not in cache, we load the CSV from the folder
	CommonGet(FullPath, function () {
		if (this.status == 200) {
			CommonCSVCache[FullPath] = CommonParseCSV(this.responseText);
			MiniGameFreeBondageBuild(FullPath);
		}
	});

}

/**
 * Builds the free bondage dialog
 * @param {number} X - The X position of the menu
 * @param {array} MenuList - The array of possible menu options
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageDrawMenu(X, MenuList) {

    // 10 menu options max per screen
    let Menu10 = (MenuList.length > 10) ? MenuList.slice(MiniGameFreeBondageMenuOffset, ((MiniGameFreeBondageMenuOffset == 0) ? 10 : MenuList.length)) : MenuList;

    // Draw each menu items one by one
    let Y = 500 - (Menu10.length * 50);
    MiniGameFreeBondageOptionFocus = "";
    MiniGameFreeBondageOptionFocusDialog = "";
    for (let Menu of Menu10) {
        let ForeColor = "#FFFFFF";
        let BackColor = "#000000A0";
        if (MouseIn(X + 6, Y + 1, 488, 88)) {
            MiniGameFreeBondageOptionFocus = Menu.Option;
            MiniGameFreeBondageOptionFocusDialog = Menu.Dialog;
            if (!CommonIsMobile) {
                ForeColor = "#000000";
                BackColor = "#FFAACC";
            }
        }
        if (MiniGameFreeBondageOptionSelected === Menu.Option) {
            ForeColor = "#000000";
            BackColor = "#FFFFFF";
        }
        DrawEmptyRect(X + 5, Y + 5, 490, 90, "#FFFFFF", 1);
        DrawRect(X + 6, Y + 6, 488, 88, BackColor);
        DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Image/" + Menu.Option + ".png", X + 10, Y + 10, 80, 80);
        DrawText(Menu.Text, X + 300, Y + 50, ForeColor, "#808080");
        Y = Y + 100;
    }

}

/**
 * Returns the current blush level/image to use
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageBlushGet() {
    MiniGameFreeBondageBlush = MiniGameFreeBondageBlush - (CommonTime() - MiniGameFreeBondageBlushTimer) / 1000;
    MiniGameFreeBondageBlushTimer = CommonTime();
    if (MiniGameFreeBondageBlush < 0) MiniGameFreeBondageBlush = 0;
    if (MiniGameFreeBondageBlush >= 10) return 3;
    else if (MiniGameFreeBondageBlush >= 5) return 2;
    else if (MiniGameFreeBondageBlush >= 2) return 1;
    else return 0;
}

/**
 * Adds to the current blush factor
 * @param {number} Blush - The blush factor to add
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageBlushSet(Blush) {
    if (!CommonIsNumeric(Blush)) return;
    if (MiniGameFreeBondageBlush > Blush * 2) return;
    MiniGameFreeBondageBlush = MiniGameFreeBondageBlush + Blush;
    if (MiniGameFreeBondageBlush > Blush * 2) MiniGameFreeBondageBlush = Blush * 2;
}

/**
 * Adds to the current blink timer
 * @param {number} Blink - The number of seconds to set the blink
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageBlinkSet(Blink) {
    if (!CommonIsNumeric(Blink)) return;
    let NewBlink = CommonTime() + Blink * 1000;
    if (NewBlink > MiniGameFreeBondageBlinkTimer) MiniGameFreeBondageBlinkTimer = NewBlink;
}

/**
 * Draws the background image, built based on the parameters for each zones
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageDrawBackground() {
    let Blink = (MiniGameFreeBondageBlinkTimer > CommonTime()) || CharacterBlink();
	DrawImageResize("Screen/MiniGame/FreeBondage/Background/" + MiniGameBackground + "/" + MiniGameStage + (Blink ? "Blink" : "") + ".jpg", 0, 0, 2000, 1000);
    let BlushLevel = MiniGameFreeBondageBlushGet();
    if (BlushLevel >= 1)
        for (let Z of MiniGameFreeBondageZone)
            if ((Z.Option == "Blush") && (Z.Name == "Level" + BlushLevel.toString()))
                DrawImageResize("Screen/MiniGame/FreeBondage/Background/" + MiniGameBackground + "/" + Z.Option + Z.Name + ".png", Z.X, Z.Y, Z.W, Z.H);
    for (let Z of MiniGameFreeBondageZone)
        if (MiniGameParameterGetBool(Z.Option, Z.Name))
            DrawImageResize("Screen/MiniGame/FreeBondage/Background/" + MiniGameBackground + "/" + Z.Option + Z.Name + (Z.Flag.includes("StageImage") ? MiniGameStage : "") + ".png", Z.X, Z.Y, Z.W, Z.H);
}

/**
 * Draws a small meter on screen
 * @param {number} X - The X position of the menu
 * @param {number} Y - The Y position of the menu
 * @param {number} Value - The value of the progress bar from 0 to 100
 * @param {number} Max - The maximal value of the progress bar from 0 to 100
 * @param {string} Image - The image to set in the bottom of the meter
 * @param {string} Color - The color of the active meter
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageDrawMeterSmall(X, Y, Value, Max, Image, ActiveColor, MaxColor, Zone) {
    DrawRect(X + 6, Y + 6, 88, 488, "#000000A0");
    for (let Z of Zone)
        DrawRect(X + 5, Y + 405 - Z.To * 4, 90, (Z.To - Z.From) * 4, Z.Color);
    DrawRect(X + 5, Y + 405 - Max * 4, 90, Max * 4, MaxColor);
    DrawRect(X + 5, Y + 405 - Value * 4, 90, Value * 4, ActiveColor);
    DrawEmptyRect(X + 5, Y + 5, 90, 490, "#FFFFFF", 1);
    DrawEmptyRect(X + 5, Y + 405, 90, 1, "#FFFFFF", 1);
    DrawImageResize("Screen/MiniGame/FreeBondage/Image/" + Image + ".png", X + 10, Y + 410, 80, 80);
}

/**
 * Draws a large meter on screen
 * @param {number} X - The X position of the menu
 * @param {number} Y - The Y position of the menu
 * @param {number} Value - The value of the progress bar from 0 to 100
 * @param {number} Max - The maximal value of the progress bar from 0 to 100
 * @param {string} Image - The image to set in the bottom of the meter
 * @param {string} Color - The color of the active meter
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageDrawMeterLarge(X, Y, Value, Max, Image, ActiveColor, MaxColor, Zone) {
    DrawRect(X + 6, Y + 6, 88, 988, "#000000A0");
    for (let Z of Zone)
        DrawRect(X + 5, Y + 905 - Z.To * 9, 90, (Z.To - Z.From) * 9, Z.Color);
    DrawRect(X + 5, Y + 905 - Max * 9, 90, Max * 9, MaxColor);
    DrawRect(X + 5, Y + 905 - Value * 9, 90, Value * 9, ActiveColor);
    DrawEmptyRect(X + 5, Y + 5, 90, 990, "#FFFFFF", 1);
    DrawEmptyRect(X + 5, Y + 905, 90, 1, "#FFFFFF", 1);
    DrawImageResize("Screen/MiniGame/FreeBondage/Image/" + Image + ".png", X + 10, Y + 910, 80, 80);
}

/**
 * Progresses the meters when an activity is done
 * @param {number} Value - The current arousal or stress value
 * @param {number} Progress - The current progress factor
 * @param {number} Factor - The factor of progress
 * @returns {number} - The new factor to return
 */
function MiniGameFreeBondageMeterProgress(Value, Progress, Factor, Type) {
    if (Factor == null) return Progress;
    let NewFactor = Factor;
    for (let Z of MiniGameFreeBondageZone)
        if (MiniGameParameterGetBool(Z.Option, Z.Name)) {
            if ((Type == "Stress") && CommonIsNumeric(Z.Stress)) NewFactor = NewFactor * Z.Stress;
            if ((Type == "Arousal") && CommonIsNumeric(Z.Arousal)) NewFactor = NewFactor * Z.Arousal;
        }
    NewFactor = NewFactor - Value / 10;
    if ((Factor > 0) && (NewFactor < 0)) return Progress;
    if ((NewFactor > 0) && (Progress > 0) && (NewFactor < Progress)) return Progress;
    if ((NewFactor < 0) && (Progress < 0) && (NewFactor > Progress)) return Progress;
    return NewFactor;
}

/**
 * Shows a text dialog of the character reacting to the player
 * @param {string} Text - The text dialog to show
 * @param {boolean} Overwrite - If we must force overwrite the current value
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageStartDialog(Text, Overwrite) {
    if ((Text == null) || (Text == "")) return;
    if (!Overwrite && (MiniGameFreeBondageDialog != null) && (MiniGameFreeBondageDialog.FixTimer > CommonTime())) return;
    if (!Overwrite && (MiniGameFreeBondageDialog != null) && (Math.random() >= 0.7)) return;
    let Obj = {};
    Obj.Text = (Text.split("|")[Math.floor(Math.random() * Text.split("|").length)]);
    if (MiniGameParameterGetBool("InventoryPanelGag", "Mouth")) Obj.Text = SpeechTransformGagGarble(Obj.Text, 6); // Panel gag mumbling at 6
    if (MiniGameParameterGetBool("InventoryBallgag", "Mouth")) Obj.Text = SpeechTransformGagGarble(Obj.Text, 4); // Ball gag mumbling at 4
    Obj.Timer = CommonTime() + 4000;
    Obj.FixTimer = CommonTime() + 1000;
    MiniGameFreeBondageDialog = Obj;
}

/**
 * Draws the text dialog on the screen
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageDrawDialog() {
    if (MiniGameFreeBondageDialog == null) return;
    if (MiniGameFreeBondageDialog.Timer < CommonTime()) return MiniGameFreeBondageDialog = null;
    DrawRect(MiniGameFreeBondageDialogPosition.X, MiniGameFreeBondageDialogPosition.Y, MiniGameFreeBondageDialogPosition.W, MiniGameFreeBondageDialogPosition.H, "#000000A0");
    DrawEmptyRect(MiniGameFreeBondageDialogPosition.X - 1, MiniGameFreeBondageDialogPosition.Y - 1, MiniGameFreeBondageDialogPosition.W + 2, MiniGameFreeBondageDialogPosition.H + 2, "#FFFFFF", 1);
    DrawTextFit(MiniGameFreeBondageDialog.Text, MiniGameFreeBondageDialogPosition.X + MiniGameFreeBondageDialogPosition.W / 2, MiniGameFreeBondageDialogPosition.Y + MiniGameFreeBondageDialogPosition.H / 2, MiniGameFreeBondageDialogPosition.W - 10, "#FFFFFF", "#808080");
}

/**
 * Calculates the values of both the arousal and stress meters, drawing them on the screen
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageRunMeters() {
    if (MiniGameFreeBondageMeterTimer <= 0) MiniGameFreeBondageMeterTimer = CommonTime();
    let MS = CommonTime() - MiniGameFreeBondageMeterTimer;
    if (MS > 500) MS = 500;
    MiniGameFreeBondageStress = MiniGameFreeBondageStress + MiniGameFreeBondageStressProgress * MS / 1000;
    MiniGameFreeBondageArousal = MiniGameFreeBondageArousal + MiniGameFreeBondageArousalProgress * MS / 1000;
    if (MiniGameFreeBondageStress >= 100) MiniGameFreeBondageStress = 100;
    if (MiniGameFreeBondageStress < 0) MiniGameFreeBondageStress = 0;
    if (MiniGameFreeBondageArousal >= 100) MiniGameFreeBondageArousal = 100;
    if (MiniGameFreeBondageArousal < 0) MiniGameFreeBondageArousal = 0;
    if (MiniGameFreeBondageStress > MiniGameFreeBondageStressMax) {
        for (let Z of MiniGameFreeBondageStressZone)
            if ((Z.From < MiniGameFreeBondageStress) && (Z.From >= MiniGameFreeBondageStressMax))
                MiniGameFreeBondageStartDialog(Z.Dialog, true);
        MiniGameFreeBondageStressMax = MiniGameFreeBondageStress;
        MiniGameFreeBondageStressValue = 0;
        for (let Z of MiniGameFreeBondageStressZone)
            if ((Z.From < MiniGameFreeBondageStressMax) && (Z.To >= MiniGameFreeBondageStressMax))
                MiniGameFreeBondageStressValue = Z.Value;
    }
    if (MiniGameFreeBondageArousal > MiniGameFreeBondageArousalMax) {
        for (let Z of MiniGameFreeBondageArousalZone)
            if ((Z.From < MiniGameFreeBondageArousal) && (Z.From >= MiniGameFreeBondageArousalMax))
                MiniGameFreeBondageStartDialog(Z.Dialog, true);
        MiniGameFreeBondageArousalMax = MiniGameFreeBondageArousal;
        MiniGameFreeBondageArousalValue = 0;
        for (let Z of MiniGameFreeBondageArousalZone)
            if ((Z.From < MiniGameFreeBondageArousalMax) && (Z.To >= MiniGameFreeBondageArousalMax))
                MiniGameFreeBondageArousalValue = Z.Value;
    }
    MiniGameFreeBondageStressProgress = MiniGameFreeBondageStressProgress - MS / 500;
    MiniGameFreeBondageArousalProgress = MiniGameFreeBondageArousalProgress - MS / 500;
    if (MiniGameFreeBondageStressProgress < -2) MiniGameFreeBondageStressProgress = -2;
    if (MiniGameFreeBondageArousalProgress < -2) MiniGameFreeBondageArousalProgress = -2;
    MiniGameFreeBondageMeterTimer = CommonTime();
    if (MiniGameFreeBondageStressZone.length == 0) {
        MiniGameFreeBondageDrawMeterLarge(0, 0, MiniGameFreeBondageArousal, MiniGameFreeBondageArousalMax, "Arousal" + MiniGameFreeBondageArousalValue.toString(), "#FF8080C0", "#FF808080", MiniGameFreeBondageArousalZone);
    } else {
        MiniGameFreeBondageDrawMeterSmall(0, 0, MiniGameFreeBondageStress, MiniGameFreeBondageStressMax, "Stress" + MiniGameFreeBondageStressValue.toString(), "#8080FFC0", "#8080FF80", MiniGameFreeBondageStressZone);
        MiniGameFreeBondageDrawMeterSmall(0, 500, MiniGameFreeBondageArousal, MiniGameFreeBondageArousalMax, "Arousal" + MiniGameFreeBondageArousalValue.toString(), "#FF8080C0", "#FF808080", MiniGameFreeBondageArousalZone);
    }
}

/**
 * Jumps to another stage in the scenario, tries to keep the last selection if possible
 * @param {string} Stage - The name of the next stage
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageNextStage(Stage) {
    let LastSelection = MiniGameFreeBondageOptionSelected;
    if ((Stage != null) && (Stage !== "")) MiniGameStage = Stage;
    MiniGameFreeBondageBuild("Screen/MiniGame/FreeBondage/" + MiniGameFreeBondageScene + ".csv");
    for (let Menu of MiniGameFreeBondageMenu)
        if (Menu.Option === LastSelection)
            MiniGameFreeBondageOptionSelected = LastSelection;
}

/**
 * Draws the free bondage mini-game
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageDraw() {
    MiniGameFreeBondageDrawBackground();
    MiniGameFreeBondageOptionFocus = "";
    if ((MiniGameFreeBondageOptionSelected != "") && !CommonIsMobile && MouseIn(100, 0, 1400, 1000))
        DrawImageResize("Screen/MiniGame/FreeBondage/Image/" + MiniGameFreeBondageOptionSelected + ".png", MouseX - 40, MouseY - 40, 80, 80);
    for (let Z of MiniGameFreeBondageZone)
        if (Z.Option === MiniGameFreeBondageOptionSelected)
            DrawEmptyRect(Z.X, Z.Y, Z.W, Z.H, (MouseIn(Z.X, Z.Y, Z.W, Z.H) && !CommonIsMobile ? "#FF808080" : "#80FF8080"), 2);
    MiniGameFreeBondageDrawMenu(1500, MiniGameFreeBondageMenu);
    MiniGameFreeBondageRunMeters();
    MiniGameFreeBondageDrawDialog();
}

/**
 * Handles the clicks in the free bondage mini-game
 * @returns {void} - Nothing
 */
function MiniGameFreeBondageClick() {

    // In mobile mode, we keep the focused option by drawing
    if (CommonIsMobile) MiniGameFreeBondageDrawMenu(1500, MiniGameFreeBondageMenu);

    // If we must leave
    if (MiniGameFreeBondageOptionFocus === "Exit") {
        MiniGameCurrent = "";
        return;
    }

    // If we must go to the next 10 menu options
    if (MiniGameFreeBondageOptionFocus === "MenuNext") {
        MiniGameFreeBondageMenuOffset = MiniGameFreeBondageMenuOffset + 10;
        if (MiniGameFreeBondageMenuOffset >= MiniGameFreeBondageMenu.length) MiniGameFreeBondageMenuOffset = 0;
        MiniGameFreeBondageOptionSelected = "";
        return;
    }

    // If we must try to remove an inventory item
    if ((MiniGameFreeBondageOptionSelected === "Remove") && (MiniGameFreeBondageOptionFocus === "")) {
        for (let Z of MiniGameFreeBondageZone)
            if (MouseIn(Z.X, Z.Y, Z.W, Z.H) && MiniGameParameterGetBool(Z.Option, Z.Name) && (Z.Dialog != "NO REMOVE")) {
                MiniGameParameterSet(Z.Option, Z.Name, "");
                MiniGameFreeBondageNextStage(Z.NextStage);
                return;
            }
        return;
    }

    // If we must try to add an inventory item
    if (MiniGameFreeBondageOptionFocus === "") {
        for (let Z of MiniGameFreeBondageZone)
            if (Z.Option === MiniGameFreeBondageOptionSelected)
                if (MouseIn(Z.X, Z.Y, Z.W, Z.H)) {
                    if ((Z.Name != "Activity") && MiniGameParameterGetBool(Z.Option, Z.Name)) return;
                    if (Z.Name != "Activity") MiniGameParameterSet(Z.Option, Z.Name, "true");
                    MiniGameFreeBondageBlinkSet(Z.Blink);
                    MiniGameFreeBondageBlushSet(Z.Blush);
                    MiniGameFreeBondageStartDialog(Z.Dialog, false);
                    if (Z.Name == "Activity") {
                        MiniGameFreeBondageStressProgress = MiniGameFreeBondageMeterProgress(MiniGameFreeBondageStress, MiniGameFreeBondageStressProgress, Z.Stress, "Stress");
                        MiniGameFreeBondageArousalProgress = MiniGameFreeBondageMeterProgress(MiniGameFreeBondageArousal, MiniGameFreeBondageArousalProgress, Z.Arousal, "Arousal");
                    }
                    MiniGameFreeBondageNextStage(Z.NextStage);
                }
        return;
    }

	// If there's more than one option, the user must pick one
	if (MiniGameFreeBondageOptionFocus != "") {
        if (MiniGameFreeBondageOptionSelected === MiniGameFreeBondageOptionFocus) {
            MiniGameFreeBondageOptionSelected = "";
        } else {
            MiniGameFreeBondageOptionSelected = MiniGameFreeBondageOptionFocus;
            MiniGameFreeBondageStartDialog(MiniGameFreeBondageOptionFocusDialog, false);
        }
        return;
    }

}
