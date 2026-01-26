import { Piece } from './piece.js';
import { Square } from './square.js';

type Pieces = (Piece | null)[];

export type Target = {
  piece: Piece | null;
  square: Square;
};

export type TargetPiece = {
  piece: Piece;
  square: Square;
};

export interface TargetChange {
  square: Square;
  before: Piece | null;
  after: Piece | null;
}

const STARTING_PIECES: Pieces = [
  Piece.BLACK_ROOK,
  Piece.BLACK_KNIGHT,
  Piece.BLACK_BISHOP,
  Piece.BLACK_QUEEN,
  Piece.BLACK_KING,
  Piece.BLACK_BISHOP,
  Piece.BLACK_KNIGHT,

  Piece.BLACK_ROOK,
  Piece.BLACK_PAWN,
  Piece.BLACK_PAWN,
  Piece.BLACK_PAWN,
  Piece.BLACK_PAWN,
  Piece.BLACK_PAWN,
  Piece.BLACK_PAWN,
  Piece.BLACK_PAWN,
  Piece.BLACK_PAWN,

  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,

  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,

  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,

  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,

  Piece.WHITE_PAWN,
  Piece.WHITE_PAWN,
  Piece.WHITE_PAWN,
  Piece.WHITE_PAWN,
  Piece.WHITE_PAWN,
  Piece.WHITE_PAWN,
  Piece.WHITE_PAWN,
  Piece.WHITE_PAWN,

  Piece.WHITE_ROOK,
  Piece.WHITE_KNIGHT,
  Piece.WHITE_BISHOP,
  Piece.WHITE_QUEEN,
  Piece.WHITE_KING,
  Piece.WHITE_BISHOP,
  Piece.WHITE_KNIGHT,
  Piece.WHITE_ROOK,
] as const;

export class PiecesPlacement {
  public readonly pieces: Readonly<Pieces>;

  private constructor(pieces: Readonly<Pieces>) {
    this.pieces = pieces;
  }

  public static empty(): PiecesPlacement {
    return new PiecesPlacement(new Array(64).fill(null));
  }

  public static starting(): PiecesPlacement {
    return new PiecesPlacement(STARTING_PIECES);
  }

  public static fromFen(fen: string): PiecesPlacement {
    const parts = fen.trim().split(/\s+/);
    if (parts.length === 0) {
      throw new Error('Invalid FEN: must have at least 1 part');
    }

    const piecePlacement = parts[0];
    const ranks = piecePlacement.split('/');

    if (ranks.length !== 8) {
      throw new Error('Invalid FEN: must have 8 ranks');
    }

    let squareIndex = 0;
    const pieces: Pieces = new Array(64).fill(null);
    for (const rank of ranks) {
      for (const char of rank) {
        if (char >= '1' && char <= '8') {
          const emptyCount = Number.parseInt(char, 10);
          squareIndex += emptyCount;
        } else {
          const piece = Piece.tryParse(char);
          if (piece === null) {
            throw new Error(`Invalid FEN: invalid piece symbol '${char}'`);
          }
          pieces[squareIndex] = piece;
          squareIndex++;
        }
      }
    }

    if (squareIndex !== 64) {
      throw new Error('Invalid FEN: board must have exactly 64 squares');
    }

    return new PiecesPlacement(pieces);
  }

  public isStarting(): boolean {
    for (let i = 0; i < 64; i++) {
      if (this.pieces[i] !== STARTING_PIECES[i]) {
        console.log(i, this.pieces[i], STARTING_PIECES[i]);
        return false;
      }
    }
    return true;
  }

  public isEmpty(): boolean {
    for (let i = 0; i < 64; i++) {
      if (this.pieces[i] !== null) {
        return false;
      }
    }
    return true;
  }

  public pieceAtIndex(index: number): Piece | null {
    return this.pieces[index] ?? null;
  }

  public pieceAt(square: Square): Piece | null {
    return this.pieceAtIndex(square.index);
  }

  public withPieceAt(square: Square, piece: Piece | null): PiecesPlacement {
    return this.withPieceAtIndex(square.index, piece);
  }

  public withPieceAtIndex(index: number, piece: Piece | null): PiecesPlacement {
    const newPieces = [...this.pieces];
    newPieces[index] = piece;
    return new PiecesPlacement(newPieces);
  }

  public fillRank(rankIndex: number, pieces: (Piece | null)[]): PiecesPlacement {
    if (pieces.length !== 8) {
      throw new Error('Must provide exactly 8 pieces for the rank');
    }

    const newPieces = [...this.pieces];
    const startIndex = rankIndex * 8;
    for (let i = 0; i < 8; i++) {
      newPieces[startIndex + i] = pieces[i];
    }

    return new PiecesPlacement(newPieces);
  }

  public toFen(): string {
    const ranks: string[] = [];
    let rankStr = '';
    let emptyCount = 0;

    for (let i = 0; i < 64; i++) {
      const piece = this.pieces[i];

      if (piece === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rankStr += emptyCount.toString();
          emptyCount = 0;
        }
        rankStr += piece;
      }

      // End of rank (every 8 squares)
      if (i % 8 === 7) {
        if (emptyCount > 0) {
          rankStr += emptyCount.toString();
          emptyCount = 0;
        }
        ranks.push(rankStr);
        rankStr = '';
      }
    }

    return ranks.join('/');
  }

  public ranks(): (Piece | null)[][] {
    const result: (Piece | null)[][] = [];
    for (let i = 0; i < 64; i += 8) {
      result.push([...this.pieces.slice(i, i + 8)]);
    }
    return result;
  }

  public diff(other: PiecesPlacement, limit = 64): TargetChange[] {
    const diff: TargetChange[] = [];
    for (let i = 0; i < 64 && diff.length < limit; i++) {
      const before = this.pieces[i];
      const after = other.pieces[i];
      if (before !== after) {
        diff.push({ square: Square.fromIndex(i), before, after });
      }
    }
    return diff;
  }

  public equals(other: PiecesPlacement): boolean {
    return this.diff(other, 1).length === 0;
  }
}
