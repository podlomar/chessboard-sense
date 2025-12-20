export const chessPieces = [
  'P', 'N', 'B', 'R', 'Q', 'K',
  'p', 'n', 'b', 'r', 'q', 'k',
] as const;

export type ChessPiece = typeof chessPieces[number];

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

export type Square = `${File}${Rank}`;

export type Pieces = (ChessPiece | null)[];

export const algebraicToIndex = (square: Square): number => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = 8 - parseInt(square[1], 10);
  return rank * 8 + file;
}

export const parsePiece = (char: string): ChessPiece | null => {
  if (chessPieces.includes(char as ChessPiece)) {
    return char as ChessPiece;
  }
  return null;
};

export const parseSquare = (str: string): Square | null => {
  if (str.length !== 2) {
    return null;
  }
  const file = str[0];
  const rank = parseInt(str[1], 10);

  if (
    file < 'a' || file > 'h' ||
    rank < 1 || rank > 8
  ) {
    return null;
  }

  return str as Square;
};

export class PiecesPlacement {
  public readonly pieces: Readonly<Pieces>;

  private constructor(pieces: Readonly<Pieces>) {
    this.pieces = pieces;
  }

  public static empty(): PiecesPlacement {
    return new PiecesPlacement(new Array(64).fill(null));
  }

  public static initial(): PiecesPlacement {
    return new PiecesPlacement([
      'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r',
      'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p',
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P',
      'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R',
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
          const emptyCount = parseInt(char, 10);
          squareIndex += emptyCount;
        } else {
          pieces[squareIndex] = char as ChessPiece;
          squareIndex++;
        }
      }
    }

    if (squareIndex !== 64) {
      throw new Error('Invalid FEN: board must have exactly 64 squares');
    }

    return new PiecesPlacement(pieces);
  }

  public atIndex(index: number): ChessPiece | null {
    return this.pieces[index] ?? null;
  }

  public at(square: Square): ChessPiece | null {
    const index = algebraicToIndex(square);
    return this.atIndex(index);
  }

  public put(square: Square, piece: ChessPiece | null): PiecesPlacement {
    const index = algebraicToIndex(square);
    const newPieces = [...this.pieces];
    newPieces[index] = piece;
    return new PiecesPlacement(newPieces);
  }

  public toFen(): string {
    const parts: string[] = [];

    const ranks: string[] = [];
    for (let rank = 0; rank < 8; rank++) {
      let rankStr = '';
      let emptyCount = 0;

      for (let file = 0; file < 8; file++) {
        const squareIndex = rank * 8 + file;
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

  public toString(): string {
    let result = '';
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = this.atIndex(rank * 8 + file);
        result += piece ?? '.';
        result += ' ';
      }
      result += `  ${8 - rank}\n`;
    }
    result += 'a b c d e f g h\n';
    return result;
  }
}
