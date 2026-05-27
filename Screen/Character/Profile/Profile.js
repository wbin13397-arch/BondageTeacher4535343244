"use strict";
var ProfileCharacter = null;
var ProfileDialog = null;
var ProfileModule = null;
var ProfileScreen = null;
var ProfileBackground = null;

/**
 * Opens the character profile screen
 * @param {Character} Char - The character object
 * @returns {void} - Nothing
 */
function ProfileOpen(Char) {
    ProfileCharacter = Char;
	ProfileDialog = CommonCloneDeep(DialogCurrent);
	DialogCurrent = null;
    ProfileScreen = CommonScreen;
    ProfileModule = CommonModule;
    ProfileBackground = CommonBackground;
	CommonSetScreen("Character", "Profile");
}

/**
 * Loads the character profile screen
 * @returns {void} - Nothing
 */
function ProfileLoad() {
	CommonBackground = "White";
}

/**
 * Returns the correct age of the character, depending if her birth week is reached or not
 * @returns {void} - Nothing
 */
function ProfileGetAge(Name) {
    let BirthWeek = TextGet("BirthWeek" + Name);
    return parseInt(TextGet("Age" + Name)) + ((CommonIsNumeric(BirthWeek) && (CommonWeek >= parseInt(BirthWeek))) ? 1 : 0);
}

/**
 * Runs the character profile screen
 * @returns {void} - Nothing
 */
function ProfileRun() {
    CharacterDefaultGrades(ProfileCharacter);
	DrawText(ProfileCharacter.DisplayName, 1250, 50, "Black", "Silver");	
    CharacterDrawMeter(ProfileCharacter, 1090, 90, "Black");
	if (ProfileCharacter.Name == "Teacher") DrawText(TextGet("MainCharacter"), 1250, 125, "Black", "Silver");
	DrawText(TextGet("Age") + " " + ProfileGetAge(ProfileCharacter.Name).toString(), 1250, 200, "Black", "Silver");
	DrawText(TextGet("Job") + " " + TextGet("Job" + ProfileCharacter.Name), 1250, 275, "Black", "Silver");
    for (let I = 0; I <= 3; I++) {
        let Suffix = "";
        if ((I == 3) && ((ProfileCharacter.Name == "Teacher") || (ProfileCharacter.Name == "Mia")) && LogQuery("Mia", "Breakup")) Suffix = "Single";
        if ((I == 3) && LogQuery(ProfileCharacter.Name, "Dominate")) Suffix = "Dominate";
        if ((I == 3) && LogQuery(ProfileCharacter.Name, "Submit")) Suffix = "Submit";
        DrawText(TextGet("Info" + ProfileCharacter.Name + I.toString() + Suffix), 1250, 350 + I * 75, "Black", "Silver");
    }
    if (ProfileCharacter.Grades != null) {
        DrawText(TextGet("Grades") + " " + ProfileCharacter.Grades.toString() + "%", 1250, 700, "Black", "Silver");
        DrawText(TextGet("Career") + " " + TextGet("Career" + ProfileCharacter.Name + Math.round(ProfileCharacter.Grades / 10).toString()), 1250, 775, "Black", "Silver");
    }
	DrawImage("Image/Character/Large/" + ProfileCharacter.Name + "Default.png", 100, 0);
	DrawButton(650, 900, 200, 60, TextGet("Previous"), "White", "");
	DrawButton(900, 900, 200, 60, TextGet("Next"), "White", "");
	DrawButton(1150, 900, 200, 60, TextGet("Picture"), "White", "");
	DrawButton(1400, 900, 200, 60, TextGet("Inventory"), "White", "");
	DrawButton(1650, 900, 200, 60, TextGet("Close"), "White", "");
    if (CheatActive() && (ProfileCharacter.Grades != null)) {
        DrawEmptyRect(1520, 660, 80, 80, "#000000", 1);
        if (!CommonIsMobile && MouseIn(1521, 661, 78, 78)) DrawRect(1521, 661, 78, 78, "#FFAACC");
        DrawImageResize("Image/Cheat/GradesBonus.png", 1521, 661, 78, 78);
        DrawEmptyRect(1620, 660, 80, 80, "#000000", 1);
        if (!CommonIsMobile && MouseIn(1621, 661, 78, 78)) DrawRect(1621, 661, 78, 78, "#FFAACC");
        DrawImageResize("Image/Cheat/GradesMalus.png", 1621, 661, 78, 78);
    }
}

/**
 * Handles the click in the character screen
 * @returns {void} - Nothing
 */
function ProfileClick() {

	// In cheat mode, we can raise or lower the current character grades
	if (CheatActive() && (ProfileCharacter.Grades != null) && MouseIn(1521, 661, 78, 78)) {
        ProfileCharacter.Grades = ProfileCharacter.Grades + 5;
        if (ProfileCharacter.Grades > 100) ProfileCharacter.Grades = 100;
	}

	// In cheat mode, we can raise or lower the current character grades
	if (CheatActive() && (ProfileCharacter.Grades != null) && MouseIn(1621, 661, 78, 78)) {
        ProfileCharacter.Grades = ProfileCharacter.Grades - 5;
        if (ProfileCharacter.Grades < 0) ProfileCharacter.Grades = 0;
	}

    // When the user clicks on "Previous", we focus the previous character in the list
	if (MouseIn(650, 900, 200, 60) && (Character.length >= 2)) {
        let Index = CharacterGetPosition(ProfileCharacter);
        Index--;
        if (Index < 0) Index = Character.length - 1;
        ProfileCharacter = Character[Index];
    }

    // When the user clicks on "Next", we focus the next character in the list
	if (MouseIn(900, 900, 200, 60) && (Character.length >= 2)) {
        let Index = CharacterGetPosition(ProfileCharacter);
        Index++;
        if (Index >= Character.length) Index = 0;
        ProfileCharacter = Character[Index];
    }

    // When the user clicks on "Pictures", we open the picture slideshow screen for that character
	if (MouseIn(1150, 900, 200, 60)) {
        PictureBuild(ProfileCharacter.Name);
    }

    // When the user clicks on "Inventory", we open the inventory slideshow screen
	if (MouseIn(1400, 900, 200, 60)) {
        CommonSetScreen("Character", "Inventory");
    }

    // When the user clicks on "Close", we return to the previous screen
	if (MouseIn(1650, 900, 200, 60)) {
        CommonSetScreen(ProfileModule, ProfileScreen, true);
        CommonBackground = ProfileBackground;
        DialogCurrent = CommonCloneDeep(ProfileDialog);
    }

}
