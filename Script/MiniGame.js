"use strict";
var MiniGameCurrent = "";
var MiniGameBackground = "";
var MiniGameStage = "";
var MiniGameScore = 0;
var MiniGameProgress = 0;
var MiniGameLimit = 0;
var MiniGameParameter = [];
var MiniGameTimer = 0;
var MiniGameStarted = false;
var MiniGameEnded = false;
var MiniGameVictory = false;
var MiniGameDifficultyRatio = 1;
var MiniGameText = [];

/**
 * Gets a text label for the current minigame
 * @param {string} Field - The field to get the text for
 * @returns {void} - Nothing
 */
function MiniGameTextGet(Field) {
	if (MiniGameText.length == 0) return "";
	for (let T of MiniGameText)
		if (T.Field === Field)
			return T.Text;
	return "MISSING MINIGAME TEXT " + Field;
}

/**
 * Builds the mini game CSV text
 * @param {string} FullPath - The full path to get the file
 * @returns {void} - Nothing
 */
function MiniGameTextBuild(FullPath) {

	// Loops in the full dialog CSV file and loads those for the current game and background
	MiniGameText = [];
	for (let Line of CommonCSVCache[FullPath])
		if ((Line.length > 3) && (MiniGameCurrent === Line[0])) {

			// Builds an object for the text and adds it to the array to be used in game
			if ((Line[1] === "All") || (Line[1] === MiniGameBackground))
				MiniGameText.push({ Field: Line[2], Text: Line[3]});

		}

}

/**
 * Loads the mini game CSV text in memory
 * @returns {void} - Nothing
 */
function MiniGameTextLoad() {

	// If it's already in Cache, we load it from there
	const FullPath = "Screen/MiniGame/Text_MiniGame.csv";
	if (CommonCSVCache[FullPath]) {
		MiniGameTextBuild(FullPath);
		return;
	}

	// If not in cache, we load the CSV from the folder
	CommonGet(FullPath, function () {
		if (this.status == 200) {
			CommonCSVCache[FullPath] = CommonParseCSV(this.responseText);
			MiniGameTextBuild(FullPath);
		}
	});

}

/**
 * Sets a parameter for the mini-game execution
 * @param {string} Group - The parameter group 
 * @param {string} Name - The parameter name
 * @param {string} Value - The value of the param
 * @returns {void} - Nothing
 */
function MiniGameParameterSet(Group, Name, Value) {
	for (let Param of MiniGameParameter)
		if ((Param.Group === Group) && (Param.Name === Name)) {
			Param.Value = Value;
			return;
		}
	MiniGameParameter.push({ Group: Group, Name: Name, Value: Value });
}

/**
 * Gets a parameter from the current mini-game
 * @param {string} Group - The parameter group 
 * @param {string} Name - The parameter name
 * @returns {string} - The value of the parameter
 */
function MiniGameParameterGet(Group, Name) {
	for (let Param of MiniGameParameter)
		if ((Param.Group === Group) && (Param.Name === Name))
			return Param.Value;
	return null;
}

/**
 * Gets a parameter from the current mini-game and returns TRUE if it's set
 * @param {string} Group - The parameter group 
 * @param {string} Name - The parameter name
 * @returns {boolean} - TRUE if the parameters is set
 */
function MiniGameParameterGetBool(Group, Name) {
	for (let Param of MiniGameParameter)
		if ((Param.Group === Group) && (Param.Name === Name))
			return ((Param.Value != null) && (Param.Value != "") && (Param.Value != "false"));
	return false;
}

/**
 * Checks if a parameter name is set with a value
 * @param {string} Name - The parameter name
 * @returns {boolean} - TRUE if the parameters is set
 */
function MiniGameParameterNameIsSet(Name) {
	for (let Param of MiniGameParameter)
		if ((Param.Name === Name) && (Param.Value != null) && (Param.Value != "") && (Param.Value != "false"))
			return true;
	return false;
}

/**
 * Returns TRUE if a mini-game parameter as the supplied value
 * @param {string} Group - The parameter group 
 * @param {string} Name - The parameter name
 * @param {string} Value - The value to check
 * @returns {void} - Nothing
 */
function MiniGameParameterIs(Group, Name, Value) {
	for (let Param of MiniGameParameter)
		if ((Param.Group === Group) && (Param.Name === Name))
			return (Param.Value === Value);
	return false;
}

/**
 * Clears all mini-game parameters
 * @returns {void} - Nothing
 */
function MiniGameParameterClear() {
	MiniGameParameter = [];
	MiniGameFreeBondageStressMax = 0;
    MiniGameFreeBondageArousalMax = 0;
	MiniGameFreeBondageStressValue = 0;
	MiniGameFreeBondageArousalValue = 0;
}

/**
 * Starts a mini-game
 * @param {string} Name - The name of the mini-game to start
 * @param {string} Background - The background image of the game
 * @returns {void} - Nothing
 */
function MiniGameStart(Name, Background, Param) {
	MiniGameCurrent = Name;
	MiniGameBackground = Background;
	MiniGameStage = "";
	MiniGameScore = 0;
	MiniGameProgress = 0;
	MiniGameLimit = 0;
	MiniGameTextLoad();
	MiniGameParameterSet("MiniGame", "Launch", Param);
	CommonDynamicFunction("MiniGame" + Name + "Load()");
}

/**
 * Returns true if the Love factor of the current character is between two numbers
 * @param {string} From - The from value
 * @param {string} To - The to value
 * @returns {boolean} - Returns TRUE if in between
 */
function MiniGameResultBetween(From, To) {
	if (!CommonIsNumeric(From) || !CommonIsNumeric(To)) return false;	
	return (MiniGameScore >= parseInt(From)) && (MiniGameScore <= parseInt(To));
}
