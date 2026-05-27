"use strict";
var TranslationLanguage = "EN";
/** @type {Record<string, string[]>} */
var TranslationCache = {};

/**
 * Dictionary for all supported languages and their files
 * @constant
 */
var TranslationDictionary = [

	{
		LanguageCode: "EN",
		LanguageName: "English",
		EnglishName: "English",
		Files: [
		]
	},
/*	{
		LanguageCode: "DE",
		LanguageName: "Deutsch",
		EnglishName: "German",
		Files: [
		]
	},*/
	{
		LanguageCode: "FR",
		LanguageName: "Français",
		EnglishName: "French",
		Files: [
			"Screen/Intro/Start/Text_Start_FR.txt",
			"Screen/Character/Create/Text_Create_FR.txt",
			"Screen/Intro/IntroBedroom/Text_IntroBedroom_FR.txt",
		]
	},
/*	{
		LanguageCode: "RU",
		LanguageName: "Русский",
		EnglishName: "Russian",
		Files: [
		]
	},*/
	{
		LanguageCode: "CN",
		LanguageName: "中文",
		EnglishName: "Chinese",
		Files: [
			"Screen/Character/Create/Text_Create_CN.txt",
			"Screen/Character/Inventory/Text_Inventory_CN.txt",
			"Screen/Character/Picture/Text_Picture_CN.txt",
			"Screen/Character/Profile/Text_Profile_CN.txt",
			"Screen/Character/SaveGame/Text_SaveGame_CN.txt",
			"Screen/Class/BossOffice/Text_BossOffice_CN.txt",
			"Screen/Class/Detention/Text_Detention_CN.txt",
			"Screen/Class/DetentionEnd/Text_DetentionEnd_CN.txt",
			"Screen/Home/HomeBedroom/Text_HomeBedroom_CN.txt",
			"Screen/Home/HomeBedroomEnd/Text_HomeBedroomEnd_CN.txt",
			"Screen/Intro/FirstBossMeeting/Text_FirstBossMeeting_CN.txt",
			"Screen/Intro/IntroBedroom/Text_IntroBedroom_CN.txt",
			"Screen/Intro/IntroBedroomEnd/Text_IntroBedroomEnd_CN.txt",
			"Screen/Intro/Start/Text_Start_CN.txt",
			"Screen/Intro/Warning/Text_Warning_CN.txt",
			"Screen/MiniGame/FreeBondage/Text_FreeBondage_CN.txt",
		]
	},
/*	{
		LanguageCode: "TW",
		LanguageName: "繁體中文",
		EnglishName: "TraditionalChinese",
		Files: [
		]
	},
	{
		LanguageCode: "UA",
		LanguageName: "Українська",
		EnglishName: "Ukrainian",
		Files: [
		]
	},*/
];

/**
 * Checks whether we're running a translation
 */
function TranslationEnabled() {
	return (TranslationLanguage != null) && (TranslationLanguage.trim() != "") && (TranslationLanguage.trim().toUpperCase() != "EN");
}

/**
 * Checks if a file can be translated in the selected language
 * @param {string} FullPath - Full path of the file to check for a corresponding translation file
 * @returns {boolean} - Returns TRUE if a translation is available for the given file
 */
function TranslationAvailable(FullPath) {
	var FileName = FullPath.trim().toUpperCase();
	for (let L = 0; L < TranslationDictionary.length; L++)
		if (TranslationDictionary[L].LanguageCode == TranslationLanguage)
			for (let F = 0; F < TranslationDictionary[L].Files.length; F++)
				if (TranslationDictionary[L].Files[F].trim().toUpperCase() == FileName)
					return true;
	return false;
}

/**
 * Parse a TXT translation file and returns it as an array
 * @param {string} str - Content of the translation text file
 * @returns {string[]} - Array of strings with each line divided. For each translated line, the english string precedes the translated one in the array.
 */
function TranslationParseTXT(str) {

	const arr = [];
	let c;
	str = str.replace(/\r\n/g, '\n').trim();

	// iterate over each character, keep track of current row (of the returned array)
	for (let row = c = 0; c < str.length; c++) {
		let cc = str[c];        // current character, next character
		arr[row] = arr[row] || "";             // create a new row if necessary
		if (cc == '\n') { ++row; continue; }   // If it's a newline, move on to the next row
		arr[row] += cc;                        // Otherwise, append the current character to the row
	}

	// Removes any comment rows (starts with ###)
	for (let row = arr.length - 1; row >= 0; row--)
		if (arr[row].indexOf("###") == 0) {
			arr.splice(row, 1);
		}

	// Trims the full translated array
	for (let row = 0; row < arr.length; row++)
		arr[row] = arr[row].trim();
	return arr;
}

/**
 * Translates a string to another language from the array, the translation is always the one right after the english line
 * @param {string} S - The original english string to translate
 * @param {readonly string[]} T - The active translation dictionary
 * @returns {string} - The translated string
 */
function TranslationString(S, T) {
	if(S && S.trim()){
		S = S.trim();
		let r = T.findIndex(_=>_===S);
		if(r >= 0) return T[r+1];
	}
	return S;
}

/**
 * Translates a character dialog from the specified array
 * @param {Character} C - The character for which we need to translate the dialog array.
 * @param {readonly string[]} T - The active translation dictionary
 * @returns {void} - Nothing
 */
function TranslationDialogArray(C, T) {
	for (let D = 0; D < C.Dialog.length; D++) {
		C.Dialog[D].Option = TranslationString(C.Dialog[D].Option, T);
		C.Dialog[D].Result = TranslationString(C.Dialog[D].Result, T);
	}
}

/**
 * Translates a set of tags. Rerenders the login message when on the login page.
 * @param {readonly { Tag: string, Value: string }[]} S - Array of current tag-value pairs
 * @param {readonly string[]} T - The active translation dictionary
 * @returns {void} - Nothing
 */
function TranslationTextArray(S, T) {
	for (let P = 0; P < S.length; P++)
		S[P].Value = TranslationString(S[P].Value, T);
	if (CurrentScreen == "Login") LoginUpdateMessage();
}

/**
 * Translates the current dialog
 * @param {readonly string[]} T - The active translation dictionary
 * @returns {void} - Nothing
 */
function TranslationDialogRun(T) {
	if (T == null) return;
	for (let D of DialogCurrent) {
        if ((D.Option != null) && (D.Option != "")) {
            D.Option = TranslationString(D.Option, T);
            D.Option = D.Option.replaceAll("PlayerName", Character[0].DisplayName);
        }
        if ((D.Text != null) && (D.Text != "")) {
            D.Text = TranslationString(D.Text, T);
            D.Text = D.Text.replaceAll("PlayerName", Character[0].DisplayName);
        }
	}		
}

/**
 * When no translation is available, replace the player name manually in the English strings
 * @returns {void} - Nothing
 */
function TranslationFixPlayerName() {
	for (let Line of DialogCurrent) {
		Line.Option = Line.Option.replaceAll("PlayerName", Character[0].DisplayName);
		Line.Text = Line.Text.replaceAll("PlayerName", Character[0].DisplayName);
	}	
}

/**
 * Prpares to translate the current dialog
 * @returns {void} - Nothing
 */
function TranslationDialogPrepare() {

	// Only translate if we play in a foreign language
	if (!TranslationEnabled()) {
		TranslationFixPlayerName();
		return;
	}

	// If the translation is available, we open the txt file, parse it and returns the result to build the dialog
	var FullPath = "Screen/" + CommonModule + "/" + CommonScreen + "/Text_" + CommonScreen + "_" + TranslationLanguage + ".txt";
	if (TranslationAvailable(FullPath)) {

		// If the translation data is already cached, we run it right away
		if (TranslationCache[FullPath]) {
			TranslationDialogRun(TranslationCache[FullPath]);
			return;
		}

		// Gets the translation data before running it
		CommonGet(FullPath, function() {
			if (this.status == 200) {
				TranslationCache[FullPath] = TranslationParseTXT(this.responseText);
				TranslationDialogRun(TranslationCache[FullPath]);
			}
		});

	} else {

		// Since no translation is available, replace the player name manually in the English strings
		TranslationFixPlayerName();

	}
}

/**
 * Translate a character dialog if the file is in the dictionary
 * @param {Character} C
 */
function TranslationTranslateDialog(C) {
	const FullPath = `Screens/${C.DialogInfo.module}/${C.DialogInfo.screen}/Dialog_${C.DialogInfo.name}_${TranslationLanguage}.txt`;
	if (!TranslationCache[FullPath]) return;

	TranslationDialogArray(C, TranslationCache[FullPath]);
}

/**
 * Translate an array of tags in the current selected language
 * @param {readonly {Tag: string, Value: string}[]} Text - Array of current tag-value pairs
 * @returns {void} - Nothing
 */
function TranslationText(Text) {

	// If we play in a foreign language
	if (TranslationEnabled()) {

		// Finds the full path of the translation file to use
		var FullPath = "Screens/" + CommonModule + "/" + CommonScreen + "/Text_" + CommonScreen + "_" + TranslationLanguage + ".txt";

		// If the translation file is already loaded, we translate from it
		if (TranslationCache[FullPath]) {
			TranslationTextArray(Text, TranslationCache[FullPath]);
			return;
		}

		// If the translation is available, we open the txt file, parse it and returns the result to build the dialog
		if (TranslationAvailable(FullPath))
			CommonGet(FullPath, function() {
				if (this.status == 200) {
					TranslationCache[FullPath] = TranslationParseTXT(this.responseText);
					TranslationTextArray(Text, TranslationCache[FullPath]);
				}
			});

	}

}

/**
 * Translates the asset group and asset descriptions based on the given dictionary
 * @param {string[]} T - The active translation dictionary
 * @returns {void} - Nothing
 */
function TranslationAssetProcess(T) {
	for (const group of AssetGroup) {
		/** @type {Mutable<AssetGroup>} */(group).Description = TranslationString(group.Description, T);
	}

	for (const asset of Asset) {
		/** @type {Mutable<Asset>} */(asset).Description = TranslationString(asset.Description, T);
	}
}

/**
 * Translates the description of the assets and groups of an asset family
 * @param {IAssetFamily} Family - Name of the asset family to translate
 * @returns {void} - Nothing
 */
function TranslationAsset(Family) {

	// If we play in a foreign language
	if (TranslationEnabled()) {

		// Finds the full path of the translation file to use
		var FullPath = "Assets/" + Family + "/" + Family + "_" + TranslationLanguage + ".txt";

		// If the translation file is already loaded, we translate from it
		if (TranslationCache[FullPath]) {
			TranslationAssetProcess(TranslationCache[FullPath]);
			return;
		}

		// If the translation is available, we open the txt file, parse it and returns the result to build the dialog
		if (TranslationAvailable(FullPath))
			CommonGet(FullPath, function() {
				if (this.status == 200) {
					TranslationCache[FullPath] = TranslationParseTXT(this.responseText);
					TranslationAssetProcess(TranslationCache[FullPath]);
				}
			});

	}

}

/**
 * Returns the translated language name for the given code.
 * @param {string} code - The language code to get the human-readable name of.
 * @param {boolean} [english] - Get the english name of it.
 */
function TranslationGetLanguageName(code, english=false) {
	const data = TranslationDictionary.find(d => d.LanguageCode === code);
	if (!data) return "";
	return english ? data.EnglishName : data.LanguageName;
}

/**
 * Changes the current language and save the new selected language to local storage
 * @returns {void} - Nothing
 */
function TranslationNextLanguage() {
	for (let L = 0; L < TranslationDictionary.length; L++)
		if (TranslationDictionary[L].LanguageCode == TranslationLanguage) {
			if (L != TranslationDictionary.length - 1)
				TranslationLanguage = TranslationDictionary[L + 1].LanguageCode;
			else
				TranslationLanguage = TranslationDictionary[0].LanguageCode;
			localStorage.setItem("BondageTeacherLanguage", TranslationLanguage);
			return;
		}
}

/**
 * Changes the language depending on the given language and save the new selected language to local storage
 * @param {string} language
 */
function TranslationSwitchLanguage(language) {
	TranslationLanguage = TranslationDictionary.find(l => l.LanguageName === language || l.EnglishName === language).LanguageCode;
	localStorage.setItem("BondageTeacherLanguage", TranslationLanguage);
}

/**
 * Loads the previous translation language from local storage if it exists
 * @returns {void} - Nothing
 */
function TranslationLoad() {
	var L = localStorage.getItem("BondageTeacherLanguage");
	if (L != null) TranslationLanguage = L;
}
