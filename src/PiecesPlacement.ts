export const pieceSymbols = ['P', 'N', 'B', 'R', 'Q', 'K', 'p', 'n', 'b', 'r', 'q', 'k'] as const;

export type PieceSymbol = (typeof pieceSymbols)[number];

export type PieceColor = 'w' | 'b';

export class Piece {
  public readonly symbol: PieceSymbol;

  public static readonly WP: Piece = new Piece('P');
  public static readonly WN: Piece = new Piece('N');
  public static readonly WB: Piece = new Piece('B');
  public static readonly WR: Piece = new Piece('R');
  public static readonly WQ: Piece = new Piece('Q');
  public static readonly WK: Piece = new Piece('K');
  public static readonly BP: Piece = new Piece('p');
  public static readonly BN: Piece = new Piece('n');
  public static readonly BB: Piece = new Piece('b');
  public static readonly BR: Piece = new Piece('r');
  public static readonly BQ: Piece = new Piece('q');
  public static readonly BK: Piece = new Piece('k');

  public constructor(symbol: PieceSymbol) {
    this.symbol = symbol;
  }

  public static parse(symbol: string): Piece {
    if (!pieceSymbols.includes(symbol as PieceSymbol)) {
      throw new Error(`Invalid piece symbol: ${symbol}`);
    }
    return new Piece(symbol as PieceSymbol);
  }

  public color(): PieceColor {
    return this.symbol === this.symbol.toUpperCase() ? 'w' : 'b';
  }

  public toString(): string {
    return this.symbol;
  }
}

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
    const fileChar = square[0];
    const rankChar = square[1];
    const fileIndex = fileChar.charCodeAt(0) - 'a'.charCodeAt(0);
    const rankIndex = Number.parseInt(rankChar, 10) - 1;
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
  from: Piece | null;
  to: Piece | null;
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
      Piece.BR, Piece.BN, Piece.BB, Piece.BQ, Piece.BK, Piece.BB, Piece.BN, Piece.BR,
      Piece.BP, Piece.BP, Piece.BP, Piece.BP, Piece.BP, Piece.BP, Piece.BP, Piece.BP,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      Piece.WP, Piece.WP, Piece.WP, Piece.WP, Piece.WP, Piece.WP, Piece.WP, Piece.WP,
      Piece.WR, Piece.WN, Piece.WB, Piece.WQ, Piece.WK, Piece.WB, Piece.WN, Piece.WR,
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
          const piece = Piece.parse(char);
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
    console.log('Initial FEN:', INITIAL_FEN);
    console.log('Current FEN:', this.toFen());
    return this.toFen() === INITIAL_FEN;
  }

  public atIndex(index: number): Piece | null {
    return this.pieces[index] ?? null;
  }

  public at(square: Square): Piece | null {
    return this.atIndex(square.index());
  }

  public put(square: Square, piece: Piece | null): PiecesPlacement {
    return this.putAtIndex(square.index(), piece);
  }

  public putAtIndex(index: number, piece: Piece | null): PiecesPlacement {
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
        rankPieces.push(this.at(square));
      }
      result.push(rankPieces);
    }
    return result;
  }

  public diff(other: PiecesPlacement): TargetChange[] {
    const diff: TargetChange[] = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = new Square(rank, file);
        const index = square.index();
        const from = this.pieces[index];
        const to = other.pieces[index];

        if (from?.symbol !== to?.symbol) {
          diff.push({ square, from, to });
        }
      }
    }
    return diff;
  }

  public equals(other: PiecesPlacement): boolean {
    for (let i = 0; i < 64; i++) {
      const pieceA = this.pieces[i];
      const pieceB = other.pieces[i];
      if (pieceA?.symbol !== pieceB?.symbol) {
        return false;
      }
    }
    return true;
  }
}
