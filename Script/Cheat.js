"use strict";
var CheatAllow = false;
var CheatBrowserName = "";
var CheatBrowserVersion = "";
var CheatBrowserTime = 0;
var CheatDialogButton = ["Love", "Hate", "Domination", "Submission", "Picture", "Back"];

/**
 * Checks if the cheat is currently active
 * @returns {boolean} - Returns TRUE if the cheat is currently active
 */
function CheatActive() {
	var BI = CommonGetBrowser();
	var Time = CommonTime();
	CheatAllow = (CheatAllow && (BI.Name == CheatBrowserName) && (BI.Version == CheatBrowserVersion) && (Time >= CheatBrowserTime) && (Time <= CheatBrowserTime + 864000000));
	return CheatAllow;
}

/**
 * Activates the cheat engine before the game is loaded
 * @returns {void} - Nothing
 */
function CheatImport() {
	if (DrawMainCanvas == null) {
        console.log("Cheats activated");
		CheatAllow = true;
		var BI = CommonGetBrowser();
		CheatBrowserName = BI.Name;
		CheatBrowserVersion = BI.Version;
		CheatBrowserTime = CommonTime();
	}
}

/**
 * Runs a dialog cheat 
 * @param {string} Cheat - The cheat to run
 * @returns {void} - Nothing
 */
function CheatDialogRun(Cheat) {
    if (Cheat == "Love") {
        CharacterAlterMeter(DialogCharacter, 1, 0);
        DialogLoadStage(DialogStage);
        return;
    }
    if (Cheat == "Hate") {
        CharacterAlterMeter(DialogCharacter, -1, 0);
        DialogLoadStage(DialogStage);
        return;
    }
    if (Cheat == "Domination") {
        CharacterAlterMeter(DialogCharacter, 0, 1);
        DialogLoadStage(DialogStage);
        return;
    }
    if (Cheat == "Submission") {
        CharacterAlterMeter(DialogCharacter, 0, -1);
        DialogLoadStage(DialogStage);
        return;
    }
    if (Cheat == "Picture") return PictureAdd();
    if (Cheat == "Back") {
        if (DialogPath.length >= 2) {
            let Prev = CommonCloneDeep(DialogPath[DialogPath.length - 2]);
            DialogPath.splice(-2);
            DialogCharacter = CharacterGet(Prev.Character);
            DialogCharacterPortrait = Prev.Portrait;
            DialogBackground = Prev.Background;
            DialogLoadStage(Prev.Stage);
        }
        return;
    }
}

/**
 * Draws the cheat buttons & secret squares in the dialog screen
 * @returns {void} - Nothing
 */
function CheatDialogDraw() {
    if (!CheatActive() || (DialogCharacter == null)) return;
    if ((DialogText == null) || (DialogText == "")) return;
    for (let C = 0; C < CheatDialogButton.length; C++) {
        let X = 2000 - (CheatDialogButton.length * 80) + (C * 80);
        DrawEmptyRect(X, 800, 80, 80, "#FFFFFF", 1);
        if (MouseIn(X + 1, 801, 78, 78) && !CommonIsMobile) DrawRect(X + 1, 801, 78, 78, "#FFAACC");
        DrawImageResize("Image/Cheat/" + CheatDialogButton[C] + ".png", X + 1, 801, 78, 78);
    }
	for (let S of DialogSecret) {
        DrawRect(S.Left, S.Top, S.Width, S.Height, (MouseIn(S.Left, S.Top, S.Width, S.Height) && !CommonIsMobile) ? "#FFAACCA0" : "#000000A0");
        DrawEmptyRect(S.Left, S.Top, S.Width, S.Height, "#FFFFFF", 2);
    }
}

/**
 * Handles the cheat clicks in the dialog screen
 * @returns {boolean} - Returns TRUE if the click is handled by the cheat screen
 */
function CheatDialogClick() {
    if (!CheatActive() || (DialogCharacter == null)) return false;
    if ((DialogText == null) || (DialogText == "")) return;
    for (let C = 0; C < CheatDialogButton.length; C++) {
        let X = 2000 - (CheatDialogButton.length * 80) + (C * 80);
        if (MouseIn(X + 1, 801, 78, 78)) {
            CheatDialogRun(CheatDialogButton[C]);
            return true;
        }        
    }
    return false;
}