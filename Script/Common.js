"use strict";

/** @type {string} */
var CommonModule;
/** @type {string} */
var CommonScreen;
/** @type {string} */
var CommonBackground = null;
/** @type {boolean} */
var CommonIsMobile = false;
/** @type {Record<string, string[][]>} */
var CommonCSVCache = {};
/** @type {TouchList | null} */
var CommonTouchList = null;
/** @type {string} */
var CommonKeyPress = "";
/** @type {ScreenFunctions} */
var CommonScreenFunctions;
/** @type {number} */
var CommonCutscene = 0;
/** @type {number} */
var CommonSceneTime = 0;
/** @type {number} */
var CommonWeek = 1;

// Adds the replaceAt function to strings
String.prototype.replaceAt=function(index, character) {
	return this.substr(0, index) + character + this.substr(index+character.length);
};

/**
 * A map of keys to common font stack definitions. Each stack definition is a
 * two-item array whose first item is an ordered list of fonts, and whose
 * second item is the generic fallback font family (e.g. sans-serif, serif,
 * etc.)
 * @constant
 * @type {Object.<String, [String[], String]>}
 */
const CommonFontStacks = {
	Arial: [["Arial"], "sans-serif"],
	TimesNewRoman: [["Times New Roman", "Times"], "serif"],
	Papyrus: [["Papyrus", "Ink Free", "Segoe Script", "Gabriola"], "fantasy"],
	ComicSans: [["Comic Sans MS", "Comic Sans", "Brush Script MT", "Segoe Print"], "cursive"],
	Impact: [["Impact", "Arial Black", "Franklin Gothic", "Arial"], "sans-serif"],
	HelveticaNeue: [["Helvetica Neue", "Helvetica", "Arial"], "sans-serif"],
	Verdana: [["Verdana", "Helvetica Neue", "Arial"], "sans-serif"],
	CenturyGothic: [["Century Gothic", "Apple Gothic", "AppleGothic", "Futura"], "sans-serif"],
	Georgia: [["Georgia", "Times"], "serif"],
	CourierNew: [["Courier New", "Courier"], "monospace"],
	Copperplate: [["Copperplate", "Copperplate Gothic Light"], "fantasy"],
};

/**
 * Checks if a variable is a number
 * @param {any} n - Variable to check for
 * @returns {n is number} - Returns TRUE if the variable is a finite number
 */
function CommonIsNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Gets the current time as a string
 * @returns {string} - Returns the current date and time in a yyyy-mm-dd hh:mm:ss format
 */
function CommonGetFormatDate() {
	var d = new Date();
	var yyyy = d.getFullYear();
	var mm = d.getMonth() < 9 ? "0" + (d.getMonth() + 1) : (d.getMonth() + 1); // getMonth() is zero-based
	var dd = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
	var hh = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
	var min = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
	var ss = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();
	return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

/**
 * Detects if the user is on a mobile browser
 * @returns {boolean} - Returns TRUE if the user is on a mobile browser
 */
function CommonDetectMobile() {

	// First check
	var mobile = ['iphone', 'ipad', 'android', 'blackberry', 'nokia', 'opera mini', 'windows mobile', 'windows phone', 'iemobile', 'mobile/', 'webos', 'kindle'];
	for (let i in mobile) if (navigator.userAgent.toLowerCase().indexOf(mobile[i].toLowerCase()) > 0) return true;

	// IPad pro check
	if (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform)) return true;

	// Second check
	if (sessionStorage.desktop) return false;
	else if (localStorage.mobile) return true;

	// If nothing is found, we assume desktop
	return false;

}

/**
 * Gets the current browser name and version
 * @returns {{Name: string, Version: string}} - Browser info
 */
function CommonGetBrowser() {
	var ua = navigator.userAgent, tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
	if (/trident/i.test(M[1])) {
		tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
		return { Name: "IE", Version: (tem[1] || "N/A") };
	}
	if (M[1] === 'Chrome') {
		tem = ua.match(/\bOPR|Edge\/(\d+)/);
		if (tem != null) return { Name: "Opera", Version: tem[1] || "N/A" };
	}
	M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
	if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
	return { Name: M[0] || "N/A", Version: M[1] || "N/A" };
}

/**
 * Parse a CSV file content into an array
 * @param {string} str - Content of the CSV
 * @returns {string[][]} Array representing each line of the parsed content, each line itself is split by commands and stored within an array.
 */
function CommonParseCSV(str) {
	/** @type {string[][]} */
	var arr = [];
	var quote = false;  // true means we're inside a quoted field
	var c;
	var col;
	// We remove whitespace on start and end
	str = str.replace(/\r\n/g, '\n').trim();

	// iterate over each character, keep track of current row and column (of the returned array)
	for (let row = col = c = 0; c < str.length; c++) {
		var cc = str[c], nc = str[c + 1];        // current character, next character
		arr[row] = arr[row] || [];             // create a new row if necessary
		arr[row][col] = arr[row][col] || '';   // create a new column (start with empty string) if necessary

		// If the current character is a quotation mark, and we're inside a
		// quoted field, and the next character is also a quotation mark,
		// add a quotation mark to the current column and skip the next character
		if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

		// If it's just one quotation mark, begin/end quoted field
		if (cc == '"') { quote = !quote; continue; }

		// If it's a comma and we're not in a quoted field, move on to the next column
		if (cc == ',' && !quote) { ++col; continue; }

		// If it's a newline and we're not in a quoted field, move on to the next
		// row and move to column 0 of that new row
		if (cc == '\n' && !quote) { ++row; col = 0; continue; }

		// Otherwise, append the current character to the current column
		arr[row][col] += cc;
	}
	return arr;
}

/**
 *  Read a CSV file from cache, or fetch it from the server
 * @param {string} Array - Name of where the cached text is stored
 * @param {string} Path - Path/Group in which the screen is located
 * @param {string} Screen - Screen for which the file is for
 * @param {string} File - Name of the file to get
 * @returns {void} - Nothing
 */
function CommonReadCSV(Array, Path, Screen, File) {

	// Changed from a single path to various arguments and internally concatenate them
	// This ternary operator is used to keep backward compatibility
	var FullPath = "Screen/" + Path + "/" + Screen + "/" + File + ".csv";
	if (CommonCSVCache[FullPath]) {
		window[Array] = CommonCSVCache[FullPath];
		return;
	}

	// Opens the file, parse it and returns the result in an Object
	CommonGet(FullPath, function () {
		if (this.status == 200) {
			CommonCSVCache[FullPath] = CommonParseCSV(this.responseText);
			window[Array] = CommonCSVCache[FullPath];
		}
	});

	// If a translation file is available, we open the txt file and keep it in cache
	var TranslationPath = FullPath.replace(".csv", "_" + TranslationLanguage + ".txt");
	if (TranslationAvailable(TranslationPath))
		CommonGet(TranslationPath, function () {
			if (this.status == 200) TranslationCache[TranslationPath] = TranslationParseTXT(this.responseText);
		});

}

/**
 * AJAX utility to get a file and return its content. By default will retry requests 10 times
 * @param {string} Path - Path of the resource to request
 * @param {(this: XMLHttpRequest, xhr: XMLHttpRequest) => void} Callback - Callback to execute once the resource is received
 * @param {number} [RetriesLeft] - How many more times to retry if the request fails - after this hits zero, an error will be logged
 * @returns {void} - Nothing
 */
function CommonGet(Path, Callback, RetriesLeft) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", Path);
	xhr.onloadend = function() {
		// For non-error responses, call the callback
		if (this.status < 400) Callback.bind(this)(xhr);
		// Otherwise, retry
		else CommonGetRetry(Path, Callback, RetriesLeft);
	};
	xhr.onerror = function() { CommonGetRetry(Path, Callback, RetriesLeft); };
	xhr.send(null);
}

/**
 * Retry handler for CommonGet requests. Exponentially backs off retry attempts up to a limit of 1 minute. By default,
 * retries up to a maximum of 10 times.
 * @param {string} Path - The path of the resource to request
 * @param {(this: XMLHttpRequest, xhr: XMLHttpRequest) => void} Callback - Callback to execute once the resource is received
 * @param {number} [RetriesLeft] - How many more times to retry - after this hits zero, an error will be logged
 * @returns {void} - Nothing
 */
function CommonGetRetry(Path, Callback, RetriesLeft) {
	if (typeof RetriesLeft !== "number") RetriesLeft = 10;
	if (RetriesLeft <= 0) {
		console.error(`GET request to ${Path} failed - no more retries`);
	} else {
		const retrySeconds = Math.min(Math.pow(2, Math.max(0, 10 - RetriesLeft)), 60);
		console.warn(`GET request to ${Path} failed - retrying in ${retrySeconds} second${retrySeconds === 1 ? "" : "s"}...`);
		setTimeout(() => CommonGet(Path, Callback, RetriesLeft - 1), retrySeconds * 1000);
	}
}

/**
 * Returns TRUE if a section of the screen is currently touched on a mobile device
 * @param {number} X - The X position
 * @param {number} Y - The Y position
 * @param {number} W - The width of the square
 * @param {number} H - The height of the square
 * @param {TouchList} [TL] - Can give a specific touch event instead of the default one
 * @returns {boolean}
 */
function CommonTouchActive(X, Y, W, H, TL) {
	if (!CommonIsMobile) return false;
	if (TL == null) TL = CommonTouchList;
	if (TL == null) return;
	for (let index = 0; index < TL.length; index++) {
		const Touch = TL[index];
		let TouchX = Math.round((Touch.pageX - DrawMainCanvas.canvas.offsetLeft) * 2000 / DrawMainCanvas.canvas.clientWidth);
		let TouchY = Math.round((Touch.pageY - DrawMainCanvas.canvas.offsetTop) * 1000 / DrawMainCanvas.canvas.clientHeight);
		if ((TouchX >= X) && (TouchX <= X + W) && (TouchY >= Y) && (TouchY <= Y + H))
			return true;
	}
	return false;
}

/**
 * Calls a basic dynamic function if it exists, for complex functions, use: CommonDynamicFunctionParams
 * @param {string} FunctionName - Name of the function to call
 * @returns {void} - Nothing
 */
function CommonDynamicFunction(FunctionName) {
	if (typeof window[FunctionName.substr(0, FunctionName.indexOf("("))] === "function")
		window[FunctionName.replace("()", "")]();
	else
		console.log("Trying to launch invalid function: " + FunctionName);
}


/**
 * Calls a dynamic function with parameters (if it exists), also allow ! in front to reverse the result. The dynamic function is the provided function name in the dialog option object and it is prefixed by the current screen.
 * @param {string} FunctionName - Function name to call dynamically
 * @returns {*} - Returns what the dynamic function returns or FALSE if the function does not exist
 */
function CommonDynamicFunctionParams(FunctionName) {

	// Gets the reverse (!) sign
	var Reverse = false;
	if (FunctionName.substring(0, 1) == "!") Reverse = true;
	FunctionName = FunctionName.replace("!", "");

	// Gets the real function name and parameters
	var ParamCount = 1;
	if (FunctionName.indexOf("()") >= 0) ParamCount = 0;
	else ParamCount = FunctionName.split(",").length;
	var openParenthesisIndex = FunctionName.indexOf("(");
	var closedParenthesisIndex = FunctionName.indexOf(")", openParenthesisIndex);
	var Params = FunctionName.substring(openParenthesisIndex + 1, closedParenthesisIndex).split(",");
	for (let P = 0; P < Params.length; P++)
		Params[P] = Params[P].trim().replace('"', '').replace('"', '');
	FunctionName = FunctionName.substring(0, openParenthesisIndex);
	if ((FunctionName.indexOf("Dialog") != 0) && (FunctionName.indexOf("Common") != 0) && (FunctionName.indexOf("Log") != 0) && (FunctionName.indexOf("SaveGame") != 0) && (FunctionName.indexOf("Inventory") != 0) && (FunctionName.indexOf("Picture") != 0) && (FunctionName.indexOf("MiniGame") != 0) && (FunctionName.indexOf("Character") != 0) && (FunctionName.indexOf(CommonScreen) != 0)) FunctionName = CommonScreen + FunctionName;

	// If it's really a function, we continue
	if (typeof window[FunctionName] === "function") {

		// Launches the function with the params and returns the result
		var Result = true;
		if (ParamCount == 0) Result = window[FunctionName]();
		if (ParamCount == 1) Result = window[FunctionName](Params[0]);
		if (ParamCount == 2) Result = window[FunctionName](Params[0], Params[1]);
		if (ParamCount == 3) Result = window[FunctionName](Params[0], Params[1], Params[2]);
		if (ParamCount == 4) Result = window[FunctionName](Params[0], Params[1], Params[2], Params[3]);
		if (Reverse) return !Result;
		else return Result;

	} else {

		// Log the error in the console
		console.log("Trying to launch invalid function: " + FunctionName);
		return false;

	}

}

/**
 *  Calls a named global function with the passed in arguments, if the named function exists. Differs from
 *  CommonDynamicFunctionParams in that arguments are not parsed from the passed in FunctionName string, but
 *  passed directly into the function call, allowing for more complex JS objects to be passed in. This
 *  function will not log to console if the provided function name does not exist as a global function.
 * @param {string} FunctionName - The name of the global function to call
 * @param {readonly any[]} [args] - zero or more arguments to be passed to the function (optional)
 * @returns {any} - returns the result of the function call, or undefined if the function name isn't valid
 */
function CommonCallFunctionByName(FunctionName/*, ...args */) {
	var Function = window[FunctionName];
	if (typeof Function === "function") {
		var args = Array.prototype.slice.call(arguments, 1);
		return Function.apply(null, args);
	}
}

/**
 * Behaves exactly like CommonCallFunctionByName, but logs a warning if the function name is invalid.
 * @param {string} FunctionName - The name of the global function to call
 * @param {readonly any[]} [args] - zero or more arguments to be passed to the function (optional)
 * @returns {any} - returns the result of the function call, or undefined if the function name isn't valid
 */
function CommonCallFunctionByNameWarn(FunctionName/*, ...args */) {
	var Function = window[FunctionName];
	if (typeof Function === "function") {
		var args = Array.prototype.slice.call(arguments, 1);
		return Function.apply(null, args);
	} else {
		console.warn(`Attempted to call invalid function "${FunctionName}"`);
	}
}

/**
 * Sets the current screen and calls the loading script if needed
 * @param {ModuleType} NewModule - Module of the screen to display
 * @param {string} NewScreen - Screen to display
 * @param {boolean} SkipLoad - Set to TRUE to skip the Load call on the screen
 * @returns {void} - Nothing
 */
function CommonSetScreen(NewModule, NewScreen, SkipLoad) {

	// If there's an unload of the previous screen, we call it
	DialogCurrent = null;
	if (CommonScreenFunctions && CommonScreenFunctions.Unload) CommonScreenFunctions.Unload();

	// Check for required functions
	if (typeof window[`${NewScreen}Run`] !== "function") {
		throw Error(`Screen "${NewScreen}": Missing required Run function`);
	}
	if (typeof window[`${NewScreen}Click`] !== "function") {
		throw Error(`Screen "${NewScreen}": Missing required Click function`);
	}

	// Assigns the common module/screen variables & functions
	CommonModule = NewModule;
	CommonScreen = NewScreen;
	CommonCutscene = 0;
	CommonScreenFunctions = {
		Run: (time) => window[`${NewScreen}Run`](time),
		Click: (e) => window[`${NewScreen}Click`](e),
		MouseDown: typeof window[`${NewScreen}MouseDown`] === "function" ? (e) => window[`${NewScreen}MouseDown`](e) : undefined,
		MouseUp: typeof window[`${NewScreen}MouseUp`] === "function" ? (e) => window[`${NewScreen}MouseUp`](e) : undefined,
		MouseMove: typeof window[`${NewScreen}MouseMove`] === "function" ? (e) => window[`${NewScreen}MouseMove`](e) : undefined,
		MouseWheel: typeof window[`${NewScreen}MouseWheel`] === "function" ? (e) => window[`${NewScreen}MouseWheel`](e) : undefined,
		Draw: typeof window[`${NewScreen}Draw`] === "function" ? () => window[`${NewScreen}Draw`]() : undefined,
		Load: typeof window[`${NewScreen}Load`] === "function" ? () => window[`${NewScreen}Load`]() : undefined,
		Unload: typeof window[`${NewScreen}Unload`] === "function" ? () => window[`${NewScreen}Unload`]() : undefined,
		Resize: typeof window[`${NewScreen}Resize`] === "function" ? (load) => window[`${NewScreen}Resize`](load) : undefined,
		KeyDown: typeof window[`${NewScreen}KeyDown`] === "function" ? (e) => window[`${NewScreen}KeyDown`](e) : undefined,
		KeyUp: typeof window[`${NewScreen}KeyUp`] === "function" ? (e) => window[`${NewScreen}KeyUp`](e) : undefined,
		Exit: typeof window[`${NewScreen}Exit`] === "function" ? () => window[`${NewScreen}Exit`]() : undefined
	};

	// Clears the current cache and loads the text
	CommonGetFont.clearCache();
	CommonGetFontName.clearCache();
	TextLoad();

	// Calls the base functions if they are available
	ElementToggleGeneratedElements(CommonScreen, true);
	if (CommonScreenFunctions.Load && !SkipLoad) CommonScreenFunctions.Load();
	if (CommonScreenFunctions.Resize) CommonScreenFunctions.Resize(true);

}

/**
 * Gets the current time in ms
 * @returns {number} - Date in ms
 */
function CommonTime() {
	return Date.now();
}

/**
 * Checks if a given value is a valid HEX color code
 * @param {string} Value - Potential HEX color code
 * @returns {boolean} - Returns TRUE if the string is a valid HEX color
 */
function CommonIsColor(Value) {
	if ((Value == null) || (Value.length < 3)) return false;
	//convert short hand hex color to standard format
	if (/^#[0-9A-F]{3}$/i.test(Value)) Value = "#" + Value[1] + Value[1] + Value[2] + Value[2] + Value[3] + Value[3];
	return /^#[0-9A-F]{6}$/i.test(Value);
}

/**
 * Checks whether an item's color has a valid value that can be interpreted by the drawing
 * functions. Valid values are null, undefined, strings, and an array containing any of the
 * aforementioned types.
 * @param {null | string | readonly (null | string)[]} [Color] - The Color value to check
 * @returns {boolean} - Returns TRUE if the color is a valid item color
 */
function CommonColorIsValid(Color) {
	if (Color == null || typeof Color === "string") return true;
	if (Array.isArray(Color)) return Color.every(C => C == null || typeof C === "string");
	return false;
}

/**
 * Check that the passed string looks like an acceptable email address.
 *
 * @param {string} Email
 * @returns {boolean}
 */
function CommonEmailIsValid(Email) {
	if (Email.length < 5 || Email.length > 100) return false;

	const parts = Email.split("@");
	if (parts.length !== 2) return false;
	if (parts[1].indexOf(".") === -1) return false;

	return ServerAccountEmailRegex.test(Email);
}

/**
 * Remove item from list on given index and returns it
 * @template T
 * @param {T[]} list
 * @param {number} index
 * @returns {undefined|T}
 */
function CommonRemoveItemFromList(list, index) {
	if (index > list.length || index < 0) return undefined;
	return list.splice(index, 1)[0];
}

/**
 * Removes random item from list and returns it
 * @template T
 * @param {T[]} list
 * @returns {T}
 */
function CommonRemoveRandomItemFromList(list) {
	return CommonRemoveItemFromList(list, Math.floor(Math.random() * list.length));
}

/**
 * Get a random item from a list while making sure not to pick the previous one.
 * Function expects unique values in the list. If there are multiple instances of ItemPrevious, it may still return it.
 * @template T
 * @param {T} ItemPrevious - Previously selected item from the given list
 * @param {readonly T[]} ItemList - List for which to pick a random item from
 * @returns {T} - The randomly selected item from the list
 */
function CommonRandomItemFromList(ItemPrevious, ItemList) {
	let previousIndex = ItemList.indexOf(ItemPrevious);
	let maxRandom = ItemList.length;
	if (previousIndex > -1) {
		maxRandom--;
	}
	if (maxRandom > 0) {
		let randomIndex = Math.floor(Math.random() * maxRandom);
		if( previousIndex > -1 && randomIndex >= previousIndex) randomIndex++;
		return ItemList[randomIndex];
	} else return undefined;
}

/**
 * Converts a string of numbers split by commas to an array, sanitizes the array by removing all NaN or undefined elements.
 * @param {string} s - String of numbers split by commas
 * @returns {number[]} - Array of valid numbers from the given string
 */
function CommonConvertStringToArray(s) {
	var arr = [];
	if (typeof s === "string") {
		arr = s.split(',').reduce((list, curr) => {
			if (!(!curr || Number.isNaN(Number(curr)))) list.push(Number(curr));
			return list;
		}, []);
	}
	return arr;
}

/**
 * Shuffles all characters in a string
 * @param {string} string - The string to shuffle
 * @returns {string} - The shuffled string
 */
function CommonStringShuffle(string) {
	var parts = string.split('');
	for (var i = parts.length; i > 0;) {
		var random = parseInt(Math.random() * i);
		var temp = parts[--i];
		parts[i] = parts[random];
		parts[random] = temp;
	}
	return parts.join('');
}

/**
 * Converts an array to a string separated by commas (equivalent of .join(","))
 * @param {readonly any[]} Arr - Array to convert to a joined string
 * @returns {string} - String of all the array items joined together
 */
function CommonConvertArrayToString(Arr) {
	var S = "";
	for (let P = 0; P < Arr.length; P++) {
		if (P != 0) S = S + ",";
		S = S + Arr[P].toString();
	}
	return S;
}

/**
 * Checks whether two item colors are equal. An item color may either be a string or an array of strings.
 * @param {string | readonly string[]} C1 - The first color to check
 * @param {string | readonly string[]} C2 - The second color to check
 * @returns {boolean} - TRUE if C1 and C2 represent the same item color, FALSE otherwise
 */
function CommonColorsEqual(C1, C2) {
	if (Array.isArray(C1) && Array.isArray(C2)) {
		return CommonArraysEqual(C1, C2);
	}
	return C1 === C2;
}

/**
 * Checks whether two arrays are equal. The arrays are considered equal if they have the same length and contain the same items in the same
 * order, as determined by === comparison
 * @param {readonly *[]} a1 - The first array to compare
 * @param {readonly *[]} a2 - The second array to compare
 * @param {boolean} [ignoreOrder] - Whether to ignore item order when considering equality
 * @returns {boolean} - TRUE if both arrays have the same length and contain the same items in the same order, FALSE otherwise
 */
function CommonArraysEqual(a1, a2, ignoreOrder = false) {
	return a1.length === a2.length && a1.every((item, i) => ignoreOrder ? a2.includes(item) : item === a2[i]);
}

/**
 * Creates a debounced wrapper for the provided function with the provided wait time. The wrapped function will not be called as long as
 * the debounced function continues to be called. If the debounced function is called, and then not called again within the wait time, the
 * wrapped function will be called.
 * @param {function} func - The function to debounce
 * @returns {function} - A debounced version of the provided function
 */
function CommonDebounce(func) {
	let timeout, args, context, timestamp, result, wait;

	function later() {
		const last = CommonTime() - timestamp;
		if (last >= 0 && last < wait) {
			timeout = setTimeout(later, wait - last);
		} else {
			timeout = null;
			result = func.apply(context, args);
			context = args = null;
		}
	}

	return function (waitInterval/*, ...args */) {
		context = this;
		wait = waitInterval;
		args = Array.prototype.slice.call(arguments, 1);
		timestamp = CommonTime();
		if (!timeout) {
			timeout = setTimeout(later, wait);
		}
		return result;
	};
}

/**
 * Creates a throttling wrapper for the provided function with the provided wait time. If the wrapped function has been successfully called
 * within the wait time, further call attempts will be delayed until the wait time has passed.
 * @param {function} func - The function to throttle
 * @returns {function} - A throttled version of the provided function
 */
function CommonThrottle(func) {
	let timeout, args, context, timestamp = 0, result;

	function run() {
		timeout = null;
		result = func.apply(context, args);
		timestamp = CommonTime();
	}

	return function (wait/*, ...args */) {
		context = this;
		args = Array.prototype.slice.call(arguments, 1);
		if (!timeout) {
			const last = CommonTime() - timestamp;
			if (last >= 0 && last < wait) {
				timeout = setTimeout(run, wait - last);
			} else {
				run();
			}
		}
		return result;
	};
}

/**
 * Creates a wrapper for a function to limit how often it can be called. The player-defined wait interval setting determines the
 * allowed frequency. Below 100 ms the function will be throttled and above will be debounced.
 * @template {(...args: any) => any} FunctionType
 * @param {FunctionType} func - The function to limit calls of
 * @param {number} [minWait=0] - A lower bound for how long the wait interval can be, 0 by default
 * @param {number} [maxWait=1000] - An upper bound for how long the wait interval can be, 1 second by default
 * @returns {FunctionType} - A debounced or throttled version of the function
 */
function CommonLimitFunction(func, minWait = 0, maxWait = 1000) {
	const funcDebounced = CommonDebounce(func);
	const funcThrottled = CommonThrottle(func);

	return /** @type {FunctionType} */(function () {
		const wait = Math.min(
			Math.max(
				Player.GraphicsSettings ? Player.GraphicsSettings.AnimationQuality : 100, minWait
			),
			maxWait,
		);
		const args = [wait].concat(Array.from(arguments));
		return wait < 100 ? funcThrottled.apply(this, args) : funcDebounced.apply(this, args);
	});
}

/**
 * Creates a simple memoizer.
 * The memoized function does calculate its result exactly once and from that point on, uses
 * the result stored in a local cache to speed up things.
 * @template {(...args: any) => any} T
 * @param {T} func - The function to memoize
 * @param {((arg: any) => string)[]} argConvertors - A list of stringification functions for creating a memo, one for each function argument
 * @returns {MemoizedFunction<T>} - The result of the memoized function
 */
function CommonMemoize(func, argConvertors=null) {
	var memo = {};
	var memoized = /** @type {MemoizedFunction<T>} */(function (...args) {
		let index = "";
		if (argConvertors !== null) {
			index += argConvertors.map((callback, i) => callback(args[i])).join(",");
		} else {
			for (const arg of args) {
				if (typeof arg === "object") {
					index += JSON.stringify(arg);
				} else {
					index += String(arg);
				}
			}
		}

		if (!(index in memo)) {
			memo[index] = func(...args);
		}
		return memo[index];
	});

	// add a clear cache method
	memoized.clearCache = function () {
		memo = {};
	};
	return memoized;
}

/**
 * Memoized getter function. Returns a font string specifying the player's
 * preferred font and the provided size. This is memoized as it is called on
 * every frame in many cases.
 * @param {number} size - The font size that should be specified in the
 * returned font string
 * @returns {string} - A font string specifying the requested font size and
 * the player's preferred font stack. For example:
 * 12px "Courier New", "Courier", monospace
 */
const CommonGetFont = CommonMemoize((size) => {
	return `${size}px ${CommonGetFontName()}`;
});

/**
 * Memoized getter function. Returns a font string specifying the player's
 * preferred font stack. This is memoized as it is called on every frame in
 * many cases.
 * @returns {string} - A font string specifying the player's preferred font
 * stack. For example:
 * "Courier New", "Courier", monospace
 */
const CommonGetFontName = CommonMemoize(() => {
	const pref = false;
	const fontStack = CommonFontStacks[pref] || CommonFontStacks.Arial;
	const font = fontStack[0].map(fontName => `"${fontName}"`).join(", ");
	return `${font}, ${fontStack[1]}`;
});

/**
 * Compares two version numbers and returns -1/0/1 if Other number is smaller/same/larger than Current one
 * @param {string} Current Current version number
 * @param {string} Other Other version number
 * @returns {-1|0|1} Comparison result
 */
function CommonCompareVersion(Current, Other) {
	const CurrentMatch = GameVersionFormat.exec(Current);
	const OtherMatch = GameVersionFormat.exec(Other);
	if (!CurrentMatch || !OtherMatch) return -1;
	const CurrentVer = [
		Number.parseInt(CurrentMatch[1]),
		CurrentMatch[2] === "Alpha" ? 1 : CurrentMatch[2] === "Beta" ? 2 : 3,
		Number.parseInt(CurrentMatch[3]) || 0
	];
	const OtherVer = [
		Number.parseInt(OtherMatch[1]),
		OtherMatch[2] === "Alpha" ? 1 : OtherMatch[2] === "Beta" ? 2 : 3,
		Number.parseInt(OtherMatch[3]) || 0
	];
	for (let i = 0; i < 3; i++) {
		if (CurrentVer[i] !== OtherVer[i]) {
			return /** @type {-1|0|1} */ (Math.sign(OtherVer[i] - CurrentVer[i]));
		}
	}
	return 0;
}

/**
 * A simple deep equality check function which checks whether two objects are equal. The function traverses recursively
 * into objects and arrays to check for equality. Primitives and simple types are considered equal as defined by `===`.
 * @template T
 * @param {unknown} obj1 - The first object to compare
 * @param {T} obj2 - The second object to compare
 * @returns {obj1 is T} - TRUE if both objects are equal, up to arbitrarily deeply nested property values, FALSE
 * otherwise.
 */
function CommonDeepEqual(obj1, obj2) {
	if (obj1 === obj2) {
		return true;
	}

	if (obj1 && obj2 && typeof obj1 === "object" && typeof obj2 === "object") {
		// If the objects do not share a prototype, they are not equal
		if (Object.getPrototypeOf(obj1) !== Object.getPrototypeOf(obj2)) {
			return false;
		}

		// Get the keys for the objects
		const keys1 = Object.keys(obj1);
		const keys2 = Object.keys(obj2);

		// If the objects have different numbers of keys, they are not equal
		if (keys1.length !== keys2.length) {
			return false;
		}

		// Sort the keys
		keys1.sort();
		keys2.sort();
		return keys1.every((key, i) => {
			// If the keys are different, the objects are not equal
			if (key !== keys2[i]) {
				return false;
			}
			// Otherwise, compare the values
			return CommonDeepEqual(obj1[key], obj2[key]);
		});
	}

	return false;
}

/**
 * A simple deep equality check function which checks whether two objects are equal for all properties in `subRec`.
 * The function traverses recursively into objects and arrays to check for equality.
 * Primitives and simple types are considered equal as defined by `===`.
 * @template T
 * @param {unknown} subRec - The subset-containg object to compare
 * @param {T} superRec - The superset-containg object to compare
 * @returns {subRec is Partial<T>} - Whether `subRec` is a subset of `superRec` up to arbitrarily deeply nested property values
 */
function CommonDeepIsSubset(subRec, superRec) {
	if (subRec === superRec) {
		return true;
	}

	if (subRec && superRec && typeof subRec === "object" && typeof superRec === "object") {
		// If the objects do not share a prototype, they are not equal
		if (Object.getPrototypeOf(subRec) !== Object.getPrototypeOf(superRec)) {
			return false;
		}

		if (CommonIsArray(subRec) && CommonIsArray(superRec)) {
			return subRec.every(subValue => superRec.some(superValue => CommonDeepIsSubset(subValue, superValue)));
		} else {
			// Get the keys for the objects
			const subKeys = Object.keys(subRec);
			const superKeys = new Set(Object.keys(superRec));

			// If the objects have different numbers of keys, they are not equal
			if (!subKeys.every(k => superKeys.has(k))) {
				return false;
			} else {
				return subKeys.every(key => CommonDeepIsSubset(subRec[key], superRec[key]));
			}
		}
	}
	return false;
}

/**
 * Adds all items from the source array to the destination array if they aren't already included
 * @template T
 * @param {T[]} dest - The destination array
 * @param {readonly T[]} src - The source array
 * @returns {T[]} - The destination array
 */
function CommonArrayConcatDedupe(dest, src) {
	if (Array.isArray(src) && Array.isArray(dest)) {
		for (const item of src) {
			if (!dest.includes(item)) dest.push(item);
		}
	}
	return dest;
}

/**
 * Common noop function
 * @returns {void} - Nothing
 */
function CommonNoop() {
	// Noop function
}

/**
 * Performs the required substitutions on the given message
 * @param {string} msg - The string to perform the substitutions on.
 * @param {CommonSubtituteSubstitution[]} substitutions - An array of [string, replacement, replacer?] subtitutions.
 */
function CommonStringSubstitute(msg, substitutions) {
	if (typeof msg !== "string" || msg.trim() === "")
		return "";

	function makeReplacer(replacer, replacement) {
		if (typeof replacer === "function")
			return (match, offset, string) => replacer(match, offset, replacement, string);
		return () => replacement;
	}

	substitutions = substitutions.sort((a, b) => b[0].length - a[0].length);
	for (const [tag, subst, replacer] of substitutions) {
		let repl = makeReplacer(replacer, subst);
		msg = msg.replace(new RegExp(tag, "g"), repl);
	}
	return msg;
}

/**
 * Returns a titlecased version of the given string.
 * @param {string} str
 * @returns {string}
 */
function CommonStringTitlecase(str) {
	return str[0].toUpperCase() + str.substring(1);
}

/**
 * Type guard which checks that a value is a simple object (i.e. a non-null object which is not an array)
 * @param {unknown} value - The value to test
 * @returns {value is Record<string, unknown>}
 */
function CommonIsObject(value) {
	return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Deep-clones an object
 * @todo JSON serialization will break things like functions, Sets and Maps.
 * @template T
 * @param {T} obj
 * @param {null | ((this: any, key: string, value: any) => any)} replacer
 * @param {null | ((this: any, key: string, value: any) => any)} reviver
 * @returns {T}
 */
function CommonCloneDeep(obj, reviver=null, replacer=null) {
	reviver ??= undefined;
	replacer ??= undefined;
	return JSON.parse(JSON.stringify(obj, replacer), reviver);
}

/**
 * Type guard which checks that a value is a non-negative (i.e. positive or zero) integer
 * @param {unknown} value - The value to test
 * @returns {value is number}
 * @see {@link CommonIsInteger}
 */
function CommonIsNonNegativeInteger(value) {
	return CommonIsInteger(value, 0);
}

/**
 * Type guard which checks that a value is an integer that, optionally, falls within the specified range
 * @param {unknown} value - The value to test
 * @param {number} min - The minimum allowed value
 * @param {number} max - The maximum allowed value
 * @returns {value is number}
 */
function CommonIsInteger(value, min=-Infinity, max=Infinity) {
	return (
		typeof value === "number"
		&& Number.isInteger(value)
		&& value >= min
		&& value <= max
	);
}

/**
 * Type guard which checks that a value is a finite number that, optionally, falls within the specified range
 * @param {unknown} value - The value to test
 * @param {number} min - The minimum allowed value
 * @param {number} max - The maximum allowed value
 * @returns {value is number}
 */
function CommonIsFinite(value, min=-Infinity, max=Infinity) {
	return (
		typeof value === "number"
		&& Number.isFinite(value)
		&& value >= min
		&& value <= max
	);
}

/**
 * A version of {@link Array.isArray} more friendly towards readonly arrays.
 * @param {unknown} arg - The to-be validated object
 * @returns {arg is readonly unknown[]} Whether the passed object is a (potentially readonly) array
 */
function CommonIsArray(arg) {
	return Array.isArray(arg);
}

/**
 * A {@link Object.keys} variant annotated to return respect literal key types
 * @template {string} T
 * @param {Partial<Record<T, unknown>>} record A record with string-based keys
 * @returns {T[]} The keys in the passed record
 */
function CommonKeys(record) {
	return /** @type {T[]} */(Object.keys(record));
}

/**
 * A {@link Object.entries} variant annotated to return respect literal key types
 * @template {string} KT
 * @template VT
 * @param {Partial<Record<KT, VT>>} record A record with string-based keys
 * @returns {[KT, VT][]} The key/value pairs in the passed record
 */
function CommonEntries(record) {
	return /** @type {[KT, VT][]} */(Object.entries(record));
}

/**
 * A {@link Array.includes} version annotated to return a type guard.
 * @template T
 * @param {readonly T[]} array The array in question
 * @param {unknown} searchElement The value to search for
 * @param {number} [fromIndex] Zero-based index at which to start searching
 * @returns {searchElement is T} Whether the array contains the passed element
 */
function CommonIncludes(array, searchElement, fromIndex) {
	return array.includes(/** @type {T} */(searchElement), fromIndex);
}

/**
 * A {@link Object.fromEntries} variant annotated to return respect literal key types.
 * @note The returned record is typed as being non-{@link Partial}, an assumption that may not hold in practice
 * @template {string} KT
 * @template VT
 * @param {Iterable<[key: KT, value: VT]>} iterable An iterable object that contains key-value entries for properties and methods
 * @returns {Record<KT, VT>} A record created from the passed key/value pairs
 */
function CommonFromEntries(iterable) {
	return /** @type {Record<KT, VT>} */(Object.fromEntries(iterable));
}

/**
 * Create a copy of the passed record with all specified keys removed
 * @template {keyof RecordType} KeyType
 * @template {{}} RecordType
 * @param {RecordType} object - The to-be copied record
 * @param {Iterable<KeyType>} keys - The to-be removed keys from the record
 * @returns {Omit<RecordType, KeyType>}
 */
function CommonOmit(object, keys) {
	const ret = { ...object };
	for (const k of keys) {
		delete ret[k];
	}
	return ret;
}

/**
 * Create a copy of the passed record with all specified keys removed
 * @template {keyof RecordType} KeyType
 * @template {{}} RecordType
 * @param {RecordType} object - The to-be copied record
 * @param {Iterable<KeyType>} keys - The to-be removed keys from the record
 * @returns {Pick<RecordType, KeyType>}
 */
function CommonPick(object, keys) {
	const ret = /** @type {Pick<RecordType, KeyType>} */({});
	for (const k of keys) {
		ret[k] = object[k];
	}
	return ret;
}

/**
 * Iterate through the passed iterable and yield index/value pairs.
 * @template T
 * @param {Iterable<T>} iterable - The to-be iterated iterable
 * @param {number} start - The starting index
 * @param {number} step - The step size in which the index is incremented
 * @returns {Generator<[index: number, value: T], void>}
 */
function* CommonEnumerate(iterable, start=0, step=1) {
	let i = start;
	for (const item of iterable) {
		yield [i, item];
		i += step;
	}
}

/**
 * Return a value clamped to a minimum and maximum
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function CommonClamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

/**
 * Return value % divisor but properly handling negative values
 *
 * Useful if you have a set of keys and want to move an index within its bounds with proper wrap-around.
 *
 * @param {number} value
 * @param {number} divisor
 */
function CommonModulo(value, divisor) {
	return Math.abs((divisor + value) % divisor);
}

/**
 * Returns TRUE if the URL is valid, is from http or https or screens/ or backgrounds/ and has the required extension
 * @param {string} TestURL - The URL to test
 * @param {readonly string[]} Extension - An array containing the valid extensions
 * @returns {boolean}
*/
function CommonURLHasExtension(TestURL, Extension) {
	if ((TestURL == null) || (typeof TestURL !== "string") || (Extension == null) || !CommonIsArray(Extension)) return false;
	try {
		const Url = new URL(TestURL);
		if ((Url.protocol !== 'http:') && (Url.protocol !== 'https:')) return false;
		let FormatUrl = Url.pathname.trim().toLowerCase();
		for (let Ext of Extension)
			if (FormatUrl.endsWith(Ext))
				return true;
	} catch (err) {
		let FormatUrl = TestURL.trim().toLowerCase();
		if ((FormatUrl.startsWith("screens/")) || (FormatUrl.startsWith("backgrounds/")))
			for (let Ext of Extension)
				if (FormatUrl.endsWith(Ext))
					return true;
	}
	return false;
}

/**
 * Return whether two records are equivalent for all fields as returned by {@link Object.keys}.
 * @note does *not* support the comparison of nested structures.
 * @template T
 * @param {T} rec1
 * @param {unknown} rec2
 * @returns {rec2 is T}
 */
function CommonObjectEqual(rec1, rec2) {
	if (!CommonIsObject(rec1) || !CommonIsObject(rec2)) {
		return false;
	}

	const entries1 = Object.entries(rec1);
	const keys2 = Object.keys(rec2);
	if (entries1.length !== keys2.length) {
		return false;
	}
	return entries1.every(([k, v]) => rec2[k] === v);
}

/**
 * Return if the key/value pairs of `subRec` form a subset of `superRec`
 * @template T
 * @param {unknown} subRec
 * @param {T} superRec
 * @returns {subRec is Partial<T>}
 */
function CommonObjectIsSubset(subRec, superRec) {
	if (!CommonIsObject(subRec) || !CommonIsObject(superRec)) {
		return false;
	}
	const entries = Object.entries(subRec);
	return entries.every(([k, v]) => superRec[k] === v);
}

/**
 * Returns the object with keys and values reversed
 * @param {object} obj
 */
function CommonObjectFlip(obj) {
	return Object.keys(obj).reduce((ret, key) => {
		ret[obj[key]] = key;
		return ret;
	  }, {});
}

/**
 * Parse the passed stringified JSON data and catch any exceptions.
 * Exceptions will cause the function to return `undefined`.
 * @param {string} data
 * @returns {any}
 * @see {@link JSON.parse}
 */
function CommonJSONParse(data) {
	try {
		return JSON.parse(data);
	} catch (error) {
		console.error(error, data);
		return undefined;
	}
}

/**
 * Translates the current event into movement directions
 *
 * This returns a layout independent u/d/l/r string
 *
 * @param {KeyboardEvent} event
 * @returns {"u"|"d"|"l"|"r"|undefined}
 */
function CommonKeyMove(event, allowArrowKeys = true) {
	if (event.code === "KeyW" || allowArrowKeys && event.code === "ArrowUp") {
		return "u";
	} else if (event.code === "KeyA" || allowArrowKeys && event.code === "ArrowLeft") {
		return "l";
	} else if (event.code === "KeyS" || allowArrowKeys && event.code === "ArrowDown") {
		return "d";
	} else if (event.code === "KeyD" || allowArrowKeys && event.code === "ArrowRight") {
		return "r";
	}
	return undefined;
}

/**
 * A {@link Set.has}/{@link Map.has} version annotated to return a type guard.
 * @template T
 * @param {{ has: (key: T) => boolean }} obj The set or map in question
 * @param {unknown} key The key to search for
 * @returns {key is T} Whether the object contains the passed key
 */
function CommonHas(obj, key) {
	return obj.has(/** @type {T} */(key));
}

/**
 * Defines a property with the given name and the passed setter and getter
 * @example
 * CommonDeprecate(
 *  "OldFunc",
 *  function NewFunc (a, b) { return a + b; },
 * );
 * @template {any} T
 * @param {string} propertyName - The name for the new property
 * @param {()=>T} getter - The getter function for the property
 * @param {(T)=>void} setter - The setter function for the property
 */
function CommonProperty(propertyName, getter = undefined, setter = undefined) {
	if(window[propertyName] !== undefined)
	{
		throw new Error(`The name ${setter} already exists.`);
	}

	getter ??= function(){ throw Error(`Property "${propertyName}" has no getter defined`); };
	setter ??= function(){ throw Error(`Property "${propertyName}" has no setter defined`); };

	Object.defineProperty(window, propertyName, {
		enumerable: true,
		configurable: true,
		get: function() {
			return getter();
		},
		set: function(val) { setter(val); },
	});
}

/**
 * Assign a function to the passed namespace, creating a deprecated and non-deprecated symbol.
 * Both symbols will are in fact get/set wrappers around the same object, enforcing that `namespace[oldName] === namespace[callback.name]` *always* holds.
 * @example
 * CommonDeprecateFunction(
 *  "OldFunc",
 *  function NewFunc (a, b) { return a + b; },
 * );
 * @template {(...any) => any} T
 * @param {string} oldName - The old (deprecated) name of the symbol
 * @param {T} callback - The function with its new name
 * @param {Record<string, any>} namespace - The namespace wherein the new and old names will be stored
 */
function CommonDeprecateFunction(oldName, callback, namespace=globalThis) {
	const newName = callback.name;
	if (!newName) {
		throw new Error("Passed function lacks a name");
	} else if (newName === oldName) {
		throw new Error(`Callback name (${newName}) and oldName (${oldName}) must not be equivalent`);
	}

	const privateName = `_${newName}`;
	namespace[privateName] = callback;

	window[newName].get = function() { return namespace[privateName]; };
	window[newName].set = function(val) { namespace[privateName] = val; };

	Object.defineProperty(window, oldName, {
		enumerable: true,
		configurable: true,
		get: function() {
			console.warn(`"${oldName}" is deprecated, use "${newName}" instead`);
			return namespace[privateName];
		},
		set: function(val) { namespace[privateName] = val; },
	});
}

/**
 * Capitalize the first character of the passed string.
 * @template {string} T
 * @param {T} string
 * @returns {Capitalize<T>}
 */
function CommonCapitalize(string) {
	return /** @type {Capitalize<T>} */(string ? `${string[0].toUpperCase()}${string.slice(1)}` : "");
}

/**
 * Construct an object for holding arbitrary (user-specified) values with a mechanism to reset them to a default
 * @template T1
 * @template [T2={}]
 * @param {T1} defaults - Default values that should be restored upon reset
 * @param {null | T2} extraVars - Extra values that should *not* affected by resets
 * @param {null | { replacer?: (this: any, key: string, value: any) => any, reviver?: (this: any, key: string, value: any) => any }} resetCallbacks - Extra callbacks for affecting the deep cloning process on reset.
 * Generally only relevant if one of the fields contains non-JSON-serializible data.
 * @returns {VariableContainer<T1, T2>} - The newly created object
 */
function CommonVariableContainer(defaults, extraVars=null, resetCallbacks=null) {
	// @ts-ignore
	extraVars ??= {};
	const ret = Object.assign(
		extraVars,
		defaults,
		{
			Defaults: defaults,
			Reset: () => {
				Object.assign(ret, CommonCloneDeep(ret.Defaults, resetCallbacks?.reviver, resetCallbacks?.replacer));
			},
		},
	);
	ret.Reset();
	return ret;
}