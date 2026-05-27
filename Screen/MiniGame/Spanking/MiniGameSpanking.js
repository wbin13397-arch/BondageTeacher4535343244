"use strict";
var MiniGameSpankingAim = 0;
var MiniGameSpankingForce = 0;
var MiniGameSpankingResult = "";

/**
 * Builds the result of the spanking based on aim and force
 * @returns {void} - Nothing
 */
function MiniGameSpankingBuildResult() {
    let Dist = Math.sqrt((MiniGameSpankingAim - 250) * (MiniGameSpankingAim - 250) + (MiniGameSpankingForce - 250) * (MiniGameSpankingForce - 250));
    if (Dist <= 50) {
        MiniGameScore = MiniGameScore + 100;
        MiniGameSpankingResult = "Perfect";
    } else if (Dist <= 100) {
        MiniGameScore = MiniGameScore + 75;
        MiniGameSpankingResult = "Good";
    } else if (Dist <= 150) {
        MiniGameScore = MiniGameScore + 50;
        MiniGameSpankingResult = "Passable";
    } else if (Dist <= 200) {
        MiniGameScore = MiniGameScore + 25;
        MiniGameSpankingResult = "Clumsy";
    } else {
        MiniGameSpankingResult = "Failed";
    }
}

/**
 * Returns the spanking arrow position
 * @returns {void} - Nothing
 */
function MiniGameSpankingArrow() {
    let Pos = Math.round(CommonTime() % 1000);
    if (Pos >= 500) Pos = 1000 - Pos;
    return Pos;
}

/**
 * Loads the spanking mini-game
 * @returns {void} - Nothing
 */
function MiniGameSpankingLoad() {
    let Limit = MiniGameParameterGet("MiniGame", "Launch");
    MiniGameSpankingAim = 0;
    MiniGameSpankingForce = 0;
    MiniGameLimit = CommonIsNumeric(Limit) ? parseInt(Limit) : 5;
    MiniGameStage = "Intro";
    MiniGameSpankingResult = "";
}

/**
 * Draws the spanking mini-game
 * @returns {void} - Nothing
 */
function MiniGameSpankingDraw() {
    
	// Draws the background image
    DrawRect(0, 0, 999, 1000, "#000000");
    DrawRect(999, 0, 2, 1000, "#FFFFFF");
	DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Background/" + MiniGameBackground + MiniGameStage + ".jpg", 1000, 0, 1000, 1000);
	DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Image/Bullseye100.png", 250, 250, 500, 500);
    DrawText(MiniGameTextGet("Title") + " " + (MiniGameProgress + 1).toString() + " / " + MiniGameLimit.toString(), 500, 100, "White", "Silver");
    DrawText(MiniGameTextGet(MiniGameStage + MiniGameSpankingResult) + ((MiniGameStage == "Outro") ? " " + MiniGameScore.toString() + " %" : ""), 500, 900, "White", "Silver");
    if ((MiniGameStage == "Intro") || (MiniGameStage == "Outro")) return;

    // In aim mode, we have a horizontal cursor
    if (MiniGameStage == "Aim") {
        let Pos = MiniGameSpankingArrow();
        DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Image/ArrowDown.png", 225 + Pos, 200, 50, 50);
        DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Image/ArrowUp.png", 225 + Pos, 750, 50, 50);
        if (CheatActive()) {
            DrawEmptyRect(0, 920, 80, 80, "#FFFFFF", 1);
            if (!CommonIsMobile && MouseIn(1, 921, 78, 78)) DrawRect(1, 921, 78, 78, "#FFAACC");
            DrawImageResize("Image/Cheat/Bullseye.png", 1, 921, 78, 78);
        }
        return;
    }

    // Draw the aim result
    DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Image/ArrowDown.png", 225 + MiniGameSpankingAim, 200, 50, 50);
    DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Image/ArrowUp.png", 225 + MiniGameSpankingAim, 750, 50, 50);

    // In force mode, we have a vertical cursor
    if (MiniGameStage == "Force") {
        let Pos = MiniGameSpankingArrow();
        DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Image/ArrowRight.png", 200, 225 + Pos, 50, 50);
        DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Image/ArrowLeft.png", 750, 225 + Pos, 50, 50);
        if (CheatActive()) {
            DrawEmptyRect(0, 920, 80, 80, "#FFFFFF", 1);
            if (!CommonIsMobile && MouseIn(1, 921, 78, 78)) DrawRect(1, 921, 78, 78, "#FFAACC");
            DrawImageResize("Image/Cheat/Bullseye.png", 1, 921, 78, 78);
        }
        return;
    }

    // Draw the final result
    DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Image/ArrowRight.png", 200, 225 + MiniGameSpankingForce, 50, 50);
    DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Image/ArrowLeft.png", 750, 225 + MiniGameSpankingForce, 50, 50);
    DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Image/Crosshair.png", 225 + MiniGameSpankingAim, 225 + MiniGameSpankingForce, 50, 50);

}

/**
 * Handles the clicks in the spanking mini-game
 * @returns {void} - Nothing
 */
function MiniGameSpankingClick() {

    // In intro mode, we simply click to start
    if (MiniGameStage == "Intro") {
        MiniGameStage = "Aim";
        return;
    }

    // In aim mode, we keep the accuracy and jump to force
    if (MiniGameStage == "Aim") {
        if (CheatActive() && MouseIn(1, 921, 78, 78)) MiniGameSpankingAim = 250;
        else MiniGameSpankingAim = MiniGameSpankingArrow();
        MiniGameStage = "Force";
        return;
    }

    // In force mode, we keep the accuracy and jump to result
    if (MiniGameStage == "Force") {
        if (CheatActive() && MouseIn(1, 921, 78, 78)) MiniGameSpankingForce = 250;
        else MiniGameSpankingForce = MiniGameSpankingArrow();
        MiniGameStage = "Result";
        MiniGameSpankingBuildResult();
        return;
    }

    // In result mode, we add the score and restart the game until the limit is reached
    if (MiniGameStage == "Result") {
        MiniGameProgress++;
        MiniGameSpankingResult = "";
        if (MiniGameProgress >= MiniGameLimit) {
            MiniGameScore = Math.round(MiniGameScore / MiniGameProgress);
            MiniGameStage = "Outro";
            MiniGameSpankingResult = "";
            MiniGameProgress--;
        } else MiniGameStage = "Aim";
        return;
    }

    // In outro, we allow one last click
    if (MiniGameStage == "Outro") {
        MiniGameCurrent = "";
        return;
    }

}
