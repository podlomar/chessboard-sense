import type { ChessPosition } from './ChessPosition.js';
import type { Piece, PiecesPlacement, Square } from './PiecesPlacement.js';

const circumflex = (piece: Piece): string => {
  switch (piece.symbol) {
    case 'K':
      return 'K̂';
    case 'Q':
      return 'Q̂';
    case 'R':
      return 'R̂';
    case 'B':
      return 'B̂';
    case 'N':
      return 'N̂';
    case 'P':
      return 'P̂';
    case 'k':
      return 'k̂';
    case 'q':
      return 'q̂';
    case 'r':
      return 'r̂';
    case 'b':
      return 'b̂';
    case 'n':
      return 'n̂';
    case 'p':
      return 'p̂';
    default:
      return piece.symbol;
  }
};

const diaeresis = (piece: Piece): string => {
  switch (piece.symbol) {
    case 'K':
      return 'K̤';
    case 'Q':
      return 'Q̤';
    case 'R':
      return 'R̤';
    case 'B':
      return 'B̤';
    case 'N':
      return 'N̤';
    case 'P':
      return 'P̤';
    case 'k':
      return 'k̤';
    case 'q':
      return 'q̤';
    case 'r':
      return 'r̤';
    case 'b':
      return 'b̤';
    case 'n':
      return 'n̤';
    case 'p':
      return 'p̤';
    default:
      return piece.symbol;
  }
};

type Accent = 'circumflex' | 'diaeresis' | 'none';

export class AsciiBoard {
  private board: string[];

  private constructor(board: string[]) {
    this.board = board;
  }

  public static empty(): AsciiBoard {
    return new AsciiBoard(Array(64).fill('.'));
  }

  public static fromPlacement(placement: PiecesPlacement): AsciiBoard {
    const boardArray: string[] = Array(64).fill('.');
    for (let i = 0; i < 64; i++) {
      const piece = placement.atIndex(i);
      if (piece !== null) {
        boardArray[i] = piece.symbol;
      }
    }

    return new AsciiBoard(boardArray);
  }

  public static fromPosition(position: ChessPosition): AsciiBoard {
    const board = AsciiBoard.fromPlacement(position.placement);
    if (position.alteration?.type === 'lifted') {
      const piece = position.alteration.piece;
      board.setPiece(position.alteration.square, piece, 'circumflex');
    } else if (position.alteration?.type === 'errors') {
      for (const error of position.alteration.targets) {
        if (error.piece === null) {
          board.clearSquare(error.square, 'diaeresis');
        } else {
          board.setPiece(error.square, error.piece, 'diaeresis');
        }
      }
    }

    return board;
  }

  public setPiece(square: Square, piece: Piece, accent: Accent = 'none'): void {
    const index = square.index();
    if (accent === 'circumflex') {
      this.board[index] = circumflex(piece);
    } else if (accent === 'diaeresis') {
      this.board[index] = diaeresis(piece);
    } else {
      this.board[index] = piece.symbol;
    }
  }

  public clearSquare(square: Square, accent: 'diaeresis' | 'none' = 'none'): void {
    const index = square.index();
    if (accent === 'diaeresis') {
      this.board[index] = '̤ ';
    } else {
      this.board[index] = '.';
    }
  }

  public print(): string {
    let result = '';
    for (let y = 0; y < 8; y++) {
      result += `${8 - y} `;
      for (let x = 0; x < 8; x++) {
        const piece = this.board[y * 8 + x];
        result += piece ?? '.';
        result += ' ';
      }
      result += '\n';
    }
    result += '  a b c d e f g h\n';
    return result;
  }
}
