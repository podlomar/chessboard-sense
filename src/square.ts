export class Square {
  /** Array index 0-63 (a8=0, h1=63, FEN order) */
  public readonly index: number;

  public static readonly ALL: readonly Square[] = Array.from(
    { length: 64 },
    (_, i) => new Square(i),
  );

  private constructor(index: number) {
    this.index = index;
  }

  /** 0 = rank 1, 7 = rank 8 (zero-indexed from white's perspective) */
  public get rank(): number {
    return 7 - Math.floor(this.index / 8);
  }

  /** 0 = a-file, 7 = h-file */
  public get file(): number {
    return this.index % 8;
  }

  public algebraic(): string {
    const fileChar = String.fromCharCode('a'.charCodeAt(0) + this.file);
    const rankChar = (this.rank + 1).toString();
    return `${fileChar}${rankChar}`;
  }

  public toString(): string {
    return this.algebraic();
  }

  public static fromIndex(index: number): Square {
    if (index < 0 || index > 63) {
      throw new Error(`Invalid square index: ${index}`);
    }
    return Square.ALL[index];
  }

  public static tryFromIndex(index: number): Square | null {
    if (index < 0 || index > 63) {
      return null;
    }
    return Square.ALL[index];
  }

  public static fromCoords(rank: number, file: number): Square {
    if (rank < 0 || rank > 7 || file < 0 || file > 7) {
      throw new Error(`Invalid square coordinates: rank=${rank}, file=${file}`);
    }
    const index = (7 - rank) * 8 + file;
    return Square.ALL[index];
  }

  public static tryFromCoords(rank: number, file: number): Square | null {
    if (rank < 0 || rank > 7 || file < 0 || file > 7) {
      return null;
    }
    const index = (7 - rank) * 8 + file;
    return Square.ALL[index];
  }

  public static fromAlgebraic(notation: string): Square {
    if (notation.length !== 2) {
      throw new Error('Invalid square algebraic notation');
    }

    const fileChar = notation[0];
    const rankChar = notation[1];
    const file = fileChar.charCodeAt(0) - 'a'.charCodeAt(0);
    if (file < 0 || file > 7) {
      throw new Error('Invalid square algebraic notation');
    }

    const rank = Number.parseInt(rankChar, 10) - 1;
    if (Number.isNaN(rank) || rank < 0 || rank > 7) {
      throw new Error('Invalid square algebraic notation');
    }

    return Square.fromCoords(rank, file);
  }

  public static tryFromAlgebraic(notation: string): Square | null {
    if (notation.length !== 2) {
      return null;
    }

    const fileChar = notation[0];
    const rankChar = notation[1];
    const file = fileChar.charCodeAt(0) - 'a'.charCodeAt(0);
    if (file < 0 || file > 7) {
      return null;
    }

    const rank = Number.parseInt(rankChar, 10) - 1;
    if (Number.isNaN(rank) || rank < 0 || rank > 7) {
      return null;
    }

    return Square.tryFromCoords(rank, file);
  }
}
