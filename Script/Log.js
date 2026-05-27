"use strict";
var Log = [];

/**
 * Creates a new entry in the log
 * @param {string} GroupName - The group to log the data
 * @param {string} LogName - The name of the log entry
 * @param {number} Value - The value to log, 1 by default
 * @returns {void} - Nothing
 */
function LogAdd(GroupName, LogName, Value = 1) {

	// Do not add if it's already logged
	for (let L of Log)
		if ((L.Group === GroupName) && (L.Name === LogName)) {
			L.Value = Value;
			return;
		}

	// Creates the object to be added
	let L = { 
		Group: GroupName,
		Name: LogName,
		Value: Value
	};
	Log.push(L);

}

/**
 * Deletes an entry from the log
 * @param {string} GroupName - The group to log the data
 * @param {string} LogName - The name of the log entry
 * @returns {void} - Nothing
 */
function LogDelete(GroupName, LogName) {
	let Index = 0;
	for (let L of Log) {
		if ((L.Group === GroupName) && (L.Name === LogName)) {
			Log.splice(Index, 1);
			Index--;
		}
		Index++;
	}
}

/**
 * Returns TRUE if the entry is found in the log and if it's value is positive
 * @param {string} GroupName - The group to log the data
 * @param {string} LogName - The name of the log entry
 * @returns {boolean} - TRUE if the positive entry was found in the log
 */
function LogQuery(GroupName, LogName) {
	for (let L of Log)
		if ((L.Group === GroupName) && (L.Name === LogName) && (L.Value > 0))
			return true;
	return false;
}

/**
 * Returns the value of a current log for a group
 * @param {string} GroupName - The group to log the data
 * @param {string} LogName - The name of the log entry
 * @returns {number} - The value of the log or 0 if no entry
 */
function LogValue(GroupName, LogName) {
	let ReturnValue = 0;
	for (let L of Log)
		if ((L.Group === GroupName) && (L.Name === LogName) && (L.Value != null))
			ReturnValue = L.Value;
	return ReturnValue;
}
