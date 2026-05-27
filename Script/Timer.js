"use strict";
var TimerCurrent = 0;
var TimerRunInterval = 20;
var TimerLastTime = 0;

/**
 * Returns the current time from the local computer clock
 * @returns {number} - Returns the number of milliseconds
 */
function TimerGetTime() {
	return new Date().getTime();
}

/**
 * Returns a string of the time remaining on a given timer
 * @param {number} T - Time to convert to a string in ms
 * @returns {string} - The time string in the DD:HH:MM:SS format (Days and hours not displayed if it contains none)
 */
function TimerToString(T) {
	var D = Math.floor(T / 86400000).toString();
	var H = Math.floor((T % 86400000) / 3600000).toString();
	var M = Math.floor((T % 3600000) / 60000).toString();
	var S = Math.floor((T % 60000) / 1000).toString();
	if (S.length == 1) S = "0" + S;
	if (M.length == 1) M = "0" + M;
	if (H.length == 1) H = "0" + H;
	return ((D != "0") ? D + ":" : "") + (((D != "0") || (H != "00")) ? H + ":" : "") + M + ":" + S;
}

/**
 * Returns a string in the format: yyyy/MM/dd hh:mm:ss
 * @param {number} T - Time to convert to a string in ms
 * @returns {string} - The formatted string
 */
function TimeToDateString(T) {
	var d = new Date(T);
	T = d.getFullYear() + "/" + ('0' + (d.getMonth() + 1)).slice(-2) + "/" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
	return T;
}

/**
 * Returns a string of the time remaining on a given timer (Hours and minutes only)
 * @param {Date} T - Time to convert to a string in ms
 * @returns {string} - The time string in the HH:MM format
 */
function TimerHourToString(T) {
	var M = T.getMinutes().toString();
	var H = T.getHours().toString();
	if (M.length == 1) M = "0" + M;
	return H + ":" + M;
}

/**
 * Main timer process
 * @returns {void} - Nothing
 */
function TimerProcess() {
}

/**
 * Returns a string of the time remaining on a given timer (Hours, minutes, seconds)
 * @param {number} s - Time in seconds to convert to a string in ms
 * @returns {string} -  The time string in the HH:MM:SS format
 */
function TimerMStoTime(s) {

	// Pad to 2 or 3 digits, default is 2
	function pad(n, z) {
		z = z || 2;
		return ('00' + n).slice(-z);
	}

	// Returns the formatted value
	var ms = s % 1000;
	s = (s - ms) / 1000;
	var secs = s % 60;
	s = (s - secs) / 60;
	var mins = s % 60;
	var hrs = (s - mins) / 60;
	return pad(hrs) + ':' + pad(mins) + ':' + pad(secs);

}
