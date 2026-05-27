"use strict";

/**
 * Handles the value of a HTML element. It sets the value of the element when the Value parameter is provided or it returns the value when the parameter is omitted
 * @param {string} ID - The id of the element for which we want to get/set the value.
 * @param {string} [Value] - The value to give to the element (if applicable)
 * @returns {string} - The value of the element (When no value parameter was passed to the function)
 */
function ElementValue(ID, Value) {
	const e = /** @type {HTMLInputElement} */(document.getElementById(ID));
	if (!e) {
		console.error("ElementValue called on a missing element: " + ID.toString());
		return "";
	}
	if (Value == null)
		return e.value.trim();
	e.value = Value;
	return "";
}

/**
 * Disable all clickable elements within `root` for the given duration.
 * @param {Element} root - The root element
 * @param {null | string} [query] - The query for identifying all clickable elements within `root`
 * @param {number} [timeout] - The timeout in ms
 * @returns {number} - The timeout ID as returned by {@link setTimeout}
 */
function ElementClickTimeout(root, query=null, timeout=250) {
	query ??= "button,a,input,select,radio,[role='button'],[role='link']";
	const elemClickable = /** @type {HTMLElement[]} */(Array.from(root.querySelectorAll(query)));
	const elemDisabledStates = elemClickable.map(e => /** @type {const} */([e, e.getAttribute("disabled"), e.getAttribute("aria-disabled")]));
	elemDisabledStates.forEach(([e, disabled, ariaDisabled]) => {
		if (!disabled && ariaDisabled !== "true") {
			e.setAttribute("disabled", "true");
			e.setAttribute("aria-disabled", "true");
		}
	});
	return setTimeout(() => {
		elemDisabledStates.forEach(([e, disabled, ariaDisabled]) => {
			if (!disabled) {
				e.removeAttribute("disabled");
			}
			if (ariaDisabled !== "true") {
				e.removeAttribute("aria-disabled");
			}
		});
	}, timeout);
}

/**
 * Handles the content of a HTML element. It sets the content of the element when the Content parameter is provided or it returns the value when the parameter is omitted
 * @param {string} ID - The id of the element for which we want to get/set the value.
 * @param {string} [Content] - The content/inner HTML to give to the element (if applicable)
 * @returns {string} - The content of the element (When no Content parameter was passed to the function)
 */
function ElementContent(ID, Content) {
	const e = document.getElementById(ID);
	if (!e) {
		console.error("ElementContent called on a missing element: " + ID.toString());
		return "";
	}

	if (Content == null)
		return e.innerHTML;

	e.innerHTML = Content;
	return "";
}

/** @satisfies {ElementNoParent} */
const ElementNoParent = 0;

/**
 * @template {keyof HTMLElementScalarTagNameMap} T
 * @param {HTMLOptions<T>} options - Options for customizing the element
 * @returns {HTMLElementTagNameMap[T]} - The created element
 */
function ElementCreate(options) {
	const elem = document.createElement(options.tag);

	for (const [k, v] of Object.entries(options.attributes ?? {})) {
		if (v != null) {
			elem.setAttribute(k, v);
		}
	}
	for (const [eventName, listener] of Object.entries(options.eventListeners ?? {})) {
		if (listener != null) {
			elem.addEventListener(eventName, listener);
		}
	}
	for (const [k, v] of Object.entries(options.style ?? {})) {
		if (v != null) {
			elem.style.setProperty(k, /** @type {any} */(v));
		}
	}
	for (const [k, v] of Object.entries(options.dataAttributes ?? {})) {
		if (v != null) {
			elem.dataset[k] = v.toString();
		}
	}
	for (const cls of options.classList ?? []) {
		if (cls != null) {
			elem.classList.add(cls);
		}
	}

	if (options.innerHTML) { elem.innerHTML = options.innerHTML; }

	/** @type {(i: unknown) => i is Node | string} */
	const isNode = (i) => typeof i === "string" || (typeof i === "object" && "nodeValue" in i);
	for (const childElem of options.children ?? []) {
		if (childElem != null) {
			if (isNode(childElem)) {
				elem.append(childElem);
			} else {
				ElementCreate({ ...childElem, parent: elem });
			}
		}
	}
	if (options.parent) { options.parent.appendChild(elem); }
	return elem;
}

/**
 * Creates a new form element in the main document.
 * @param {string} ID - The id of the form to create
 * @returns {HTMLFormElement}
 */
function ElementCreateForm(ID) {
	return /** @type {HTMLFormElement} */ (document.getElementById(ID)) ?? ElementCreate({
		tag: "form",
		attributes: {
			id: ID,
			name: ID,
			method: "dialog",
			["screen-generated"]: CurrentScreen,
		},
		parent: document.body,
	});
}

/**
 * Creates a new text area element in the main document. Does not create a new element if there is already an existing one with the same ID
 * @param {string} ID - The id of the text area to create.
 * @param {HTMLElement} [form] - The form the element belongs to
 * @returns {HTMLTextAreaElement}
 */
function ElementCreateTextArea(ID, form) {
	return /** @type {HTMLTextAreaElement} */ (document.getElementById(ID)) ?? ElementCreate({
		tag: "textarea",
		attributes: {
			id: ID,
			name: ID,
			["screen-generated"]: CurrentScreen,
		},
		parent: form ?? document.body,
		classList: ["HideOnPopup"],
	});
}

/**
 * Blur event listener for `number`-based `<input>` elements that automatically sanitizes the input value the moment the element is deselected.
 * @this {HTMLInputElement}
 * @param {FocusEvent} event
 */
function ElementNumberInputBlur(event) {
	let value = "";
	if (Number.isNaN(this.valueAsNumber)) {
		value = this.defaultValue;
	} else {
		const min = this.min ? Number(this.min) : -Infinity;
		const max = this.max ? Number(this.max) : Infinity;
		const requiresInt = this.inputMode === "numeric";
		value = CommonClamp(
			requiresInt ? Math.round(this.valueAsNumber) : this.valueAsNumber,
			Number.isNaN(min) ? -Infinity : min,
			Number.isNaN(max) ? Infinity : max,
		).toString();
	}

	if (value !== this.value) {
		this.value = value;
		this.dispatchEvent(new Event("input"));
		this.dispatchEvent(new Event("change"));
	}
}

/**
 * Creates a new text input element in the main document.Does not create a new element if there is already an existing one with the same ID
 * @param {string} ID - The id of the input tag to create.
 * @param {string} Type - Type of the input tag to create.
 * @param {string} Value - Value of the input tag to create.
 * @param {string | number} [MaxLength] - Maximum input tag of the input to create.
 * @returns {HTMLInputElement} - The created HTML input element
 */
function ElementCreateInput(ID, Type, Value, MaxLength) {

	let e = /** @type {HTMLInputElement} */ (document.getElementById(ID));
	if (e) return e;

	e = ElementCreate({
		tag: "input",
		attributes: {
			id: ID,
			name: ID,
			type: Type,
			value: Value,
			maxLength: typeof MaxLength === "number" ? MaxLength : Number.parseInt(MaxLength, 10)
		},
		parent: document.body,
		eventListeners: {
			focus() { this.removeAttribute("readonly"); },
		},
	});

	switch (Type) {
		case "number":
			e.inputMode = "numeric";
			e.addEventListener("blur", ElementNumberInputBlur);
			break;
	}

	return e;

}

/**
 * Creates a new range input element in the main document. Does not create a new element if there is already an
 * existing one with the same id
 * @param {string} id - The id of the input tag to create
 * @param {number} value - The initial value of the input
 * @param {number} min - The minimum value of the input
 * @param {number} max - The maximum value of the input
 * @param {number} step - The increment size of the input
 * @param {ThumbIcon} [thumbIcon] - The icon to use for the range input's "thumb" (handle). If not set, the slider will
 * have a default appearance with no custom thumb.
 * @param {boolean} [vertical] - Whether this range input is a vertical slider (defaults to false)
 * @returns {HTMLInputElement} - The created HTML input element
 */
function ElementCreateRangeInput(id, value, min, max, step, thumbIcon, vertical) {
	return /** @type {HTMLInputElement} */ (document.getElementById(id)) ?? ElementCreate({
		tag: "input",
		attributes: {
			id,
			name: id,
			type: "range",
			min: min.toString(),
			max: max.toString(),
			step: step.toString(),
			value: value.toString(),
			["screen-generated"]: CurrentScreen,
		},
		dataAttributes: thumbIcon ? { thumb: thumbIcon.toLowerCase() } : {},
		parent: document.body,
		classList: vertical ? ["HideOnPopup", "Vertical"] : ["HideOnPopup"],
		eventListeners: {
			focus() { this.removeAttribute("readonly"); },
		},
	});
}

/**
 * Creates a dropdown element and adjusts it to the BC look and feel. In the HTML Code this will look like this:
 * <div> -- enclosing div used for css and postioning
 *     <select> -- the select statement with its options
 *         <option 1>
 *         <option n>
 *     </select>
 *     <div></div> -- the div representing the currently selected item
 *     <div> -- div for the various options
 *        <div>Option 1</div>
 *        <div>Option n</div>
 *     </div>
 * </div>
 * This construct is built automatically and ignores the original select statement. All the logic is handled by
 * event handlers that are connected to the various divs. See comments in the code.
 * What this function cannot handle at the moment:
 * - The size is always set to 1
 * - Multiple selects are impossible
 * @param {string} id - The name of the select item. The outer div will get this name, for positioning. The select
 * tag will get the name ID+"-select"
 * @param {readonly string[]} Options - The list of options for the current select statement
 * @param {null | ((this: HTMLSelectElement, event: Event) => any)} [ClickEventListener=null] - An event listener to be called, when the value of the drop down box changes
 * @returns {HTMLDivElement} - The created element
 */
function ElementCreateDropdown(id, Options, ClickEventListener) {
	if (document.getElementById(id) != null) {
		return /** @type {HTMLDivElement} */(document.getElementById(id));
	}

	document.addEventListener("click", ElementCloseAllSelect);
	return ElementCreate({
		tag: "div",
		classList: ["custom-select"],
		attributes: { id },
		parent: document.body,
		children: [
			{
				tag: "select",
				attributes: { id: `${id}-select`, name: `${id}-select` },
				eventListeners: { change: ClickEventListener ?? undefined },
				children: Options.map(option => {
					return {
						tag: "option",
						attributes: { value: option },
						children: [option],
					};
				}),
			},
			{
				tag: "div",
				classList: ["select-selected"],
				children: [Options[0]],
				eventListeners: {
					click(e) {
						//when the select box is clicked, close any other select boxes, and open/close the current select box:
						e.stopPropagation();
						ElementCloseAllSelect(this);
						this.nextElementSibling.classList.toggle("select-hide");
					},
				},
			},
			{
				tag: "div",
				classList: ["select-items", "select-hide"],
				children: Options.map(option => {
					return {
						tag: "div",
						children: [option],
						eventListeners: {
							click() {
								// when an item is clicked, update the original select box, and the selected item:
								const selectedItem = /** @type {HTMLDivElement} */(this.parentElement.previousSibling);
								const select = /** @type {HTMLSelectElement} */(selectedItem.previousSibling);
								for (let j = 0; j < select.length; j++) {
									if (select.options[j].innerHTML != this.innerHTML) {
										continue;
									}

									select.selectedIndex = j; // Fake the selection of an option
									selectedItem.innerHTML = this.innerHTML; // Update the drop down box
									var y = this.parentElement.getElementsByClassName("same-as-selected");
									for (let k = 0; k < y.length; k++) {
										y[k].classList.remove("same-as-selected");
									}
									this.classList.add("same-as-selected");
									break;
								}
								selectedItem.click(); // Evove a click events
								select.dispatchEvent(new Event("change")); // Evoke a onChange events
							},
						},
					};
				}),
			},
		],
	});
}

/**
 * Closes all select boxes in the current document, except the current select box
 * @param {object} elmnt - The select box to exclude from the closing
 * @returns {void} - Nothing
 */
function ElementCloseAllSelect(elmnt) {
	/*a function that will close all select boxes in the document,
	except the current select box:*/
	var arrNo = [];
	var y = document.getElementsByClassName("select-selected");
	for (let i = 0; i < y.length; i++) {
		if (elmnt == y[i]) arrNo.push(i);
	}
	var x = document.getElementsByClassName("select-items");
	for (let i = 0; i < x.length; i++) {
		if (arrNo.indexOf(i)) x[i].classList.add("select-hide");
	}
}

/**
 * Creates a new div element in the main document. Does not create a new element if there is already an existing one with the same ID
 * @param {string} ID - The id of the div tag to create.
 * @returns {HTMLDivElement} - The created (or pre-existing) div element
 */
function ElementCreateDiv(ID) {
	return /** @type {HTMLDivElement} */(document.getElementById(ID)) ?? ElementCreate({
		tag: "div",
		attributes: {
			id: ID,
			["screen-generated"]: CurrentScreen,
		},
		parent: document.body,
		classList: ["HideOnPopup"],
	});
}

/**
 * Removes an element from the main document
 * @param {string} ID - The id of the tag to remove from the document.
 * @returns {void} - Nothing
 */
function ElementRemove(ID) {
	if (document.getElementById(ID) != null)
		document.getElementById(ID).parentNode.removeChild(document.getElementById(ID));
}

/**
 * Draws an existing HTML element at a specific position within the document. The element is "centered" on the given coordinates by dividing its height and width by two.
 * @param {string} ElementID - The id of the input tag to (re-)position.
 * @param {number} X - Center point of the element on the X axis.
 * @param {number} Y - Center point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} [H] - Height of the element.
 * @returns {void} - Nothing
 */
function ElementPosition(ElementID, X, Y, W, H) {
	var E = document.getElementById(ElementID);

	if (!E) {
		console.warn("A call to ElementPosition was made on non-existent element with ID '" + ElementID + "'");
		return;
	}

	// For a vertical slider, swap the width and the height (the transformation is handled by CSS)
	if (E.tagName.toLowerCase() === "input" && E.getAttribute("type") === "range" && E.classList.contains("Vertical")) {
		var tmp = W;
		W = H;
		H = tmp;
	}

	// Different positions based on the width/height ratio
	const HRatio = DrawMainCanvas.canvas.clientHeight / 1000;
	const WRatio = DrawMainCanvas.canvas.clientWidth / 2000;
	const Font = DrawMainCanvas.canvas.clientWidth <= DrawMainCanvas.canvas.clientHeight * 2 ? DrawMainCanvas.canvas.clientWidth / 50 : DrawMainCanvas.canvas.clientHeight / 25;
	const Height = H ? H * HRatio : 4 + Font * 1.15;
	const Width = W * WRatio;
	const Top = DrawMainCanvas.canvas.offsetTop + Y * HRatio - Height / 2;
	const Left = DrawMainCanvas.canvas.offsetLeft + (X - W / 2) * WRatio;

	// Sets the element style
	Object.assign(E.style, {
		fontSize: Font + "px",
		fontFamily: CommonGetFontName(),
		position: "fixed",
		left: Left + "px",
		top: Top + "px",
		width: Width + "px",
		height: Height + "px",
	});
}

/**
 * Draws an existing HTML element at a specific position within the document. The element will not be centered on its given coordinates unlike the ElementPosition function.
 * Not same as ElementPositionFix. Calculates Font size itself.
 * @param {string} ElementID - The id of the input tag to (re-)position.
 * @param {number} X - Starting point of the element on the X axis.
 * @param {number} Y - Starting point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} [H] - Height of the element.
 * @returns {void} - Nothing
 */
function ElementPositionFixed(ElementID, X, Y, W, H) {
	var E = document.getElementById(ElementID);
	// Verify the element exists
	if (!E) {
		console.warn("A call to ElementPositionFix was made on non-existent element with ID '" + ElementID + "'");
		return;
	}

	// Different positions based on the width/height ratio
	const HRatio = DrawMainCanvas.canvas.clientHeight / 1000;
	const WRatio = DrawMainCanvas.canvas.clientWidth / 2000;
	const Font = DrawMainCanvas.canvas.clientWidth <= DrawMainCanvas.canvas.clientHeight * 2 ? DrawMainCanvas.canvas.clientWidth / 50 : DrawMainCanvas.canvas.clientHeight / 25;
	const Top = DrawMainCanvas.canvas.offsetTop + Y * HRatio;
	const Height = H ? H * HRatio : Font * 1.15;
	const Left = DrawMainCanvas.canvas.offsetLeft + X * WRatio;
	const Width = W * WRatio;

	// Sets the element style
	Object.assign(E.style, {
		fontSize: Font + "px",
		fontFamily: CommonGetFontName(),
		position: "fixed",
		left: Left + "px",
		top: Top + "px",
		width: Width + "px",
		height: Height + "px",
	});

}

/**
 * Draws an existing HTML element at a specific position within the document. The element will not be centered on its given coordinates unlike the ElementPosition function.
 * @param {string} ElementID - The id of the input tag to (re-)position.
 * @param {number} Font - The size of the font to use.
 * @param {number} X - Starting point of the element on the X axis.
 * @param {number} Y - Starting point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} H - Height of the element.
 * @returns {void} - Nothing
 */
function ElementPositionFix(ElementID, Font, X, Y, W, H) {
	var E = document.getElementById(ElementID);
	// Verify the element exists
	if (!E) {
		console.warn("A call to ElementPositionFix was made on non-existent element with ID '" + ElementID + "'");
		return;
	}

	// Different positions based on the width/height ratio
	const HRatio = DrawMainCanvas.canvas.clientHeight / 1000;
	const WRatio = DrawMainCanvas.canvas.clientWidth / 2000;
	Font *= Math.max(HRatio, WRatio);
	const Top = DrawMainCanvas.canvas.offsetTop + Y * HRatio;
	const Height = H * HRatio;
	const Left = DrawMainCanvas.canvas.offsetLeft + X * WRatio;
	const Width = W * WRatio;

	// Sets the element style
	Object.assign(E.style, {
		fontSize: Font + "px",
		fontFamily: CommonGetFontName(),
		position: "fixed",
		left: Left + "px",
		top: Top + "px",
		width: Width + "px",
		height: Height + "px",
	});

}

/**
 * Sets a custom data-attribute to a specified value on a specified element
 * @param {string} ID - The id of the element to create/set the data attribute of.
 * @param {string} Name - Name of the data attribute. ("data-" will be automatically appended to it.)
 * @param {string} Value - Value to give to the attribute.
 * @returns {void} - Nothing
 */
function ElementSetDataAttribute(ID, Name, Value) {
	var element = document.getElementById(ID);
	if (element != null) {
		element.setAttribute(("data-" + Name).toLowerCase(), Value.toString().toLowerCase());
	}
}

/**
 * Sets an attribute to a specified value on a specified element
 * @param {string} ID - The id of the element to create/set the data attribute of.
 * @param {string} Name - Name of the attribute.
 * @param {string} Value - Value to give to the attribute.
 * @returns {void} - Nothing
 */
function ElementSetAttribute(ID, Name, Value) {
	var element = document.getElementById(ID);
	if (element != null) {
		element.setAttribute(Name, Value);
	}
}

/**
 * Removes an attribute from a specified element.
 * @param {string} ID - The id of the element from which to remove the attribute.
 * @param {string} Name - Name of the attribute to remove.
 * @returns {void} - Nothing
 */
function ElementRemoveAttribute(ID, Name) {
	var element = document.getElementById(ID);
	if (element != null) {
		element.removeAttribute(Name);
	}
}

/**
 * Scrolls to the end of a specified element
 * @param {string} ID - The id of the element to scroll down to the bottom of.
 * @returns {void} - Nothing
 */
function ElementScrollToEnd(ID) {
	var element = document.getElementById(ID);
	if (element != null) element.scrollTop = element.scrollHeight;
}

/**
 * Returns the given element's scroll position as a percentage, with the top of the element being close to 0 depending on scroll bar size, and the bottom being around 1.
 * To clarify, this is the position of the bottom edge of the scroll bar.
 * @param {string} ID - The id of the element to find the scroll percentage of.
 * @returns {(number|null)} - A float representing the scroll percentage.
 */
function ElementGetScrollPercentage(ID) {
	var element = document.getElementById(ID);
	if (element != null) {
		if (element.scrollTop === 0) return 0;
		return (element.scrollTop + element.clientHeight) / element.scrollHeight;
	}

	return null;
}

/**
 * Checks if a given HTML element is scrolled to the very bottom.
 * @param {string} ID - The id of the element to check for scroll height.
 * @returns {boolean} - Returns TRUE if the specified element is scrolled to the very bottom
 */
function ElementIsScrolledToEnd(ID) {
	var element = document.getElementById(ID);
	return element != null && element.scrollHeight - element.scrollTop - element.clientHeight <= 1;
}

/**
 * Sets the scroll position of an element to a specified percentage of its scrollable content.
 * Ideally scroll percentage should be gotten with {@link ElementGetScrollPercentage}
 *
 * @param {string} ID
 * @param {number} scrollPercentage
 * @param {ScrollBehavior} scrollBehavior
 * @returns {void}
 */
function ElementSetScrollPercentage(ID, scrollPercentage, scrollBehavior = 'auto') {
	const element = document.getElementById(ID);
	if (!element) {
		console.error(`Element with ID "${ID}" not found.`);
		return;
	}

	if (scrollPercentage < 0 || scrollPercentage > 1) {
		console.error("scrollPercentage must be between 0 and 1 (inclusive).");
		return;
	}

	const scrollHeight = element.scrollHeight;
	const clientHeight = element.clientHeight;
	const newScrollTop = Math.max(0, (scrollPercentage * scrollHeight - clientHeight)); // Clamp to 0 for valid range

	element.scrollTo({
		top: newScrollTop,
		behavior: scrollBehavior
	});
}

/**
 * Gives focus to a specified existing element for non-mobile users.
 * @param {string} ID - The id of the element to give focus to.
 * @returns {void} - Nothing
 */
function ElementFocus(ID) {
	if ((document.getElementById(ID) != null) && !CommonIsMobile)
		document.getElementById(ID).focus();
}

/**
 * Toggles (non-nested) HTML elements that were created by a given screen. When toggled off, they are hidden (not removed)
 * @param {string} Screen - Screen for which to hide the elements generated
 * @param {boolean} ShouldDisplay - TRUE if we are toggling on the elements, FALSE if we are hiding them.
 */
function ElementToggleGeneratedElements(Screen, ShouldDisplay) {
	const displayState = ShouldDisplay ? "" : "none";
	const elements = /** @type {HTMLElement[]} */(Array.from(document.querySelectorAll(`[screen-generated="${Screen}"]`)));
	for (const e of elements) {
		if (e.parentElement === null || e.parentElement === document.body) {
			e.style.display = displayState;
		}
	}
}

/**
 * Construct a search-based `<input>` element that offers suggestions based on the passed callbacks output.
 * The search suggestions are constructed lazily once the search input is focused.
 * @example
 * <input type="search" id={id} list={`${id}-datalist`}>
 *     <datalist id={`${id}-datalist`}>
 *         <option value="..." />
 *         ...
 *     </datalist>
 * </input>
 * @param {string} id - The ID of the to-be created search input; `${id}-datalist` will be assigned the search input's datalist
 * @param {() => Iterable<string>} dataCallback - A callback returning all values that will be converted into a datalist `<option>`
 * @param {Object} [options]
 * @param {null | string} [options.value] - Value of the search input
 * @param {null | Node} [options.parent] - The parent element of the search input; defaults to {@link document.body}
 * @param {null | number} [options.maxLength] - Maximum input length of the search input
 * @returns {HTMLInputElement} - The newly created search input
 */
function ElementCreateSearchInput(id, dataCallback, options=null) {
	let elem = /** @type {HTMLInputElement | null} */(document.getElementById(id));
	if (elem) {
		console.error(`Element "${id}" already exists`);
		return elem;
	}
	options ??= {};
	elem = ElementCreateInput(id, "search", options.value ?? "", options.maxLength, options.parent);
	elem.appendChild(ElementCreate({ tag: "datalist", attributes: { id: `${id}-datalist` } }));
	elem.setAttribute("list", `${id}-datalist`);
	elem.addEventListener("focus", async function() {
		if (this.list?.children.length !== 0) return;
		for (const value of dataCallback())
			this.list.appendChild(ElementCreate({ tag: "option", attributes: { value } }));
	});
	return elem;
}

/**
 * Return whether an element is visible or not.
 * Approximate polyfill of [`Element.checkVisibility()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility),
 * as its browser support is still somewhat limited (~88% at the time of writing).
 * @param {Element} el - The element in question
 * @param {CheckVisibilityOptions} [options] - Additional options to-be passed to `Element.checkVisibility()`
 * @returns {boolean} - Whether the passed element is visible or not
 */
function ElementCheckVisibility(el, options) {
	if (!el) return false;
	if (typeof el.checkVisibility === "function") {
		options ??= {};
		return el.checkVisibility({ ...options, checkVisibilityCSS: options.checkVisibilityCSS ?? true });
	} else {
		// @ts-expect-error: Element does not expose style but HTMLElement does
		return (!el.style || el.style.display !== "none") && getComputedStyle(el).display !== "none";
	}
}
