import { Piece } from './piece.js';

type Pieces = (Piece | null)[];

export class Square {
  public readonly rankIndex: number;
  public readonly fileIndex: number;

  public constructor(rankIndex: number, fileIndex: number) {
    this.rankIndex = rankIndex;
    this.fileIndex = fileIndex;
  }

  public equals(other: Square): boolean {
    return this.rankIndex === other.rankIndex && this.fileIndex === other.fileIndex;
  }

  public index(): number {
    return (7 - this.rankIndex) * 8 + this.fileIndex;
  }

  public algebraic(): string {
    const fileChar = String.fromCharCode('a'.charCodeAt(0) + this.fileIndex);
    const rankChar = (this.rankIndex + 1).toString();
    return `${fileChar}${rankChar}`;
  }

  public static fromAlgebraic(square: string): Square {
    if (square.length !== 2) {
      throw new Error('Invalid square algebraic notation');
    }

    const fileChar = square[0];
    const rankChar = square[1];
    const fileIndex = fileChar.charCodeAt(0) - 'a'.charCodeAt(0);
    if (fileIndex < 0 || fileIndex > 7) {
      throw new Error('Invalid square algebraic notation');
    }

    const rankIndex = Number.parseInt(rankChar, 10) - 1;
    if (Number.isNaN(rankIndex) || rankIndex < 0 || rankIndex > 7) {
      throw new Error('Invalid square algebraic notation');
    }
    return new Square(rankIndex, fileIndex);
  }

  public static parseAlgebraic(square: string): Square | null {
    if (square.length !== 2) {
      return null;
    }
    const fileChar = square[0];
    const rankChar = square[1];
    const fileIndex = fileChar.charCodeAt(0) - 'a'.charCodeAt(0);
    const rankIndex = Number.parseInt(rankChar, 10) - 1;
    if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) {
      return null;
    }
    return new Square(rankIndex, fileIndex);
  }

  public static fromIndex(index: number): Square {
    const rankIndex = 7 - Math.floor(index / 8);
    const fileIndex = index % 8;
    return new Square(rankIndex, fileIndex);
  }
}

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

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

export class PiecesPlacement {
  public readonly pieces: Readonly<Pieces>;

  private constructor(pieces: Readonly<Pieces>) {
    this.pieces = pieces;
  }

  public static empty(): PiecesPlacement {
    return new PiecesPlacement(new Array(64).fill(null));
  }

  public static initial(): PiecesPlacement {
    // biome-ignore format: we want to keep this layout
    return new PiecesPlacement([
      Piece.BLACK_ROOK, Piece.BLACK_KNIGHT, Piece.BLACK_BISHOP, Piece.BLACK_QUEEN, Piece.BLACK_KING, Piece.BLACK_BISHOP, Piece.BLACK_KNIGHT, Piece.BLACK_ROOK,
      Piece.BLACK_PAWN, Piece.BLACK_PAWN, Piece.BLACK_PAWN, Piece.BLACK_PAWN, Piece.BLACK_PAWN, Piece.BLACK_PAWN, Piece.BLACK_PAWN, Piece.BLACK_PAWN,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      Piece.WHITE_ROOK, Piece.WHITE_KNIGHT, Piece.WHITE_BISHOP, Piece.WHITE_QUEEN, Piece.WHITE_KING, Piece.
      WHITE_BISHOP, Piece.WHITE_KNIGHT, Piece.WHITE_ROOK,
      Piece.WHITE_PAWN, Piece.WHITE_PAWN, Piece.WHITE_PAWN, Piece.WHITE_PAWN, Piece.WHITE_PAWN, Piece.WHITE_PAWN, Piece.WHITE_PAWN, Piece.WHITE_PAWN,
    ]);
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

  public isInitial(): boolean {
    return this.toFen() === INITIAL_FEN;
  }

  public pieceAtIndex(index: number): Piece | null {
    return this.pieces[index] ?? null;
  }

  public pieceAt(square: Square): Piece | null {
    return this.pieceAtIndex(square.index());
  }

  public withPieceAt(square: Square, piece: Piece | null): PiecesPlacement {
    return this.withPieceAtIndex(square.index(), piece);
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
    for (let rank = 7; rank >= 0; rank--) {
      let rankStr = '';
      let emptyCount = 0;

      for (let file = 0; file < 8; file++) {
        const square = new Square(rank, file);
        const squareIndex = square.index();
        const piece = this.pieces[squareIndex];

        if (piece === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rankStr += emptyCount.toString();
            emptyCount = 0;
          }
          rankStr += piece;
        }
      }

      if (emptyCount > 0) {
        rankStr += emptyCount.toString();
      }

      ranks.push(rankStr);
    }

    return ranks.join('/');
  }

  public ranks(): (Piece | null)[][] {
    const result: (Piece | null)[][] = [];
    for (let rank = 7; rank >= 0; rank--) {
      const rankPieces: (Piece | null)[] = [];
      for (let file = 0; file < 8; file++) {
        const square = new Square(rank, file);
        rankPieces.push(this.pieceAt(square));
      }
      result.push(rankPieces);
    }
    return result;
  }

  public diff(other: PiecesPlacement): TargetChange[] {
    const diff: TargetChange[] = [];
    for (let i = 0; i < 64; i++) {
      const before = this.pieces[i];
      const after = other.pieces[i];
      if (before !== after) {
        diff.push({ square: Square.fromIndex(i), before, after });
      }
    }
    return diff;
  }

  public equals(other: PiecesPlacement): boolean {
    for (let i = 0; i < 64; i++) {
      const pieceA = this.pieces[i];
      const pieceB = other.pieces[i];
      if (pieceA !== pieceB) {
        return false;
      }
    }
    return true;
  }
}
