const PIECE_KIND = ['p', 'n', 'b', 'r', 'q', 'k'] as const;
const PIECE_SYMBOLS = ['P', 'N', 'B', 'R', 'Q', 'K', 'p', 'n', 'b', 'r', 'q', 'k'] as const;

export type PieceKind = (typeof PIECE_KIND)[number];

export type PieceSymbol = (typeof PIECE_SYMBOLS)[number];

export type Side = 'w' | 'b';

export class Piece {
  public readonly symbol: PieceSymbol;

  public static readonly WHITE_PAWN: Piece = new Piece('P');
  public static readonly WHITE_KNIGHT: Piece = new Piece('N');
  public static readonly WHITE_BISHOP: Piece = new Piece('B');
  public static readonly WHITE_ROOK: Piece = new Piece('R');
  public static readonly WHITE_QUEEN: Piece = new Piece('Q');
  public static readonly WHITE_KING: Piece = new Piece('K');
  public static readonly BLACK_PAWN: Piece = new Piece('p');
  public static readonly BLACK_KNIGHT: Piece = new Piece('n');
  public static readonly BLACK_BISHOP: Piece = new Piece('b');
  public static readonly BLACK_ROOK: Piece = new Piece('r');
  public static readonly BLACK_QUEEN: Piece = new Piece('q');
  public static readonly BLACK_KING: Piece = new Piece('k');

  private static readonly BY_SYMBOL: ReadonlyMap<string, Piece> = new Map([
    ['P', Piece.WHITE_PAWN],
    ['N', Piece.WHITE_KNIGHT],
    ['B', Piece.WHITE_BISHOP],
    ['R', Piece.WHITE_ROOK],
    ['Q', Piece.WHITE_QUEEN],
    ['K', Piece.WHITE_KING],
    ['p', Piece.BLACK_PAWN],
    ['n', Piece.BLACK_KNIGHT],
    ['b', Piece.BLACK_BISHOP],
    ['r', Piece.BLACK_ROOK],
    ['q', Piece.BLACK_QUEEN],
    ['k', Piece.BLACK_KING],
  ]);

  private constructor(symbol: PieceSymbol) {
    this.symbol = symbol;
  }

  public static tryParse(symbol: string): Piece | null {
    return Piece.BY_SYMBOL.get(symbol) ?? null;
  }

  public isWhite(): boolean {
    return this.symbol === this.symbol.toUpperCase();
  }

  public isBlack(): boolean {
    return !this.isWhite();
  }

  public side(): Side {
    return this.isWhite() ? 'w' : 'b';
  }

  public withSide(side: Side): Piece {
    if (this.side() === side) {
      return this;
    }

    const newSymbol = side === 'w' ? this.symbol.toUpperCase() : this.symbol.toLowerCase();
    // biome-ignore lint/style/noNonNullAssertion: we know the symbol is valid here
    return Piece.BY_SYMBOL.get(newSymbol)!;
  }

  public kind(): PieceKind {
    return this.symbol.toLowerCase() as PieceKind;
  }

  public toString(): string {
    return this.symbol;
  }
}
