"use strict";
// The main game canvas where everything will be drawn
/** @type {CanvasRenderingContext2D} */
let DrawMainCanvas;

// Temporary GPU-based canvas
/** @type {CanvasRenderingContext2D} */
let DrawTempCanvas;

// A list of elements to draw at the end of the drawing process.
/** @type {Function[]} */
var DrawHoverElements = [];

// The last canvas position in format `[left, top, width, height]`
/** @type {RectTuple} */
var DrawCanvasPosition = [0, 0, 0, 0];

// A bank of all the chached images
/** @type {Map<string, HTMLImageElement>} */
const DrawCacheImage = new Map;

// An enum for the method for resizing custom backgrounds
/** @enum {number} */
var DrawingResizeMode = {Fill: 1, FillOriginalRatio: 2, ShowFullOriginalRatio: 3};

/**
 * Loads the canvas to draw on with its style and event listeners.
 * @returns {void} - Nothing
 */
function DrawLoad() {

	// Creates the objects used in the game
	DrawMainCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById("MainCanvas")).getContext("2d");
	DrawTempCanvas = document.createElement("canvas").getContext("2d");

	// Font is fixed for now, color can be set
	DrawMainCanvas.font = CommonGetFont(36);
	DrawMainCanvas.textAlign = "center";
	DrawMainCanvas.textBaseline = "middle";

}

/**
 * Converts a hex color string to a RGB color
 * @param {string} color - Hex color to conver
 * @returns {RGBColor} - RGB color
 */
function DrawHexToRGB(color) {
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	color = color.replace(shorthandRegex, function (m, r, g, b) {
		return r + r + g + g + b + b;
	});

	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : {
		r: 0,
		g: 0,
		b: 0
	};
}

/**
 * Converts a RGB color to a hex color string
 * @param {readonly number[]} color - RGB color to conver
 * @returns {string} - Hex color string
 */
function DrawRGBToHex(color) {
	const rgb = color[2] | (color[1] << 8) | (color[0] << 16);
	return '#' + (0x1000000 + rgb).toString(16).slice(1).toUpperCase();
}

/**
 * Returns the image file from cache or build it from the source
 * @param {string} Source - URL of the image
 * @returns {HTMLImageElement} - Image file
 */
function DrawGetImage(Source) {

	// Search in the cache to find the image and make sure this image is valid
	let Img = DrawCacheImage.get(Source);
	if (!Img) {
		Img = new Image;
		DrawCacheImage.set(Source, Img);
		// Keep track of image load state
		const IsAsset = (Source.indexOf("Assets") >= 0);
		if (IsAsset) {
			++DrawCacheTotalImages;
			Img.addEventListener("load", function () {
				DrawGetImageOnLoad();
			});
		}

		Img.addEventListener("error", function () {
			DrawGetImageOnError(Img, IsAsset);
		});

		// For CORS access
		Img.crossOrigin = "anonymous";
		// Start loading
		Img.src = Source;
	}

	// returns the final image
	return Img;
}

/**
 * Reloads all character canvas once all images are loaded
 * @returns {void} - Nothing
 */
function DrawGetImageOnLoad() {
	++DrawCacheLoadedImages;
	if (DrawCacheLoadedImages == DrawCacheTotalImages) CharacterLoadCanvasAll();
}

/**
 * Attempts to redownload an image if it previously failed to load
 * @param {HTMLImageElement & { errorcount?: number }} Img - Image tag that failed to load
 * @param {boolean} IsAsset - Whether or not the image is part of an asset
 * @returns {void} - Nothing
 */
function DrawGetImageOnError(Img, IsAsset) {
	if (Img.errorcount == null) Img.errorcount = 0;
	Img.errorcount += 1;
	if (Img.errorcount < 3) {
		// eslint-disable-next-line no-self-assign
		Img.src = Img.src;
		// On the third attempt, we try without the crossOrigin
		if (Img.errorcount == 2) Img.crossOrigin = null;
	} else {
		// Load failed. Display the error in the console and mark it as done.
		console.log("Error loading image " + Img.src);
		if (IsAsset) DrawGetImageOnLoad();
	}
}

/**
 * Clears a rectangle on a canvas
 * @param {CanvasRenderingContext2D} Canvas - The canvas on which to clear rect
 * @param {number} x - Position of the image on the X axis
 * @param {number} y - Position of the image on the Y axis
 * @param {number} width - Width of the rectangle to clear
 * @param {number} height - Height of the rectangle to clear
 * @returns {void} - Nothing
 */
function DrawClearRect(Canvas, x, y, width, height) {
	Canvas.clearRect(x, y, width, height);
}

/**
 * Clears alpha masks on a canvas
 * @param {CanvasRenderingContext2D} Canvas - The canvas on which to clear rect
 * @param {number} X - X offset of where the masking should be done
 * @param {number} Y - Y offset of where the masking should be done
 * @param {readonly RectTuple[]} AlphaMasks - An array of alpha masks to apply
 */
function DrawClearAlphaMasks(Canvas, X, Y, AlphaMasks) {
	if (!Array.isArray(AlphaMasks)) return;
	AlphaMasks.forEach(([x, y, w, h]) => DrawClearRect(Canvas, x - X, y - Y, w, h));
}

/**
 * Draws a zoomed image from a source to a specific canvas
 * @param {string | HTMLImageElement | HTMLCanvasElement} Source - URL of image or image itself
 * @param {CanvasRenderingContext2D} Canvas - Canvas on which to draw the image
 * @param {number} SX - The X coordinate where to start clipping
 * @param {number} SY - The Y coordinate where to start clipping
 * @param {number} SWidth - The width of the clipped image
 * @param {number} SHeight - The height of the clipped image
 * @param {number} X - Position of the image on the X axis
 * @param {number} Y - Position of the image on the Y axis
 * @param {number} Width - Width of the image
 * @param {number} Height - Height of the image
 * @param {boolean} [Invert] - Flips the image vertically
 * @returns {boolean} - whether the image was complete or not
 */
function DrawImageZoomCanvas(Source, Canvas, SX, SY, SWidth, SHeight, X, Y, Width, Height, Invert) {
	return DrawImageEx(Source, Canvas, X, Y, {
		SourcePos: [SX, SY, SWidth, SHeight],
		Width,
		Height,
		Invert
	});
}

/**
 * Draws a resized image from a source to the main canvas
 * @param {string | HTMLImageElement | HTMLCanvasElement} Source - URL of image or image itself
 * @param {number} X - Position of the image on the X axis
 * @param {number} Y - Position of the image on the Y axis
 * @param {number} Width - Width of the image after being resized
 * @param {number} Height - Height of the image after being resized
 * @returns {boolean} - whether the image was complete or not
 */
function DrawImageResize(Source, X, Y, Width, Height) {
	return DrawImageEx(Source, DrawMainCanvas, X, Y, { Width, Height });
}

/**
 * Draws a zoomed image from a source to a specific canvas
 * @param {string | HTMLImageElement | HTMLCanvasElement} Source - URL of the image
 * @param {CanvasRenderingContext2D} Canvas - Canvas on which to draw the image
 * @param {number} X - Position of the image on the X axis
 * @param {number} Y - Position of the image on the Y axis
 * @param {DrawOptions} [Options] Options to use when drawing
 * @returns {boolean} - whether the image was complete or not
 */
function DrawImageCanvas(Source, Canvas, X, Y, Options) {
	return DrawImageEx(Source, Canvas, X, Y, Options);
}

/**
 * Draws a canvas to a specific canvas
 * @param {HTMLImageElement | HTMLCanvasElement} Img - Canvas to draw
 * @param {CanvasRenderingContext2D} Canvas - Canvas on which to draw the image
 * @param {number} X - Position of the image on the X axis
 * @param {number} Y - Position of the image on the Y axis
 * @param {readonly RectTuple[]} AlphaMasks - A list of alpha masks to apply to the asset
 * @returns {boolean} - whether the image was complete or not
 */
function DrawCanvas(Img, Canvas, X, Y, AlphaMasks) {
	return DrawImageEx(Img, Canvas, X, Y, { AlphaMasks });
}

/**
 * Draws an image from a source on the main canvas
 * @param {string | HTMLImageElement | HTMLCanvasElement} Source - URL of image or image itself
 * @param {number} X - Position of the image on the X axis
 * @param {number} Y - Position of the image on the Y axis
 * @param {boolean} [Invert] - Flips the image vertically
 * @returns {boolean} - whether the image was complete or not
 */
function DrawImage(Source, X, Y, Invert) {
	return DrawImageEx(Source, DrawMainCanvas, X, Y, { Invert });
}

/**
 * Draws an image on canvas, applying all options
 * @param {string | HTMLImageElement | HTMLCanvasElement} Source - URL of image or image itself
 * @param {CanvasRenderingContext2D} Canvas - Canvas on which to draw the image
 * @param {number} X - Position of the image on the X axis
 * @param {number} Y - Position of the image on the Y axis
 * @param {DrawOptions} [Options = {}] - any extra options
 * @returns {boolean} - whether the image was complete or not
 */
function DrawImageEx(Source, Canvas, X, Y, Options) {

	let { Zoom, HexColor, FullAlpha, AlphaMasks, Alpha, Invert, Mirror, BlendingMode, Width, Height, SourcePos } = Options || {};

	let Img;

	if (typeof Source === "string") {
		Img = DrawGetImage(Source);
	} else {
		Img = Source;
	}

	if (Img instanceof HTMLImageElement) {
		if (!Img.complete) return false;
		if (!Img.naturalWidth) return true;
	}

	if (typeof Zoom !== "number")
		Zoom = 1.0;

	if (typeof HexColor !== "string")
		HexColor = null;

	if (typeof Alpha !== "number")
		Alpha = 1.0;

	Alpha = Math.max(0, Math.min(1, Alpha));
	if (Alpha === 0) return true;

	if (!BlendingMode) {
		BlendingMode = "source-over";
	}

	const sizeChanged = Width != null || Height != null;
	if (Width == null) {
		Width = SourcePos ? SourcePos[2] : Img.width;
	}
	if (Height == null) {
		Height = SourcePos ? SourcePos[3] : Img.height;
	}

	// If we need to colorize or mask, we need to copy the image to
	// a temporary canvas. On top of that, colorizing uses .getImageData
	// so we have to fallback to the CPU canvas
	let destCanvas;
	if (HexColor || AlphaMasks) {
		destCanvas = DrawTempCanvas;

		destCanvas.canvas.width = Img.width;
		destCanvas.canvas.height = Img.height;
		destCanvas.globalCompositeOperation = "copy";
		destCanvas.drawImage(Img, 0, 0);

		if (AlphaMasks) {
			// Apply masks
			DrawClearAlphaMasks(destCanvas, X, Y, AlphaMasks);
		}

		if (HexColor) {
			// We've been asked to colorize the image, fetch the pixel data
			// and massage it
			const imageData = destCanvas.getImageData(0, 0, destCanvas.canvas.width, destCanvas.canvas.height);
			const data = imageData.data;

			// Get the RGB color used to transform
			const rgbColor = DrawHexToRGB(HexColor);

			// We transform each non transparent pixel based on the RGG value
			if (FullAlpha) {
				for (let p = 0, len = data.length; p < len; p += 4) {
					if (data[p + 3] == 0)
						continue;
					const trans = ((data[p] + data[p + 1] + data[p + 2]) / 383);
					data[p + 0] = rgbColor.r * trans;
					data[p + 1] = rgbColor.g * trans;
					data[p + 2] = rgbColor.b * trans;
				}
			} else {
				for (let p = 0, len = data.length; p < len; p += 4) {
					const trans = ((data[p] + data[p + 1] + data[p + 2]) / 383);
					if ((data[p + 3] == 0) || (trans < 0.8) || (trans > 1.2))
						continue;
					data[p + 0] = rgbColor.r * trans;
					data[p + 1] = rgbColor.g * trans;
					data[p + 2] = rgbColor.b * trans;
				}
			}

			// Replace the source image with the modified canvas
			destCanvas.putImageData(imageData, 0, 0);
		}
		destCanvas = destCanvas.canvas;
	} else {
		destCanvas = Img;
	}

	// Blit the transformed image to the main canvas, applying opacity and zoom
	Canvas.save();

	Canvas.globalCompositeOperation = BlendingMode;
	Canvas.globalAlpha = Alpha;

	Canvas.translate(X, Y);

	if (Zoom != 1) {
		Canvas.scale(Zoom, Zoom);
	}

	if (Invert) {
		Canvas.transform(1, 0, 0, -1, 0, Height);
	}

	if (Mirror) {
		Canvas.transform(-1, 0, 0, 1, Width, 0);
	}

	if (SourcePos) {
		Canvas.drawImage(destCanvas, SourcePos[0], SourcePos[1], SourcePos[2], SourcePos[3], 0, 0, Width, Height);
	} else if (sizeChanged) {
		Canvas.drawImage(destCanvas, 0, 0, Width, Height);
	} else {
		Canvas.drawImage(destCanvas, 0, 0);
	}

	Canvas.restore();
	return true;

}

/**
 * Wrapping text in fragments to support languages that do not separate between words using space.
 * This function can also break between a long English word if somehow needed in the script.
 * @param {string} text - The text to be fragmented.
 * @param {number} maxWidth - The max width the text will be filled in.
 * @returns {string[]} - A list of string that being fragmented.
 */
function DrawFragmentText(text, maxWidth) {
	let words = text.split(' '),
		lines = [],
		line = "";

	if (DrawMainCanvas.measureText(text).width < maxWidth) {
		return [text];
	}

	while (words.length > 0) {
		while (DrawMainCanvas.measureText(words[0]).width >= maxWidth) {
			let temp = words[0];
			words[0] = temp.slice(0, -1);
			if (words.length > 1) {
				words[1] = temp.slice(-1) + words[1];
			} else {
				words.push(temp.slice(-1));
			}
		}
		if (DrawMainCanvas.measureText(line + words[0]).width < maxWidth) {
			line += words.shift() + " ";
		} else {
			lines.push(line);
			line = "";
		}
		if (words.length === 0) {
			lines.push(line);
		}
	}
	return lines;
}

/**
 * Reduces the font size progressively until the text fits the wrap size
 * @param {string} Text - Text that will be drawn
 * @param {number} Width - Width in which the text must fit
 * @param {number} MaxLine - Maximum of lines the word can wrap for
 * @returns {void} - Nothing
 */
function DrawGetWrapTextSize(Text, Width, MaxLine) {

	// Don't bother if it fits on one line
	if (DrawMainCanvas.measureText(Text).width <= Width) return;

	const words = DrawFragmentText(Text, Width);
	let line = '';

	// Find the number of lines
	let LineCount = 1;
	for (let n = 0; n < words.length; n++) {
		const testLine = line + words[n] + ' ';
		if (DrawMainCanvas.measureText(testLine).width > Width && n > 0) {
			line = words[n] + ' ';
			LineCount++;
		} else line = testLine;
	}

	// If there's too many lines, we launch the function again with size minus 2
	if (LineCount > MaxLine) {
		DrawMainCanvas.font = (parseInt(DrawMainCanvas.font.substring(0, 2)) - 2).toString() + "px arial";
		DrawGetWrapTextSize(Text, Width, MaxLine);
	}
}

/**
 * Draws a word wrapped text in a rectangle
 * @param {string} Text - Text to draw
 * @param {number} X - Position of the rectangle on the X axis
 * @param {number} Y - Position of the rectangle on the Y axis
 * @param {number} Width - Width of the rectangle
 * @param {number} Height - Height of the rectangle
 * @param {string} ForeColor - Foreground color
 * @param {string} [BackColor] - Background color
 * @param {number} [MaxLine] - Maximum of lines the word can wrap for
 * @param {number} LineSpacing - The number of pixels between each lines (default to 23)
 * @param {"Center" | "Top"} Alignment - How the text should be alligned w.r.t. the Y position when wrapped over multiple lines
 * @returns {void} - Nothing
 */
function DrawTextWrap(Text, X, Y, Width, Height, ForeColor, BackColor, MaxLine, LineSpacing=23, Alignment="Center") {

	// Draw the rectangle if we need too
	if (BackColor != null) {
		DrawMainCanvas.beginPath();
		DrawMainCanvas.rect(X, Y, Width, Height);
		DrawMainCanvas.fillStyle = BackColor;
		DrawMainCanvas.fillRect(X, Y, Width, Height);
		DrawMainCanvas.fill();
		DrawMainCanvas.lineWidth = 2;
		DrawMainCanvas.strokeStyle = ForeColor;
		DrawMainCanvas.stroke();
		DrawMainCanvas.closePath();
	}
	if (!Text) return;

	// Sets the text size if there's a maximum number of lines
	let TextSize;
	if (MaxLine != null) {
		TextSize = DrawMainCanvas.font;
		DrawGetWrapTextSize(Text, Width, MaxLine);
	}

	// Split the text if it wouldn't fit in the rectangle
	DrawMainCanvas.fillStyle = ForeColor;
	if (DrawMainCanvas.measureText(Text).width > Width) {
		const words = DrawFragmentText(Text, Width);
		let line = '';

		// Find the number of lines
		let LineCount = 1;
		for (let n = 0; n < words.length; n++) {
			const testLine = line + words[n] + ' ';
			if (DrawMainCanvas.measureText(testLine).width > Width && n > 0) {
				line = words[n] + ' ';
				LineCount++;
			} else line = testLine;
		}

		// Splits the words and draw the text
		line = '';

		switch (Alignment) {
			case "Top":
				Y += Height / 2;
				break;
			case "Center":
			default:
				Y = Y - ((LineCount - 1) * LineSpacing) + (Height / 2);
		}

		for (let n = 0; n < words.length; n++) {
			const testLine = line + words[n] + ' ';
			if (DrawMainCanvas.measureText(testLine).width > Width && n > 0) {
				DrawMainCanvas.fillText(line, X + Width / 2, Y);
				line = words[n] + ' ';
				Y += LineSpacing * 2;
			}
			else {
				line = testLine;
			}
		}
		DrawMainCanvas.fillText(line, X + Width / 2, Y);

	} else DrawMainCanvas.fillText(Text, X + Width / 2, Y + Height / 2);

	// Resets the font text size
	if ((MaxLine != null) && (TextSize != null))
		DrawMainCanvas.font = TextSize;

}

/**
 * Draws a text element on the canvas that will fit on the specified width
 * @param {string} Text - Text to draw
 * @param {number} X - Position of the text on the X axis
 * @param {number} Y - Position of the text on the Y axis
 * @param {number} Width - Width in which the text has to fit
 * @param {string} Color - Color of the text
 * @param {string} [BackColor] - Color of the background
 * @returns {void} - Nothing
 */
function DrawTextFit(Text, X, Y, Width, Color, BackColor) {

	if (!Text) return;

	// Get text properties
	let Result = DrawGetTextSize(Text, Width);
	Text = Result[0];
	DrawMainCanvas.font = CommonGetFont(Result[1].toString());

	// Draw a back color relief text if needed
	if ((BackColor != null) && (BackColor != "")) {
		DrawMainCanvas.fillStyle = BackColor;
		DrawMainCanvas.fillText(Text, X + 1, Y + 1);
	}

	// Restores the font size
	DrawMainCanvas.fillStyle = Color;
	DrawMainCanvas.fillText(Text, X, Y);
	DrawMainCanvas.font = CommonGetFont(36);
}

/**
 * Gets the text size needed to fit inside a given width according to the current font.
 * This function is memoized because <code>DrawMainCanvas.measureText(Text)</code> is a major resource hog.
 * @param {string} Text - Text to draw
 * @param {number} Width - Width in which the text has to fit
 * @returns {[string, number]} - Text to draw and its font size
 */
const DrawGetTextSize = CommonMemoize(
	/** @type {(Text: string, width: number) => [text: string, size: number]} */
	(Text, Width) => {
	// If it doesn't fit, test with smaller and smaller fonts until it fits
		let S;
		for (S = 36; S >= 10; S = S - 2) {
			DrawMainCanvas.font = CommonGetFont(S.toString());
			const metrics = DrawMainCanvas.measureText(Text);
			if (metrics.width <= Width)
				return [Text, S];
		}

		// Cuts the text if it would go over the box
		while (Text.length > 0) {
			Text = Text.substr(1);
			const metrics = DrawMainCanvas.measureText(Text);
			if (metrics.width <= Width)
				return [Text, S];
		}
	});

/**
 * Draws a text element on the canvas
 * @param {string} Text - Text to draw
 * @param {number} X - Position of the text on the X axis
 * @param {number} Y - Position of the text on the Y axis
 * @param {string} Color - Color of the text
 * @param {string} [BackColor] - Color of the background
 * @returns {void} - Nothing
 */
function DrawText(Text, X, Y, Color, BackColor) {
	if (!Text) return;

	// Draw a back color relief text if needed
	if ((BackColor != null) && (BackColor != "")) {
		DrawMainCanvas.fillStyle = BackColor;
		DrawMainCanvas.fillText(Text, X + 1, Y + 1);
	}

	// Split the text on two lines if there's a |
	DrawMainCanvas.fillStyle = Color;
	DrawMainCanvas.fillText(Text, X, Y);

}

/**
 * Draws a button component
 * @param {number} Left - Position of the component from the left of the canvas
 * @param {number} Top - Position of the component from the top of the canvas
 * @param {number} Width - Width of the component
 * @param {number} Height - Height of the component
 * @param {string} Label - Text to display in the button
 * @param {string} Color - Color of the component
 * @param {string} [Image] - URL of the image to draw inside the button, if applicable
 * @param {string} [HoveringText] - Text of the tooltip, if applicable
 * @param {boolean} [Disabled] - Disables the hovering options if set to true
 * @returns {void} - Nothing
 */
function DrawButton(Left, Top, Width, Height, Label, Color, Image, HoveringText, Disabled) {

	// Draw the button rectangle (makes the background color cyan if the mouse is over it)
	DrawMainCanvas.beginPath();
	DrawMainCanvas.rect(Left, Top, Width, Height);
	DrawMainCanvas.fillStyle = ((MouseX >= Left) && (MouseX <= Left + Width) && (MouseY >= Top) && (MouseY <= Top + Height) && !CommonIsMobile && !Disabled) ? "#FFAACC" : Color;
	DrawMainCanvas.fillRect(Left, Top, Width, Height);
	DrawMainCanvas.fill();
	DrawMainCanvas.lineWidth = 2;
	DrawMainCanvas.strokeStyle = 'black';
	DrawMainCanvas.stroke();
	DrawMainCanvas.closePath();

	// Draw the text or image
	DrawTextFit(Label, Left + Width / 2, Top + (Height / 2) + 1, Width - 4, "black");
	if ((Image != null) && (Image != "")) DrawImage(Image, Left + 2, Top + 2);

	// Draw the hovering text
	if ((HoveringText != null) && (MouseX >= Left) && (MouseX <= Left + Width) && (MouseY >= Top) && (MouseY <= Top + Height) && !CommonIsMobile)
		DrawHoverElements.push(() => DrawButtonHover(Left, Top, Width, Height, HoveringText));

}

/**
 * Draws a checkbox component
 * @param {number} Left - Position of the component from the left of the canvas
 * @param {number} Top - Position of the component from the top of the canvas
 * @param {number} Width - Width of the component
 * @param {number} Height - Height of the component
 * @param {string} Text - Label associated with the checkbox
 * @param {boolean} IsChecked - Whether or not the checkbox is checked
 * @param {boolean} [Disabled] - Disables the hovering options if set to true
 * @param {string} [TextColor] - Color of the text
 * @returns {void} - Nothing
 */
function DrawCheckbox(Left, Top, Width, Height, Text, IsChecked, Disabled = false, TextColor = "Black", CheckImage = "Icons/Checked.png") {
	DrawText(Text, Left + 100, Top + 33, TextColor, "Gray");
	DrawButton(Left, Top, Width, Height, "", Disabled ? "#ebebe4" : "White", IsChecked ? CheckImage : "", null, Disabled);
}

/**
 * Draw a back & next button component
 * @param {number} Left - Position of the component from the left of the canvas
 * @param {number} Top - Position of the component from the top of the canvas
 * @param {number} Width - Width of the component
 * @param {number} Height - Height of the component
 * @param {string} Label - Text inside the component
 * @param {string} Color - Color of the component
 * @param {string} [Image] - Image URL to draw in the component
 * @param {() => string} [BackText] - Text for the back button tooltip
 * @param {() => string} [NextText] - Text for the next button tooltip
 * @param {boolean} [Disabled] - Disables the hovering options if set to true
 * @param {number} [ArrowWidth] - How much of the button the previous/next sections cover. By default, half each.
 * @returns {void} - Nothing
 */
function DrawBackNextButton(Left, Top, Width, Height, Label, Color, Image, BackText, NextText, Disabled, ArrowWidth) {

	// Set the widths of the previous/next sections to be colored cyan when hovering over them
	// By default each covers half the width, together covering the whole button
	if (ArrowWidth == null || ArrowWidth > Width / 2) ArrowWidth = Width / 2;
	const LeftSplit = Left + ArrowWidth;
	const RightSplit = Left + Width - ArrowWidth;

	DrawMainCanvas.save();
	DrawMainCanvas.textAlign = "center";

	// Draw the button rectangle
	DrawMainCanvas.beginPath();
	DrawMainCanvas.rect(Left, Top, Width, Height);
	DrawMainCanvas.fillStyle = Color;
	DrawMainCanvas.fillRect(Left, Top, Width, Height);
	if (MouseIn(Left, Top, Width, Height) && !CommonIsMobile && !Disabled) {
		DrawMainCanvas.fillStyle = "Cyan";
		if (MouseX > RightSplit) {
			DrawMainCanvas.fillRect(RightSplit, Top, ArrowWidth, Height);
		}
		else if (MouseX <= LeftSplit) {
			DrawMainCanvas.fillRect(Left, Top, ArrowWidth, Height);
		} else {
			DrawMainCanvas.fillRect(Left + ArrowWidth, Top, Width - ArrowWidth * 2, Height);
		}
	}
	else if (CommonIsMobile && ArrowWidth < Width / 2 && !Disabled) {
		// Fill in the arrow regions on mobile
		DrawMainCanvas.fillStyle = "lightgrey";
		DrawMainCanvas.fillRect(Left, Top, ArrowWidth, Height);
		DrawMainCanvas.fillRect(RightSplit, Top, ArrowWidth, Height);
	}
	DrawMainCanvas.lineWidth = 2;
	DrawMainCanvas.strokeStyle = 'black';
	DrawMainCanvas.stroke();
	DrawMainCanvas.closePath();

	// Draw the text or image
	DrawTextFit(Label, Left + Width / 2, Top + (Height / 2) + 1, (CommonIsMobile) ? Width - 6 : Width - 36, "Black");
	if ((Image != null) && (Image != "")) DrawImage(Image, Left + 2, Top + 2);

	// Draw the back arrow
	DrawMainCanvas.beginPath();
	DrawMainCanvas.fillStyle = "black";
	DrawMainCanvas.moveTo(Left + 15, Top + Height / 5);
	DrawMainCanvas.lineTo(Left + 5, Top + Height / 2);
	DrawMainCanvas.lineTo(Left + 15, Top + Height - Height / 5);
	DrawMainCanvas.stroke();
	DrawMainCanvas.closePath();

	// Draw the next arrow
	DrawMainCanvas.beginPath();
	DrawMainCanvas.fillStyle = "black";
	DrawMainCanvas.moveTo(Left + Width - 15, Top + Height / 5);
	DrawMainCanvas.lineTo(Left + Width - 5, Top + Height / 2);
	DrawMainCanvas.lineTo(Left + Width - 15, Top + Height - Height / 5);
	DrawMainCanvas.stroke();
	DrawMainCanvas.closePath();

	DrawMainCanvas.restore();

	// Draw the hovering text on the PC
	if (CommonIsMobile) return;
	if (BackText == null) BackText = () => "MISSING VALUE FOR: BACK TEXT";
	if (NextText == null) NextText = () => "MISSING VALUE FOR: NEXT TEXT";
	if ((MouseX >= Left) && (MouseX <= Left + Width) && (MouseY >= Top) && (MouseY <= Top + Height) && !Disabled) {
		DrawHoverElements.push(() => {
			const tooltip = MouseX < LeftSplit ? BackText() : MouseX >= RightSplit ? NextText() : "";
			DrawButtonHover(Left, Top, Width, Height, tooltip);
		});
	}

}

/**
 * Draw the hovering text tooltip
 * @param {number} Left - Position of the tooltip from the left of the canvas
 * @param {number} Top - Position of the tooltip from the top of the canvas
 * @param {number} Width - Width of the tooltip
 * @param {number} Height - Height of the tooltip
 * @param {string} HoveringText - Text to display in the tooltip
 * @returns {void} - Nothing
 */
function DrawButtonHover(Left, Top, Width, Height, HoveringText) {
	if ((HoveringText != null) && (HoveringText != "")) {
		Left = (MouseX > 1000) ? Left - 475 : Left + Width + 25;
		Top = Top + (Height - 65) / 2;
		DrawMainCanvas.save();
		DrawMainCanvas.textAlign = "center";
		DrawMainCanvas.beginPath();
		DrawMainCanvas.rect(Left, Top, 450, 65);
		DrawMainCanvas.fillStyle = "#FFFF88";
		DrawMainCanvas.fillRect(Left, Top, 450, 65);
		DrawMainCanvas.fill();
		DrawMainCanvas.lineWidth = 2;
		DrawMainCanvas.strokeStyle = 'black';
		DrawMainCanvas.stroke();
		DrawMainCanvas.closePath();
		DrawTextFit(HoveringText, Left + 225, Top + 33, 444, "black");
		DrawMainCanvas.restore();
	}
}

/**
 * Draws a basic empty rectangle with a colored outline
 * @param {number} Left - Position of the rectangle from the left of the canvas
 * @param {number} Top - Position of the rectangle from the top of the canvas
 * @param {number} Width - Width of the rectangle
 * @param {number} Height - Height of the rectangle
 * @param {string} Color - Color of the rectangle outline
 * @param {number} [Thickness=3] - Thickness of the rectangle line
 * @returns {void} - Nothing
 */
function DrawEmptyRect(Left, Top, Width, Height, Color, Thickness = 3) {
	DrawMainCanvas.beginPath();
	DrawMainCanvas.rect(Left, Top, Width, Height);
	DrawMainCanvas.lineWidth = Thickness;
	DrawMainCanvas.strokeStyle = Color;
	DrawMainCanvas.stroke();
}

/**
 * Draws a basic rectangle filled with a given color
 * @param {number} Left - Position of the rectangle from the left of the canvas
 * @param {number} Top - Position of the rectangle from the top of the canvas
 * @param {number} Width - Width of the rectangle
 * @param {number} Height - Height of the rectangle
 * @param {string} Color - Color of the rectangle
 * @returns {void} - Nothing
 */
function DrawRect(Left, Top, Width, Height, Color) {
	DrawMainCanvas.beginPath();
	DrawMainCanvas.fillStyle = Color;
	DrawMainCanvas.fillRect(Left, Top, Width, Height);
	DrawMainCanvas.fill();
}

/**
 * Draws a basic circle
 * @param {number} CenterX - Position of the center of the circle on the X axis
 * @param {number} CenterY - Position of the center of the circle on the Y axis
 * @param {number} Radius - Radius of the circle to draw
 * @param {number} LineWidth - Width of the line
 * @param {string} LineColor - Color of the circle's line
 * @param {string} [FillColor] - Color of the space inside the circle
 * @param {CanvasRenderingContext2D} [Canvas] - The canvas element to draw onto, defaults to DrawMainCanvas
 * @returns {void} - Nothing
 */
function DrawCircle(CenterX, CenterY, Radius, LineWidth, LineColor, FillColor, Canvas) {
	if (!Canvas) Canvas = DrawMainCanvas;
	Canvas.beginPath();
	Canvas.arc(CenterX, CenterY, Radius, 0, 2 * Math.PI, false);
	if (FillColor) {
		Canvas.fillStyle = FillColor;
		Canvas.fill();
	}
	Canvas.lineWidth = LineWidth;
	Canvas.strokeStyle = LineColor;
	Canvas.stroke();
}

/**
 * Draws a progress bar with color
 * @param {number} x - Position of the bar on the X axis
 * @param {number} y - Position of the bar on the Y axis
 * @param {number} w - Width of the bar
 * @param {number} h - Height of the bar
 * @param {number} value - Current progress to display on the bar
 * @param {string} [foreground="#66FF66"] - Color of the first part of the bar
 * @param {string} [background="red"] - Color of the bar background
 * @returns {void} - Nothing
 */
function DrawProgressBar(x, y, w, h, value, foreground = "#66FF66", background = "red") {
	if (value < 0) value = 0;
	if (value > 100) value = 100;
	DrawRect(x, y, w, h, "white");
	DrawRect(x + 2, y + 2, Math.floor((w - 4) * value / 100), h - 4, foreground);
	DrawRect(Math.floor(x + 2 + (w - 4) * value / 100), y + 2, Math.floor((w - 4) * (100 - value) / 100), h - 4, background);
}

/**
 * Draws two lines, from one point to a second point then to a third point
 * @param {number} x0 - X co-ordinate of starting point
 * @param {number} y0 - Y co-ordinate of starting point
 * @param {number} x1 - X co-ordinate of mid point
 * @param {number} y1 - Y co-ordinate of mid point
 * @param {number} x2 - X co-ordinate of end point
 * @param {number} y2 - Y co-ordinate of end point
 * @param {number} lineWidth - The width of the lines
 * @param {string} color - The color of the lines
 * @returns {void} - Nothing
 */
function DrawLineCorner(x0, y0, x1, y1, x2, y2, lineWidth = 2, color = "black") {
	DrawMainCanvas.beginPath();
	DrawMainCanvas.lineWidth = lineWidth;
	DrawMainCanvas.moveTo(x0, y0);
	DrawMainCanvas.lineTo(x1, y1);
	DrawMainCanvas.lineTo(x2, y2);
	DrawMainCanvas.strokeStyle = color;
	DrawMainCanvas.stroke();
}

/**
 * Draws a background image onto the DrawMainCanvas, applying zoom and visual effects
 * @param {string} URL The background image to use
 * @param {Rect} bounds The location to draw the background in
 * @param {object} [opts] The background drawing options
 * @param {boolean} [opts.inverted=false] Whether the background should be flipped upside-down
 * @param {number} [opts.blur=1.0] How blurry the background is
 * @param {number} [opts.darken=0.0] How darkened the background is (1 is bright, 0 is pitch black)
 * @param {RGBAColor[]} [opts.tints] Tints to apply to the background
 * @param {DrawingResizeMode} [opts.sizeMode] The method of resizing the background
 */
function DrawRoomBackground(URL, bounds, opts) {

	let { inverted, blur, darken, tints, sizeMode } = opts;
	inverted ??= false;
	blur ??= 1.0;
	darken ??= 1.0;
	tints ??= [];
	sizeMode ??= DrawingResizeMode.FillOriginalRatio;

	const img = URL !== "" ? DrawGetImage(URL) : undefined;
	if (darken > 0 && img) {
		// Sets the blur level
		if (blur > 0) {
			DrawMainCanvas.filter = `blur(${blur}px)`;
		}

		// Draw the background and custom filter
		const imageBounds = DrawRectMakeRect(img.x, img.y, img.naturalWidth, img.naturalHeight);
		const [sourceRect, destRect] = DrawRectFitIntoRect(imageBounds, bounds, sizeMode);

		DrawImageZoomCanvas(URL, DrawMainCanvas, ...sourceRect, ...destRect, inverted);

		DrawMainCanvas.filter = 'none';

		// Draw an overlay if the character is partially blinded
		if (darken < 1) {
			DrawRect(bounds.x, bounds.y, bounds.w, bounds.h, "rgba(0,0,0," + (1 - darken) + ")");
		}
	} else {
		// Draw black rect to prevent overdraw if the actual image isn't ready
		DrawRect(...DrawRectGetFrame(bounds), "#000");
	}

	for (const {r, g, b, a} of tints)
		DrawRect(bounds.x, bounds.y, bounds.w, bounds.h, `rgba(${r},${g},${b},${a})`);

}

/**
 * Constantly looping draw process. Draws beeps, handles the screen size, handles the current blindfold state and draws the current screen.
 * @param {number} time - The current time for frame
 * @returns {void} - Nothing
 */
function DrawProcess(time) {

	// Draws the regular background
	if ((CommonBackground != null) && !DialogIsActive())
		DrawImageResize(`Image/Background/${CommonBackground}.jpg`, 0, 0, 2000, 1000);
//		DrawRoomBackground(, DrawRectMakeRect(0, 0, 2000, 1000), {});

	// Draws the dialog screen or current screen if there's no loaded character
	if (DialogIsActive()) DialogDraw();
	else {
		CommonScreenFunctions.Run(time);
		if (CommonScreenFunctions.Draw != null) CommonScreenFunctions.Draw();
	}

	// Draw Hovering text so they can be above everything else
	DrawProcessHoverElements();

	// Checks for screen resize/position change and calls appropriate function
	/** @type {RectTuple} */
	const newCanvasPosition = [DrawMainCanvas.canvas.offsetLeft, DrawMainCanvas.canvas.offsetTop, DrawMainCanvas.canvas.clientWidth, DrawMainCanvas.canvas.clientHeight];
	if (!CommonArraysEqual(newCanvasPosition, DrawCanvasPosition)) {
		DrawCanvasPosition = newCanvasPosition;
		if (CommonScreenFunctions.Resize) CommonScreenFunctions.Resize(false);
	}

}

/**
 * Draws every element that is considered a "hover" element such has button tooltips.
 * @returns {void} - Nothing
 */
function DrawProcessHoverElements() {
	for (let E = 0; E < DrawHoverElements.length; E++)
		if (typeof DrawHoverElements[0] === "function")
			(DrawHoverElements.shift())();
}

/**
 * Returns a rectangular subsection of a canvas
 * @param {HTMLCanvasElement} Canvas - The source canvas to take a section of
 * @param {number} Left - The starting X co-ordinate of the section
 * @param {number} Top - The starting Y co-ordinate of the section
 * @param {number} Width - The width of the section to take
 * @param {number} Height - The height of the section to take
 * @returns {HTMLCanvasElement} - The new canvas containing the section
 */
function DrawCanvasSegment(Canvas, Left, Top, Width, Height) {
	DrawTempCanvas.canvas.width = Width;
	DrawTempCanvas.canvas.height = Height;
	DrawTempCanvas.clearRect(0, 0, Width, Height);
	DrawTempCanvas.drawImage(Canvas, Left, Top, Width, Height, 0, 0, Width, Height);
	return DrawTempCanvas.canvas;
}

/**
 * Draws a source canvas or image onto a canvas, with a shear transformation (such that the width of the top and
 * bottom are different). If the `topToBottomRatio` is greater than 1, then the bottom edge of the image will be
 * smaller in the original image. If it's less than 1, then the top edge will be smaller than in the original (like the
 * Star Wars title text transform).
 * @param {HTMLCanvasElement | HTMLImageElement} image - The source image
 * @param {HTMLCanvasElement} targetCanvas - The target canvas to draw the transformed image onto
 * @param {number} topToBottomRatio - The ratio between the desired length of the top edge and the bottom edge of the final image.
 * @param {number} [x] - The x-position on the target canvas that the final image should be drawn at
 * @param {number} [y] - The y-position on the target canvas that the final image should be drawn at
 */
function DrawImageTrapezify(image, targetCanvas, topToBottomRatio, x = 0, y = 0) {
	const {width, height} = image;
	let xStartTop = 0;
	let xStartBottom = 0;

	if (topToBottomRatio > 1) {
		const bottomToTopRatio = 1 / topToBottomRatio;
		xStartBottom = (width * (1 - bottomToTopRatio)) / 2;
	} else {
		xStartTop = (width * (1 - topToBottomRatio)) / 2;
	}

	const targetCtx = targetCanvas.getContext("2d");

	for (let i = 0; i < height; i++) {
		const s = i / height;
		const xStart = (xStartTop * (1 - s) + xStartBottom * s);
		targetCtx.drawImage(image, 0, i, width, 1, x + xStart, y + i, width - xStart * 2, 1);
	}
}

/**
 * Make a new rect from a 4-tuple
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @returns {Rect}
 */
function DrawRectMakeRect(x, y, w, h) {
	return { x, y, w: Math.max(0, w), h: Math.max(0, h) };
}

/**
 * Convert a rect into a 4-tuple
 * @param {Rect} rect
 * @returns {RectTuple}
 */
function DrawRectGetFrame(rect) {
	return [rect.x, rect.y, rect.w, rect.h];
}

/**
 * Offsets a rect by the given amount
 * @param {Rect} rect
 * @param {number} dX
 * @param {number} dY
 * @returns {Rect}
 */
function DrawRectOffset(rect, dX, dY) {
	return DrawRectMakeRect(rect.x + dX, rect.y + dY, rect.w, rect.h);
}

/**
 * Scale a rect in one direction
 * @param {Rect} rect
 * @param {number} wScale
 * @param {number} hScale
 * @returns {Rect}
 */
function DrawRectScale(rect, wScale, hScale) {
	return DrawRectMakeRect(rect.x, rect.y, rect.w * wScale, rect.h * hScale);
}

/**
 * Draws the character portrait which can blink, if the blink image isn't cached, we cache it first
 * @param {string} Char - The character to draw
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the portrait
 * @param {number} H - The height of the portrait
 */
function DrawPortrait(Char, X, Y, W, H) {
	let FileName = "Image/Character/Portrait/" + Char + ".png";
	let BlinkFileName = "Image/Character/Portrait/" + Char + "Blink.png";
	if (CharacterBlink()) {
		let Obj = DrawCacheImage.get(BlinkFileName);
		if ((Obj != null) && (Obj.width != null) && (Obj.width > 0)) {
			DrawImageResize(BlinkFileName, X, Y, W, H);
			DrawImageResize(FileName, 2000, 1000, 1, 1);
			return;
		}
	}
	DrawImageResize(FileName, X, Y, W, H);
	DrawImageResize(BlinkFileName, 2000, 1000, 1, 1);
}

/**
 * Transform a rectangle to fit partially or wholly inside another. E.g. an image onto a background canvas
 * @param {Rect} sourceRect Source rectangle, to be resized and/or trimmed
 * @param {Rect} destRect Destination rectangle, the available space to contain the result
 * @param {DrawingResizeMode} sizeMode - How to transform sourceRect - whether to keep original aspect ratio and allow/prevent overflow
 * @returns {[RectTuple, RectTuple]} The subsection of the sourceRect to take and the rectangle to map it to
 */
const DrawRectFitIntoRect = CommonMemoize(
	/** @type {(sourceRect: Rect, destRect: Rect, sizeMode: DrawingResizeMode) => [sourceRectTuple: RectTuple, destRectTuple: RectTuple]} */
	(sourceRect, destRect, sizeMode) => {
		if (sizeMode == DrawingResizeMode.Fill) {
			return [DrawRectGetFrame(sourceRect), DrawRectGetFrame(destRect)];
		}

		let sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH;

		let fitByWidth;
		if (sizeMode == DrawingResizeMode.ShowFullOriginalRatio) {
			fitByWidth = sourceRect.w / sourceRect.h >= destRect.w / destRect.h;
		} else {
			fitByWidth = sourceRect.w / sourceRect.h <= destRect.w / destRect.h;
		}

		if (fitByWidth) {
			const resizeFactor = destRect.w / sourceRect.w;
			const sourceYOffsetFactor = sourceRect.w > sourceRect.h ? 1 : 2; //allows landscape images to zoom towards the "floor"

			sourceX = sourceRect.x;
			sourceY = sourceRect.y + Math.max(sourceRect.h - (destRect.h / resizeFactor), 0) / sourceYOffsetFactor;
			sourceW = sourceRect.w;
			sourceH = Math.min(sourceRect.h, destRect.h / resizeFactor);
			destX = destRect.x;
			destY = destRect.y + Math.max(destRect.h - sourceRect.h * resizeFactor, 0) / 2;
			destW = destRect.w;
			destH = Math.min(sourceRect.h * resizeFactor, destRect.h);
		} else {
			const resizeFactor = destRect.h / sourceRect.h;

			sourceX = sourceRect.x + Math.max(sourceRect.w - (destRect.w / resizeFactor), 0) / 2;
			sourceY = sourceRect.y;
			sourceW = Math.min(sourceRect.w, destRect.w / resizeFactor);
			sourceH = sourceRect.h;
			destX = destRect.x + Math.max(destRect.w - sourceRect.w * resizeFactor, 0) / 2;
			destY = destRect.y;
			destW = Math.min(sourceRect.w * resizeFactor, destRect.w);
			destH = destRect.h;
		}

		/** @type {RectTuple} */
		const sourceRectTuple = [sourceX, sourceY, sourceW, sourceH];
		/** @type {RectTuple} */
		const destRectTuple = [destX, destY, destW, destH];

		return [sourceRectTuple, destRectTuple];
	});
