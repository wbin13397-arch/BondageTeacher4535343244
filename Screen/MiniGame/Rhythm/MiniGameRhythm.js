"use strict";
var MiniGameRhythmMaxSequence = 1000;
/** @type {{ Type: number, Time: number, FadeAt: number? }[]} */
var MiniGameRhythmMove = [];
var MiniGameRhythmLastMoveType = -1;
var MiniGameRhythmLastMoveTypeTimer = -1;
var MiniGameRhythmHitCount = 0;
var MiniGameRhythmMissCount = 0;

// The game is played using the S, D, K & L keys
var MiniGameRhythmKeys = ["S", "D", "K", "L"];

/**
 * Generates a full sequence of keys to press
 * @param {number} StartTime - Start time of the sequence
 */
function MiniGameRhythmGenerateMove(StartTime) {

	// Full the sequence
	var CurTimer = StartTime + 3500;
	var Seq = 0;
	MiniGameRhythmMove = [];
	while (Seq < MiniGameRhythmMaxSequence) {

		// Create a new move to do at a random position
		MiniGameRhythmMove[MiniGameRhythmMove.length] = { Type: Math.floor(Math.random() * 4), Time: CurTimer, FadeAt: null };
		CurTimer = CurTimer + Math.floor(Math.random() * 800) + 400;
		Seq++;

	}

}

/**
 * Loads the mini-game to start it
 * @returns {void} - Nothing
 */
function MiniGameRhythmLoad() {
	MiniGameProgress = 50;
	MiniGameStarted = false;
	MiniGameEnded = false;
	MiniGameTimer = 0;
	MiniGameRhythmHitCount = 0;
	MiniGameRhythmMissCount = 0;
	MiniGameRhythmGenerateMove(0);
	MiniGameDifficultyRatio = 0.75;
	if (MiniGameParameterIs("Rhythm", "Difficulty", "1")) MiniGameDifficultyRatio = 1.25;
	if (MiniGameParameterIs("Rhythm", "Difficulty", "2")) MiniGameDifficultyRatio = 1.75;
	if (MiniGameParameterIs("Rhythm", "Difficulty", "3")) MiniGameDifficultyRatio = 2.5;
}

/**
 * Draws the icons for the mini-game
 * @returns {void} - Nothing
 */
function MiniGameRhythmDrawIcons() {

	// Scroll the icons with time
	var Seq = 0;
	while (Seq < MiniGameRhythmMove.length) {

		// Draw the move from 3.5 seconds before to 1 second after
		if (MiniGameRhythmMove[Seq].Time <= MiniGameTimer + 3500) {
			const X = 1220 + (MiniGameRhythmMove[Seq].Type * 200);
			const Y = 675 + Math.floor((MiniGameTimer - MiniGameRhythmMove[Seq].Time) / 4);
			const Alpha = MiniGameRhythmMove[Seq].FadeAt == null ? 1.0 : 1.0 - (MiniGameTimer - MiniGameRhythmMove[Seq].FadeAt) / 200;
			const Width = 160;
			const Height = 120;
			DrawImageEx("Screen/MiniGame/" + MiniGameCurrent + "/" + MiniGameBackground + "/Icon" + MiniGameRhythmMove[Seq].Type.toString() + ".png", DrawMainCanvas, X, Y, { Alpha, Width, Height });
		}

		// Remove the move from the sequence if it's past due
		if (MiniGameRhythmMove[Seq].FadeAt == null && MiniGameRhythmMove[Seq].Time < MiniGameTimer - 800) {
			MiniGameRhythmMove[Seq].FadeAt = MiniGameTimer;
			MiniGameRhythmMiss();
		}

		if (MiniGameRhythmMove[Seq].FadeAt != null && MiniGameTimer - MiniGameRhythmMove[Seq].FadeAt >= 200)
			MiniGameRhythmMove.splice(Seq, 1);
		else Seq = Seq + 1;

		// Beyond 3.5 seconds forward, we exit
		if (Seq < MiniGameRhythmMove.length)
			if (MiniGameRhythmMove[Seq].Time > MiniGameTimer + 3500)
				return;

	}

}

/**
 * Draws the bars to tell when the moves will hit
 * @param {number} SquareType - Type of the bar to draw (0 to 3)
 * @returns {void} - Nothing
 */
function MiniGameRhythmDrawBar(SquareType) {

	// The color changes when it's clicked or pressed
	DrawRect(1210 + (SquareType * 200), 750, 180, 50, "White");
	if ((MiniGameRhythmLastMoveType == SquareType) && (MiniGameRhythmLastMoveTypeTimer >= MiniGameTimer))
		DrawRect(1212 + (SquareType * 200), 752, 176, 46, "#66FF66");
	else
		DrawRect(1212 + (SquareType * 200), 752, 176, 46, "Red");
	if (!CommonIsMobile) DrawText(MiniGameRhythmKeys[SquareType], 1300 + (SquareType * 200), 775, "white");

}

/**
 * Runs and draws the maid drinks mini game
 * @returns {void} - Nothing
 */
function MiniGameRhythmDraw() {

	// Draw the background
	let Img = (Math.ceil(MiniGameProgress / 20)).toString();
	if (MiniGameProgress == 100) Img = (MiniGameScore >= 100) ? "Perfect" : "Victory"
	DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/" + MiniGameBackground + "/Background" + Img + ".jpg", 0, 0, 2000, 1000);
	DrawRect(1200, 0, 800, 1000, "#000000A0");

	// Increments the timer (altered by the difficulty, the more difficult, the faster it goes)
	if (MiniGameStarted) MiniGameTimer = MiniGameTimer + Math.round(TimerRunInterval * MiniGameDifficultyRatio);

	// Draw the mini game icons and rectangles
	MiniGameRhythmDrawBar(0);
	MiniGameRhythmDrawBar(1);
	MiniGameRhythmDrawBar(2);
	MiniGameRhythmDrawBar(3);

	// If there's no moves left, we full the move list again, there's no tie match
	if ((MiniGameRhythmMove.length == 0) && (!MiniGameEnded))
		MiniGameRhythmGenerateMove(MiniGameTimer);

	// Draw the UI
	if (MiniGameStarted && !MiniGameEnded) {
		MiniGameRhythmDrawIcons();
		DrawProgressBar(1200, 975, 800, 25, MiniGameProgress);
		if (MiniGameRhythmHitCount + MiniGameRhythmMissCount > 0) DrawText(MiniGameScore.toString() + "%", 1600, 960, "white");
	} else if (!MiniGameStarted) {
		DrawText(MiniGameTextGet("Difficulty" + MiniGameParameterGet("Rhythm", "Difficulty")), 1600, 870, "white");
		DrawText(MiniGameTextGet(CommonIsMobile ? "StartMobile" : "Start"), 1600, 940, "white");
	} else {
		if (MiniGameProgress >= 100) DrawText(MiniGameTextGet((MiniGameScore >= 100) ? "Perfect" : "Victory"), 1600, 150, "white");
		else if (MiniGameProgress <= 0) DrawText(MiniGameTextGet("Defeat"), 1600, 150, "white");
		DrawText(MiniGameTextGet("Accuracy") + " " + MiniGameScore.toString() + "%", 1600, 300, "white");
		DrawText(MiniGameTextGet("ClickContinue"), 1600, 450, "white");
	}

	// Draws the cheat button in the bottom left
	if (CheatActive()) {
		DrawEmptyRect(0, 920, 80, 80, "#FFFFFF", 1);
		if (!CommonIsMobile && MouseIn(1, 921, 78, 78)) DrawRect(1, 921, 78, 78, "#FFAACC");
		DrawImageResize("Image/Cheat/Star.png", 1, 921, 78, 78);
	}

}

/**
 * Ends the maid drinks mini game and sends the result back to the screen
 * @param {boolean} Victory - Whether or not the player one the mini game
 * @returns {void} - Nothing
 */
function MiniGameRhythmEnd(Victory) {
	MiniGameRhythmLastMoveType = -1;
	if (Victory) MiniGameProgress = 100;
	else MiniGameProgress = 0;
	MiniGameVictory = Victory;
	MiniGameEnded = true;
}

/**
 * Sets the accuracy ratio
 * @returns {void} - Nothing
 */
function MiniGameRhythmSetAccuracy() {
	MiniGameScore = 100;
	if (MiniGameRhythmHitCount + MiniGameRhythmMissCount <= 0) return;
	MiniGameScore = Math.floor(MiniGameRhythmHitCount / (MiniGameRhythmHitCount + MiniGameRhythmMissCount) * 100);
	if (MiniGameScore < 0) MiniGameScore = 0;
	if (MiniGameScore > 100) MiniGameScore = 100;
}

/**
 * Used when the player hits, at 100 progress the player wins and the game ends
 * @returns {void} - Nothing
 */
function MiniGameRhythmHit() {
	MiniGameRhythmHitCount++;
	MiniGameRhythmSetAccuracy();
	MiniGameProgress = MiniGameProgress + 1;
	if (MiniGameProgress >= 100)
		MiniGameRhythmEnd(true);
}

/**
 * Used when the player misses, the penalty is bigger on higher difficulties. When below zero progress, the player fails the mini game.
 * @returns {void} - Nothing
 */
function MiniGameRhythmMiss() {
	MiniGameRhythmMissCount++;
	MiniGameRhythmSetAccuracy();
	MiniGameProgress = MiniGameProgress - 2;
	if (MiniGameParameterIs("Rhythm", "Difficulty", "1")) MiniGameProgress = MiniGameProgress - 3;
	if (MiniGameParameterIs("Rhythm", "Difficulty", "2")) MiniGameProgress = MiniGameProgress - 4;
	if (MiniGameParameterIs("Rhythm", "Difficulty", "3")) MiniGameProgress = MiniGameProgress - 5;
	if (MiniGameProgress <= 0) MiniGameRhythmEnd(false);
}

/**
 * Used when the player tries to do a specific move type
 * @param {number} MoveType - Type of move made by the player
 * @returns {void} - Nothing
 */
function MiniGameRhythmDoMove(MoveType) {

	// Below zero is always a miss
	var Hit = false;
	if ((MoveType >= 0) && (MiniGameRhythmMove.length > 0)) {

		// For each moves in the list
		var Seq = 0;
		while (Seq < MiniGameRhythmMove.length) {

			// If the move connects (good timing and good type)
			if (!Hit && (MiniGameRhythmMove[Seq].FadeAt == null) && (MiniGameRhythmMove[Seq].Time <= MiniGameTimer + 300) && (MiniGameRhythmMove[Seq].Time >= MiniGameTimer - 400) && (MoveType == MiniGameRhythmMove[Seq].Type)) {
				MiniGameRhythmMove[Seq].FadeAt = MiniGameTimer;
				Hit = true;
			}
			Seq++;

			// Beyond the hit range, we give up
			if ((Seq < MiniGameRhythmMove.length) && (MiniGameRhythmMove[Seq].Time > MiniGameTimer + 300))
				Seq = MiniGameRhythmMove.length;

		}

	}

	// Depending on hit or miss, we change the progress of the mini game
	MiniGameRhythmLastMoveType = MoveType;
	MiniGameRhythmLastMoveTypeTimer = MiniGameTimer + 200;
	if (Hit) MiniGameRhythmHit();
	else MiniGameRhythmMiss();

}

/**
 * Handles key presses during the maid drinks mini game. (Both keyboard and mobile)
 * @type {KeyboardEventListener}
 */
function MiniGameRhythmKeyDown(event) {
	if (event.repeat) return false;

	if (!MiniGameStarted) {
		MiniGameStarted = true;
		MiniGameProgress = 50;
		return true;
	}
	// If the game has started, we check the key pressed and send it as a move
	else if (!MiniGameEnded) {
		const MoveType = MiniGameRhythmKeys.findIndex(k => k === event.key.toUpperCase());
		MiniGameRhythmDoMove(MoveType);
		return true;
	}
	return false;
}

/**
 * Handles clicks during the maid drinks mini game (only on mobile, to replace the keyboard)
 * @returns {void} - Nothing
 */
function MiniGameRhythmClick() {

	// If the game is over, clicking on the image will end it
	if (MiniGameEnded && MouseIn(100, 0, 1000, 1000)) {
		if (MiniGameVictory && (MiniGameScore < 75)) MiniGameScore = 75;
		if (!MiniGameVictory && (MiniGameScore >= 75)) MiniGameScore = 74;
        MiniGameCurrent = "";
        return;
	}

	// In cheat mode, we clear 2 seconds of possible hits in success
	if (MiniGameStarted && !MiniGameEnded && CheatActive() && MouseIn(1, 921, 78, 78)) {
		let Seq = 0;
		while (Seq < MiniGameRhythmMove.length) {
			const Y = 675 + Math.floor((MiniGameTimer - MiniGameRhythmMove[Seq].Time) / 4);
			if ((MiniGameRhythmMove[Seq].FadeAt == null) && (Y >= -100) && (MiniGameRhythmMove[Seq].Time >= MiniGameTimer - 400)) {
				MiniGameRhythmMove[Seq].FadeAt = MiniGameTimer;
				MiniGameRhythmHit();
			}
			Seq++;
		}
	}

	// Only use mouse clicks on mobile
	if (!CommonIsMobile) return;

	if (!MiniGameStarted) {
		MiniGameStarted = true;
		MiniGameProgress = 50;
	}
	// If the game has started, we check the click position and send it as a move
	else if (!MiniGameEnded) {
		var MoveType = -1;
		if (MouseIn(1200, 700, 200, 150)) MoveType = 0;
		if (MouseIn(1400, 700, 200, 150)) MoveType = 1;
		if (MouseIn(1600, 700, 200, 150)) MoveType = 2;
		if (MouseIn(1800, 700, 200, 150)) MoveType = 3;
		MiniGameRhythmDoMove(MoveType);
	}

}