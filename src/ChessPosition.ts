import {
  ChessPiece, parseSquare, PiecesPlacement, Square
} from "./PiecesPlacement.js";

export type PieceColor = 'w' | 'b';

export type CastlingRights = {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
};

const parseCastlingRights = (str: string): CastlingRights => {
  const castlingRegex = /^[KQkq-]+$/;
  if (!castlingRegex.test(str)) {
    throw new Error('Invalid FEN: castling rights must be in format KQkq or "-"');
  }

  return {
    whiteKingside: str.includes('K'),
    whiteQueenside: str.includes('Q'),
    blackKingside: str.includes('k'),
    blackQueenside: str.includes('q'),
  };
};

export const parseEnPassantSquare = (str: string): Square | null => {
  if (str === '-') {
    return null;
  }
  const square = parseSquare(str);
  if (square === null) {
    throw new Error('Invalid FEN: en passant square must be in format [a-h][36] or "-"');
  }
  return square;
};

export class ChessPosition {
  public readonly placement: PiecesPlacement;
  public readonly activeColor: PieceColor;
  public readonly castlingRights: CastlingRights;
  public readonly enPassantSquare: Square | null;
  public readonly halfmoveClock: number;
  public readonly fullmoveNumber: number;

  private constructor(
    placement: PiecesPlacement,
    activeColor: PieceColor,
    castlingRights: CastlingRights,
    enPassantSquare: Square | null,
    halfmoveClock: number,
    fullmoveNumber: number
  ) {
    this.placement = placement;
    this.activeColor = activeColor;
    this.castlingRights = castlingRights;
    this.enPassantSquare = enPassantSquare;
    this.halfmoveClock = halfmoveClock;
    this.fullmoveNumber = fullmoveNumber;
  }

  public static fromFEN(fen: string): ChessPosition {
    const parts = fen.trim().split(/\s+/);

    if (parts.length !== 6) {
      throw new Error('Invalid FEN: must have 6 parts');
    }

    const [
      piecePlacement, activeColor, castling, enPassant, halfmove, fullmove
    ] = parts;

    const placement = PiecesPlacement.fromFen(piecePlacement);

    if (activeColor !== 'w' && activeColor !== 'b') {
      throw new Error('Invalid FEN: active color must be "w" or "b"');
    }

    const castlingRights: CastlingRights = parseCastlingRights(castling);
    const enPassantSquare: Square | null = parseEnPassantSquare(enPassant);
    const halfmoveClock = parseInt(halfmove, 10);

    if (isNaN(halfmoveClock) || halfmoveClock < 0) {
      throw new Error('Invalid FEN: halfmove clock must be a non-negative integer');
    }

    const fullmoveNumber = parseInt(fullmove, 10);
    if (isNaN(fullmoveNumber) || fullmoveNumber < 1) {
      throw new Error('Invalid FEN: fullmove number must be a positive integer');
    }

    return new ChessPosition(
      placement,
      activeColor as PieceColor,
      castlingRights,
      enPassantSquare,
      halfmoveClock,
      fullmoveNumber
    );
  }

  public static initial(): ChessPosition {
    return ChessPosition.fromFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  public toFEN(): string {
    const parts: string[] = [];
    parts.push(this.placement.toFen());
    parts.push(this.activeColor);

    let castling = '';
    if (this.castlingRights.whiteKingside) castling += 'K';
    if (this.castlingRights.whiteQueenside) castling += 'Q';
    if (this.castlingRights.blackKingside) castling += 'k';
    if (this.castlingRights.blackQueenside) castling += 'q';
    parts.push(castling || '-');

    parts.push(this.enPassantSquare || '-');
    parts.push(this.halfmoveClock.toString());
    parts.push(this.fullmoveNumber.toString());

    return parts.join(' ');
  }

  public updateAt(square: Square, piece: ChessPiece | null): ChessPosition {
    return new ChessPosition(
      this.placement.put(square, piece),
      this.activeColor,
      this.castlingRights,
      this.enPassantSquare,
      this.halfmoveClock,
      this.fullmoveNumber
    );
  }

  public update(updates: {
    placement?: PiecesPlacement;
    activeColor?: PieceColor;
    castlingRights?: Partial<CastlingRights>;
    enPassantSquare?: Square | null;
    halfmoveClock?: number;
    fullmoveNumber?: number;
  }): ChessPosition {
    return new ChessPosition(
      updates.placement ?? this.placement,
      updates.activeColor ?? this.activeColor,
      { ...this.castlingRights, ...updates.castlingRights },
      updates.enPassantSquare ?? this.enPassantSquare,
      updates.halfmoveClock ?? this.halfmoveClock,
      updates.fullmoveNumber ?? this.fullmoveNumber
    );
  }

  public toString(): string {
    return `${this.placement.toString()}\nFEN: ${this.toFEN()}`;
  }
}
