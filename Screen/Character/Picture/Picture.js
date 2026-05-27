"use strict";
var Picture = [];
var PictureList = [];
var PictureFlash = 0;
var PictureFlashTimer = 1000;
var PictureIndex = 0;
var PictureBlocked = false;
var PictureDefault = [
	{
		Character: "Teacher",
		Module: "Character",
		Screen: "Picture",
		Name: "TeacherBeach1"
	},
	{
		Character: "Teacher",
		Module: "Character",
		Screen: "Picture",
		Name: "TeacherBeach2"
	},
	{
		Character: "Teacher",
		Module: "Character",
		Screen: "Picture",
		Name: "TeacherBus1"
	},
	{
		Character: "Mia",
		Module: "Character",
		Screen: "Picture",
		Name: "MiaBeach1"
	},
	{
		Character: "Mia",
		Module: "Character",
		Screen: "Picture",
		Name: "MiaBeach2"
	},
	{
		Character: "Mia",
		Module: "Character",
		Screen: "Picture",
		Name: "MiaTeacherBeach1"
	},
	{
		Character: "Mia",
		Module: "Character",
		Screen: "Picture",
		Name: "MiaPajamaSleeping1"
	},
];

/**
 * Builds the picture slideshow list with an optional character filter
 * @param {string} CharacterFilter - The character name to filter on
 * @returns {void} - Nothing
 */
function PictureBuild(CharacterFilter) {
	PictureBlocked = false;
	if ((CharacterFilter == "Mia") && LogQuery("Evelyn", "PhoneControl")) PictureBlocked = true; // Evelyn can block Mia's pictures if she controls the player phone
    PictureIndex = 0;
    PictureList = [];
	if (!PictureBlocked)
    	for (let P of Picture)
        	if ((CharacterFilter == null) || (CharacterFilter == "") || (CharacterFilter === P.Character))
            	PictureList.push(P);
    CommonSetScreen("Character", "Picture");
}

/**
 * Loads the picture slideshow screen
 * @returns {void} - Nothing
 */
function PictureLoad() {
}

/**
 * Runs the picture slideshow screen
 * @returns {void} - Nothing
 */
function PictureRun() {
	if (PictureBlocked) {
		DrawText(TextGet("PictureBlocked"), 1000, 450, "Black", "Silver");
	} else {
		if (PictureList.length == 0) {
			DrawText(TextGet("NoPicture"), 1000, 450, "Black", "Silver");
		} else {
			let P = PictureList[PictureIndex];
			let BackgroundURL = `Screen/${P.Module}/${P.Screen}/Background/${P.Name}.jpg`;
			DrawImageResize(BackgroundURL, 0, 0, 2000, 1000);
		}
	}
	DrawButton(1100, 900, 250, 60, TextGet("Previous"), "White", "");
    DrawButton(1400, 900, 250, 60, TextGet("Next"), "White", "");
    DrawButton(1700, 900, 250, 60, TextGet("Exit"), "White", "");
}

/**
 * Handles the click in the picture slideshow screen
 * @returns {void} - Nothing
 */
function PictureClick() {

    // When the user clicks on "Previous", we focus the previous character in the list
	if (MouseIn(1100, 900, 250, 60) && (PictureList.length >= 2) && !PictureBlocked) {
        PictureIndex--;
        if (PictureIndex < 0) PictureIndex = PictureList.length - 1;
    }

    // When the user clicks on "Next", we focus the next character in the list
	if (MouseIn(1400, 900, 250, 60) && (PictureList.length >= 2) && !PictureBlocked) {
        PictureIndex++;
        if (PictureIndex >= PictureList.length) PictureIndex = 0;
    }
    
    // When the user clicks on "Exit", we return to the character profile screen
	if (MouseIn(1700, 900, 250, 60)) CommonSetScreen("Character", "Profile");

}

/**
 * When the player uses her phone to save a new picture of the current scene
 * @returns {void} - Nothing
 */
function PictureAdd(CharacterName) {

	// If no character is supplied, we use the current dialog one
	PictureFlash = CommonTime();
	if ((CharacterName == null) && (DialogCharacter != null)) CharacterName = DialogCharacter.Name;

	// Make sure the data is valid
	if ((DialogBackground == null) || (DialogBackground == "")) return;
	if ((CharacterName == null) || (CharacterName == "") || (CommonScreen == null) || (CommonModule == null)) return;

	// Do not save duplicated pictures
	for (let P of Picture)
		if ((P.Name === DialogBackground) && (P.Character === CharacterName) && (P.Screen === CommonScreen) && (P.Module === CommonModule))
			return;

	// Creates the new picture in the array
	Picture.push({
		Character: CharacterName,
		Module: CommonModule,
		Screen: CommonScreen,
		Name: DialogBackground
	});

}

/**
 * Called from the dialog screen, puts a white flash on the screen when a picture is taken
 * @returns {void} - Nothing
 */
function PictureFlashDraw() {
	if (PictureFlash + PictureFlashTimer < CommonTime()) return;
	let Intensity = Math.round((1 - ((CommonTime() - PictureFlash) / PictureFlashTimer)) * 256);
	if (Intensity < 0) Intensity = 0;
	if (Intensity > 255) Intensity = 255;
	Intensity = Intensity.toString(16);
	if (Intensity.length == 1) Intensity = "0" + Intensity;
	DrawRect(0, 0, 2000, 1000, "#FFFFFF" + Intensity);
}