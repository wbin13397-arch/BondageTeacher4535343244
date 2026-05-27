"use strict";
var Inventory = [{ Name: "Phone" }];
var InventoryIndex = 0;

/**
 * Adds a new item to the player inventory
 * @param {string} ItemName - The name of the item to add
 * @returns {void} - Nothing
 */
function InventoryAdd(ItemName) {

	// Do not add if it's already in inventory
	for (let I of Inventory)
		if (I.Name === ItemName)
			return;

	// Adds the item
	Inventory.push({ Name: ItemName });

}

/**
 * Removes an item from the player inventory
 * @param {string} ItemName - The name of the item to delete
 * @returns {void} - Nothing
 */
function InventoryDelete(ItemName) {

	// Do not add if it's already in inventory
	let Index = -1;
	for (let I = 0; I < Inventory.length; I++)
		if (Inventory[I].Name === ItemName)
			Index = I;

	// If we found the item, we delete it
	if (Index >= 0) Inventory.splice(Index, 1);

}

/**
 * Returns TRUE if an item is available in the player inventory
 * @param {string} ItemName - The item name to evaluate
 * @returns {boolean} - TRUE if available
 */
function InventoryAvailable(ItemName) {
	for (let I of Inventory)
		if (I.Name === ItemName)
			return true;
	return false;
}

/**
 * Loads the inventory slideshow screen
 * @returns {void} - Nothing
 */
function InventoryLoad() {
	InventoryIndex = 0;
}

/**
 * Runs the inventory slideshow screen
 * @returns {void} - Nothing
 */
function InventoryRun() {
	let BackgroundURL = `Screen/Character/Inventory/Background/${Inventory[InventoryIndex].Name}.jpg`;
	DrawImageResize(BackgroundURL, 0, 0, 2000, 1000);
	//DrawRoomBackground(, DrawRectMakeRect(0, 0, 2000, 1000), {});
    DrawText(TextGet("Desc" + Inventory[InventoryIndex].Name), 550, 930, "Black", "Silver");
    DrawButton(1100, 900, 250, 60, TextGet("Previous"), "White", "");
    DrawButton(1400, 900, 250, 60, TextGet("Next"), "White", "");
    DrawButton(1700, 900, 250, 60, TextGet("Exit"), "White", "");
}

/**
 * Handles the click in the inventory slideshow screen
 * @returns {void} - Nothing
 */
function InventoryClick() {

    // When the user clicks on "Previous", we focus the previous item in the list
	if (MouseIn(1100, 900, 250, 60) && (Inventory.length >= 2)) {
        InventoryIndex--;
        if (InventoryIndex < 0) InventoryIndex = Inventory.length - 1;
    }

    // When the user clicks on "Next", we focus the next item in the list
	if (MouseIn(1400, 900, 250, 60) && (Inventory.length >= 2)) {
        InventoryIndex++;
        if (InventoryIndex >= Inventory.length) InventoryIndex = 0;
    }

    // When the user clicks on "Exit", we return to the character profile screen
	if (MouseIn(1700, 900, 250, 60)) CommonSetScreen("Character", "Profile");

}