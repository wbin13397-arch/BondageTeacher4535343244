"use strict";

/**
 * Loads the Boss House screen
 * @returns {void} - Nothing
 */
function BossHouseLoad() {
	CommonBackground = "Black";
	let Dom = LogValue("Evelyn", "Dominate");
	let Sub = LogValue("Evelyn", "Submit");
	if (Dom > 0) {
		DialogLoad("TeacherDominant" + ((Dom >= 2) ? "2" : Dom.toString())); // At 2 or more, this chapter loops
		LogAdd("Evelyn", "Dominate", Dom + 1);
	} else {
		if (Sub < 1) Sub = 1;
		DialogLoad("TeacherSubmissive" + ((Sub >= 3) ? "3" : Sub.toString())); // At 3 or more, this chapter loops
		LogAdd("Evelyn", "Submit", Sub + 1);
	}
}

/**
 * Runs & draws the Boss House screen
 * @returns {void} - Nothing
 */
function BossHouseRun() {
}

/**
 * Handles click events in the Boss House screen
 * @returns {void} - Nothing
 */
function BossHouseClick() {
}