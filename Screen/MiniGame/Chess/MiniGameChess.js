"use strict";
var ChessBackground = "Chess";
/** @type {null | Character} */
var ChessCharacterWhite = null;
/** @type {null | Character} */
var ChessCharacterBlack = null;
var ChessEndStatus = "";
var ChessMinorPieceWhite = 8;
var ChessMajorPieceWhite = 8;
var ChessMinorPieceBlack = 8;
var ChessMajorPieceBlack = 8;

var MiniGameChessPlayerColor = "w";
var MiniGameChessBoard = null;
var MiniGameChessGame = null;
var chess;

// Starts the chess with a depth (difficulty)
function MiniGameChessStart(Depth, PlayerColor) {
	const MinMaxDepth = Depth;
	const PauseDepth = 2;
	const chessOnMoveEvent = new Event('chessOnMove');
	let moveInProgress = false;

	/**
	 * Evaluates current chess board relative to player
	 * @param {string} color - Players color, either 'b' or 'w'
	 * @return {Number} board value relative to player
	 */
	function evaluateBoard(chessboard, color) {
		// Sets the value for each piece using standard piece value
		const pieceValue = {
			p: 100,
			n: 350,
			b: 350,
			r: 525,
			q: 1000,
			k: 10000
		};

		// Loop through all pieces on the board and sum up total
		let value = 0;
		for (const row of chessboard) {
			for (const piece of row) {
				if (piece) value += pieceValue[piece.type] * (piece.color === color ? 1 : -1);
			}
		}

		return value;
	}

	function sleep() {
		return new Promise(resolve => setTimeout(resolve, 25));
	}

	/**
	 * Calculates the best move using Minimax with Alpha Beta Pruning.
	 * @param {Number} depth - How many moves ahead to evaluate
	 * @param {Object} chessgame - The game to evaluate
	 * @param {string} playerColor - Players color, either 'b' or 'w'
	 * @param {Number} alpha
	 * @param {Number} beta
	 * @param {Boolean} isMaximizingPlayer - If current turn is maximizing or minimizing player
	 * @return {Promise<[number, number]>} The best move value, and the best move
	 */
	async function calcBestMove(
		depth,
		chessgame,
		playerColor,
		alpha = Number.NEGATIVE_INFINITY,
		beta = Number.POSITIVE_INFINITY,
		isMaximizingPlayer = true
	) {
		let value = 0;

		// Base case: evaluate board
		if (depth === 0) {
			value = evaluateBoard(chessgame.board(), playerColor);
			return [value, null];
		}
		if (depth >= PauseDepth) {
			await sleep();
		}
		// Recursive case: search possible moves
		let bestMove = null; // best move not set yet
		const possibleMoves = chessgame.moves();
		// Set random order for possible moves
		possibleMoves.sort(() => 0.5 - Math.random());
		// Set a default best move value
		let bestMoveValue = isMaximizingPlayer ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
		// Search through all possible moves
		for (let i = 0; i < possibleMoves.length; i++) {
			const move = possibleMoves[i];
			// Make the move, but undo before exiting loop
			chessgame.move(move);
			// Recursively get the value from this move
			value = (await calcBestMove(depth - 1, chessgame, playerColor, alpha, beta, !isMaximizingPlayer))[0];

			if (isMaximizingPlayer) {
				// Look for moves that maximize position
				if (value > bestMoveValue) {
					bestMoveValue = value;
					bestMove = move;
				}
				alpha = Math.max(alpha, value);
			} else {
				// Look for moves that minimize position
				if (value < bestMoveValue) {
					bestMoveValue = value;
					bestMove = move;
				}
				beta = Math.min(beta, value);
			}
			// Undo previous move
			chessgame.undo();
			// Check for alpha beta pruning
			if (beta <= alpha) {
				//console.log('Prune', alpha, beta);
				break;
			}
		}

		// Return the best move, or the only move
		return [bestMoveValue, bestMove || possibleMoves[0]];
	}

	// Computer makes a move with algorithm choice and skill/depth level
	async function makeMove(skill = 3) {
		// exit if the game is over
		if (game.game_over() === true) {
			//console.log('game over');
			return;
		}
		// Calculate the best move
		moveInProgress = true;
		var move = (await calcBestMove(skill, game, game.turn()))[1];
		moveInProgress = false;
		// Make the calculated move
		game.move(move);
		// Update board positions
		await board.setPosition(game.fen(), true);

		// Announce a move was made
		document.dispatchEvent(chessOnMoveEvent);
	}

	let board;
	let game = new Chess();

	// Creates the board div
	let boardElem = document.getElementById("DivChessBoard");
	if (!boardElem) {
		boardElem = document.createElement("div");
		boardElem.setAttribute("ID", "DivChessBoard");
		boardElem.className = "HideOnDisconnect";
		document.body.appendChild(boardElem);
	}

	// Configure the board
	board = new chess.Chessboard(boardElem, {
		position: "start",
		orientation: PlayerColor === "w" ? chess.COLOR.white : chess.COLOR.black,
		style: {
			borderType: chess.BORDER_TYPE.thin,
		},
		sprite: {
			url: "./Style/Chessboard-sprite.svg", // pieces and markers are stored in a sprite file
			size: 40, // the sprite tiles size, defaults to 40x40px
			cache: true // cache the sprite
		},
	});

	board.enableMoveInput((event) => {
		switch (event.type) {
			case chess.INPUT_EVENT_TYPE.moveStart: {
				// Check before pick pieces that it is the player's color and game is not over
				if (game.game_over() === true || moveInProgress) {
					return false;
				}

				const moves = game.moves({square: event.square, verbose: true});
				return moves.length > 0;
			}

			case chess.INPUT_EVENT_TYPE.moveDone: {
				// see if the move is legal
				const move = game.move({
					from: event.squareFrom,
					to: event.squareTo,
					promotion: "q" // NOTE: always promote to a queen for example simplicity
				});

				// If illegal move, snapback
				if (move === null) return false;

				// Update the board position after the piece snap
				board.setPosition(game.fen(), true);

				// Announce a move was made
				document.dispatchEvent(chessOnMoveEvent);

				// make move for black
				window.setTimeout(function () {
					makeMove(MinMaxDepth);
				}, 200);
			}
		}
	}, PlayerColor === "w" ? chess.COLOR.white : chess.COLOR.black);

	// Resets the board and shows it
	game.reset();
	MiniGameChessBoard = board;
	MiniGameChessGame = game;

	// Opponent starts
	if (PlayerColor === "b") {
		window.setTimeout(function () {
			makeMove(MinMaxDepth);
		}, board.props.animationDuration);
	}
}

/**
 * Loads the chess mini game and sets the difficulty ratio before serving the first ball
 * @type {ScreenLoadHandler}
 */
function MiniGameChessLoad() {
	ChessMinorPieceWhite = 8;
	ChessMajorPieceWhite = 8;
	ChessMinorPieceBlack = 8;
	ChessMajorPieceBlack = 8;
	let Difficulty = MiniGameParameterGet("Chess", "Difficulty");
	Difficulty = CommonIsNumeric(Difficulty) ? parseInt(Difficulty) : 2;
	MiniGameChessStart(Difficulty, MiniGameChessPlayerColor);
}

/**
 * Runs the chess mini game and draws its components on screen
 * @returns {void} - Nothing
 */
function MiniGameChessDraw() {

	// The game can end in many ways
	DrawImageResize("Screen/MiniGame/" + MiniGameCurrent + "/Background/" + MiniGameBackground + ".jpg", 0, 0, 2000, 1000);
	MiniGameEnded = (MiniGameChessGame.in_checkmate() || MiniGameChessGame.in_stalemate() || MiniGameChessGame.in_threefold_repetition() || MiniGameChessGame.in_draw());
	if (MiniGameEnded) DrawText(MiniGameTextGet("ClickEnd"), 250, 30, "#DD0000", "white");
	else DrawButton(125, 800, 250, 60, MiniGameTextGet("Concede"), "White", "", "");

	// Define the text that goes under the player
	let TextLeft = CharacterGet("Teacher").DisplayName;
	let TextRight = DialogCharacter.DisplayName;
	if (MiniGameChessGame.in_checkmate() && MiniGameChessGame.turn() !== MiniGameChessPlayerColor) { TextLeft = MiniGameTextGet("Victory"); TextRight = MiniGameTextGet("Checkmate"); }
	else if (MiniGameChessGame.in_checkmate() && MiniGameChessGame.turn() === MiniGameChessPlayerColor) { TextLeft = MiniGameTextGet("Checkmate"); TextRight = MiniGameTextGet("Victory"); }
	else if (MiniGameChessGame.in_stalemate()) { TextLeft = MiniGameTextGet("Stalemate"); TextRight = MiniGameTextGet("Stalemate"); }
	else if (MiniGameChessGame.in_threefold_repetition()) { TextLeft = MiniGameTextGet("ThreefoldRepetition"); TextRight = MiniGameTextGet("ThreefoldRepetition"); }
	else if (MiniGameChessGame.in_draw()) { TextLeft = MiniGameTextGet("Draw"); TextRight = MiniGameTextGet("Draw"); }
	DrawText(TextLeft, 250, 970, "black", "white");
	DrawText(TextRight, 1750, 970, "black", "white");

}

/**
 * Handles clicks during the chess mini game
 * @returns {void} - Nothing
 */
function MiniGameChessClick() {

	// The player can concede the game and ends it right away, 0 is a defeat
	if (!MiniGameEnded && MouseIn(125, 800, 250, 60)) {
		MiniGameScore = 0;
		ElementRemove("DivChessBoard");
		MiniGameCurrent = "";
	}

	// When the game ended, the player can click on herself to go back, 0 is a defeat, 1 is a draw, 2 is a victory
	if (MiniGameEnded && MouseIn(0, 0, 500, 1000)) {
		MiniGameScore = 1;
		if (MiniGameChessGame.in_checkmate()) MiniGameScore = (MiniGameChessGame.turn() === MiniGameChessPlayerColor) ? 0 : 2;
		ElementRemove("DivChessBoard");
		MiniGameCurrent = "";
	}

}