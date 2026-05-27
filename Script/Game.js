"use strict";

/** Game version */
const GameVersion = "Release 23 Alpha 1";
const GameVersionFormat = /^Release ([0-9]+) (?:(Alpha|Beta) ([0-9]+)?)?$/;
const GameDefaultFrameRate = 60;

/** @type {number | null} */
let GameAnimationFrameId = null;
/** @type {Worker | null} */
let GameMouseIsDown = false;

/**
 * Starts the main game engine
 * @returns {void}
 */
function GameStart() {

	// Logs the release version
	console.log("Bondage Teacher, Version: " + GameVersion);
	if (!GameVersionFormat.test(GameVersion)) console.error("GameVersion is not valid!");

	// Loads the drawing engine and intro screen
	TimerCurrent = CommonTime();
	CommonIsMobile = CommonDetectMobile();
	TranslationLoad();
	DrawLoad();
	CommonSetScreen("Intro", "Warning");

	// Adds all keyboard, touch and mouse events
	const canvas = document.getElementById("MainCanvas");
	canvas.tabIndex = 1000;
	document.addEventListener("keydown", (e) => GameKeyDown(e));
	canvas.addEventListener("keydown", (e) => GameKeyDown(e));
	canvas.addEventListener("keyup", (e) => GameKeyUp(e));
	canvas.addEventListener("mousedown", (e) => GameMouseDown(e));
	canvas.addEventListener("mouseup", (e) => GameMouseUp(e));
	canvas.addEventListener("mousemove", (e) => GameMouseMove(e));
	canvas.addEventListener("wheel", (e) => GameMouseWheel(e));
	canvas.addEventListener("mouseleave", (e) => GameMouseLeave(e));
	canvas.addEventListener("touchstart", (e) => GameTouchStart(e));
	canvas.addEventListener("touchmove", (e) => GameTouchMove(e));
	canvas.addEventListener("touchend", (e) => GameTouchEnd(e));

	// Starts the first animation frame, GameRun will handle the rest
	GameAnimationFrameId = requestAnimationFrame(GameRun);

}

// When the everything is loaded, we start the game engine
window.addEventListener("load", GameStart);

/**
 * Game engine error handiling
 * @returns {void}
 */
function GameHandleError() {
	if (GameAnimationFrameId != null) {
		cancelAnimationFrame(GameAnimationFrameId);
		GameAnimationFrameId = null;
	}
}

/**
 * Periodically called in the background with low frequency, so the game doesn't freeze, even if the user switches to a different tab.
 * @returns {void}
 */
function GameFallbackTimer() {
	let Timestamp = performance.now();
	if (Timestamp - TimerLastTime > 500)
		GameRunBackground(Timestamp);
}

/**
 * Main game running state, runs the drawing
 * @param {number} Timestamp
 */
function GameRun(Timestamp) {

	/** @type {(ms: number) => number} */
	const EstimateFrameDuration = (ms) => (1000 / ms) | 0;

	try {

		// Clear the Frame ID
		GameAnimationFrameId = null;

		// Default to 1 FPS when tabbed outside the game, make sure we don't go over 60 FPS
		if ((TimerLastTime > 0) && (Timestamp > 0) && (TimerLastTime + EstimateFrameDuration(document.hasFocus() ? GameDefaultFrameRate : 1) > Timestamp)) {
			GameAnimationFrameId = requestAnimationFrame(GameRun);
			return;
		}

		// Increments the time from the last frame
		TimerRunInterval = Timestamp - TimerLastTime;
		TimerLastTime = Timestamp;
		TimerCurrent = TimerCurrent + TimerRunInterval;

		// Draw the frame
		DrawProcess(Timestamp);
		TimerProcess();

		// Call GameRun again on the next frame
		GameAnimationFrameId = requestAnimationFrame(GameRun);

		// Show the FPS rate
		/*if (Timestamp > 0) {
			let frameTime = Timestamp - TimerLastTime;
			DrawTextFit((Math.round(10000 / frameTime) / 10).toString(), 15, 12, 30, "white", "black");
		}*/

	} catch (e) {

		// Error management
		GameHandleError();
		throw e;

	}

}

/**
 * Main game running state, when in the background. Skips drawing if possible.
 * @param {number} Timestamp
 */
function GameRunBackground(Timestamp) {

	try {

		// Increments the time from the last frame
		TimerRunInterval = Timestamp - TimerLastTime;
		TimerLastTime = Timestamp;
		TimerCurrent = TimerCurrent + TimerRunInterval;

		// Runs the current screen if no dialog is open
		if (CurrentCharacter == null) CommonScreenFunctions.Run(Timestamp);
		TimerProcess();

	} catch (e) {
		GameHandleError();
		throw e;
	}

}

/**
 * When the user presses a key, we send the KeyDown event to the current screen if it can accept it
 * @param {KeyboardEvent} Event
 */
function GameKeyDown(Event) {

	// Gets the key pressed
	CommonKeyPress = Event.keyCode || Event.which;
	let Handled = false;

	// Dialog keys first
	if (DialogKeyDown(Event)) {
		Handled = true;
	} else {

		// Screen keys next
		if (CommonScreenFunctions.KeyDown && CommonScreenFunctions.KeyDown(Event)) {
			Handled = true;
		}

	}

	// If handled, we prevent further code
	if (Handled) {
		Event.preventDefault();
		Event.stopImmediatePropagation();
	}
	return Handled;

}

/**
 * When the keyboard key is up
 * @param {KeyboardEvent} Event
 */
function GameKeyUp(Event) {
	if (CommonScreenFunctions.KeyUp)
		CommonScreenFunctions.KeyUp(Event);
}

/**
 * If the user presses the mouse button, we fire the mousedown event for other screens
 * @param {MouseEvent} Event
 */
function GameMouseDown(Event) {
	if (CommonIsMobile) return;
	if (GameMouseIsDown) return;
	if (CommonScreenFunctions.MouseDown) CommonScreenFunctions.MouseDown(event);
	GameMouseIsDown = true;
}

/**
 * If the user releases the mouse button, we fire the mouseup and click events for other screens
 * @param {MouseEvent} Event
 */
function GameMouseUp(Event) {
	if (CommonIsMobile) return;
	if (!GameMouseIsDown) return;
	GameMouseMove(Event, false);
	if (CommonScreenFunctions.MouseUp) CommonScreenFunctions.MouseUp(event);
	if (DialogIsActive()) DialogClick();
	else CommonScreenFunctions.Click(event);
	GameMouseIsDown = false;
}

/**
 * If the user rolls the mouse wheel, we fire the mousewheel event for other screens
 * @type {ScreenFunctions["MouseWheel"]}
 */
function GameMouseWheel(Event) {
	if (CommonIsMobile) return;
	if (DialogIsActive()) DialogMouseWheel(event);
	else if (CommonScreenFunctions.MouseWheel) CommonScreenFunctions.MouseWheel(event);
}

/**
 * If the user moves the mouse mouse, we keep the mouse position for other scripts and fire the mousemove event for other screens
 * @param {MouseEvent} Event
 */
function GameMouseMove(Event) {
	MouseX = Math.round(Event.offsetX * 2000 / DrawMainCanvas.canvas.clientWidth);
	MouseY = Math.round(Event.offsetY * 1000 / DrawMainCanvas.canvas.clientHeight);
	if (CommonScreenFunctions.MouseMove) CommonScreenFunctions.MouseMove(event);
}

/**
 * If the user starts touching the screen (mobile only), we fire the mousedown and click events for other screens
 * @param {TouchEvent} Event
 */
function GameTouchStart(Event) {
	if (!CommonIsMobile) return;
	if (GameMouseIsDown) return;
	GameTouchMove(Event, false);
	if (DialogIsActive()) DialogClick(event);
	else {
		if (CommonScreenFunctions.MouseDown) CommonScreenFunctions.MouseDown(event);
		if (CommonScreenFunctions.Click) CommonScreenFunctions.Click(event);
	}
	GameMouseIsDown = true;
	CommonTouchList = Event.touches;
}

/**
 * If the user stops touching the screen (mobile only), we fire the mouseup event for other screens
 * @param {TouchEvent} Event
 */
function GameTouchEnd(Event) {
	if (!CommonIsMobile) return;
	if (!GameMouseIsDown) return;
	if (CommonScreenFunctions.MouseUp) CommonScreenFunctions.MouseUp(event);
	GameMouseIsDown = false;
	CommonTouchList = Event.touches;
}

/**
 * if the user moves the touch, we keep the mouse position for other scripts and fire the mousemove event for other screens
 * @param {TouchEvent} Event
 */
function GameTouchMove(Event, ForwardToScreen = true) {
	if (!CommonIsMobile) return;
	const Touch = Event.changedTouches[0];
	MouseX = Math.round((Touch.clientX - DrawMainCanvas.canvas.offsetLeft) * 2000 / DrawMainCanvas.canvas.clientWidth);
	MouseY = Math.round((Touch.clientY - DrawMainCanvas.canvas.offsetTop) * 1000 / DrawMainCanvas.canvas.clientHeight);
	if (CommonScreenFunctions.MouseMove) CommonScreenFunctions.MouseMove(event);
}

/**
 * When the mouse is away from the control, we stop keeping the coordinates,
 * we also check for false positives with "relatedTarget"
 * @param {MouseEvent} Event
 */
function GameMouseLeave(Event) {
	if (Event.relatedTarget) {
		MouseX = -1;
		MouseY = -1;
	}
}