import { Chess, type Move } from 'chess.js';
import {
  type Piece,
  type PieceColor,
  PiecesPlacement,
  Square,
  type Target,
  type TargetChange,
  type TargetPiece,
} from './PiecesPlacement.js';

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

  const square = Square.parseAlgebraic(str);
  if (square === null || (square.rankIndex !== 2 && square.rankIndex !== 5)) {
    throw new Error('Invalid FEN: en passant square must be in format [a-h][36] or "-"');
  }
  return square;
};

export interface LiftedPiece {
  type: 'lifted';
  piece: Piece;
  square: Square;
}

export interface Errors {
  type: 'errors';
  targets: Target[];
}

export type Alteration = LiftedPiece | Errors;

export class ChessPosition {
  public readonly placement: PiecesPlacement;
  public readonly activeColor: PieceColor;
  public readonly castlingRights: CastlingRights;
  public readonly enPassantSquare: Square | null;
  public readonly halfmoveClock: number;
  public readonly fullmoveNumber: number;
  public readonly alteration: Alteration | null;

  private constructor(
    placement: PiecesPlacement,
    activeColor: PieceColor,
    castlingRights: CastlingRights,
    enPassantSquare: Square | null,
    halfmoveClock: number,
    fullmoveNumber: number,
    alteration: Alteration | null,
  ) {
    this.placement = placement;
    this.activeColor = activeColor;
    this.castlingRights = castlingRights;
    this.enPassantSquare = enPassantSquare;
    this.halfmoveClock = halfmoveClock;
    this.fullmoveNumber = fullmoveNumber;
    this.alteration = alteration;
  }

  public static fromFEN(fen: string): ChessPosition {
    const parts = fen.trim().split(/\s+/);

    if (parts.length !== 6) {
      throw new Error('Invalid FEN: must have 6 parts');
    }

    const [piecePlacement, activeColor, castling, enPassant, halfmove, fullmove] = parts;

    const placement = PiecesPlacement.fromFen(piecePlacement);

    if (activeColor !== 'w' && activeColor !== 'b') {
      throw new Error('Invalid FEN: active color must be "w" or "b"');
    }

    const castlingRights: CastlingRights = parseCastlingRights(castling);
    const enPassantSquare: Square | null = parseEnPassantSquare(enPassant);
    const halfmoveClock = Number.parseInt(halfmove, 10);

    if (Number.isNaN(halfmoveClock) || halfmoveClock < 0) {
      throw new Error('Invalid FEN: halfmove clock must be a non-negative integer');
    }

    const fullmoveNumber = Number.parseInt(fullmove, 10);
    if (Number.isNaN(fullmoveNumber) || fullmoveNumber < 1) {
      throw new Error('Invalid FEN: fullmove number must be a positive integer');
    }

    return new ChessPosition(
      placement,
      activeColor as PieceColor,
      castlingRights,
      enPassantSquare,
      halfmoveClock,
      fullmoveNumber,
      null,
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

    parts.push(this.enPassantSquare ? this.enPassantSquare.algebraic() : '-');
    parts.push(this.halfmoveClock.toString());
    parts.push(this.fullmoveNumber.toString());

    return parts.join(' ');
  }

  public updateAt(square: Square, piece: Piece | null): ChessPosition {
    return new ChessPosition(
      this.placement.put(square, piece),
      this.activeColor,
      this.castlingRights,
      this.enPassantSquare,
      this.halfmoveClock,
      this.fullmoveNumber,
      // TODO: update alteration accordingly
      this.alteration,
    );
  }

  public update(updates: {
    placement?: PiecesPlacement;
    activeColor?: PieceColor;
    castlingRights?: Partial<CastlingRights>;
    enPassantSquare?: Square | null;
    halfmoveClock?: number;
    fullmoveNumber?: number;
    alteration?: Alteration | null;
  }): ChessPosition {
    return new ChessPosition(
      updates.placement ?? this.placement,
      updates.activeColor ?? this.activeColor,
      { ...this.castlingRights, ...updates.castlingRights },
      updates.enPassantSquare === undefined ? this.enPassantSquare : updates.enPassantSquare,
      updates.halfmoveClock ?? this.halfmoveClock,
      updates.fullmoveNumber ?? this.fullmoveNumber,
      updates.alteration === undefined ? this.alteration : updates.alteration,
    );
  }

  private liftedPiece(change: TargetChange): Piece | null {
    if (change.from === null) {
      return null;
    }

    if (change.to !== null) {
      return null;
    }

    const fromColor = change.from.color();
    return fromColor === this.activeColor ? change.from : null;
  }

  public next(placement: PiecesPlacement): ChessPosition {
    const diff = this.placement.diff(placement);

    if (this.alteration !== null) {
      if (diff.length === 0) {
        console.log('CHESS POSITION: clearing alteration');
        return this.update({ alteration: null });
      }
    }

    if (diff.length === 0) {
      console.log('CHESS POSITION: no changes detected');
      return this;
    }

    if (diff.length === 1) {
      const change = diff[0];
      const liftedPiece = this.liftedPiece(change);
      if (liftedPiece === null) {
        console.log('CHESS POSITION: registering error for single change');
        return this.update({
          alteration: {
            type: 'errors',
            targets: [
              {
                piece: change.from,
                square: change.square,
              },
            ],
          },
        });
      }

      console.log('CHESS POSITION: registering lifted piece');
      return this.update({
        alteration: {
          type: 'lifted',
          piece: liftedPiece,
          square: change.square,
        },
      });
    }

    const errors: Target[] = diff.map((change) => ({
      piece: change.from,
      square: change.square,
    }));

    console.log('CHESS POSITION: registering errors');
    return this.update({
      alteration: {
        type: 'errors',
        targets: errors,
      },
    });
  }

  /* console.log('Current position FEN:', this.toFEN());
    console.log('New placement FEN:', placement.toFen());
    console.log('Diff:', diff);

    if (diff.length === 0) {
      return this;
    }

    const chess = new Chess(this.toFEN());
    if (chess.isGameOver()) {
      return this.update({
        errors: diff.map((change) => ({
          square: change.square,
          piece: change.to,
        })),
      });
    }

    if (diff.length === 1) {
      const change = diff[0];
      if (change.from !== null && change.to === null) {
        const fromColor = change.from.color();
        if (fromColor === this.activeColor) {
          return this.update({
            lifted: { piece: change.from, square: change.square },
          });
        }

        return this.update({
          errors: [
            {
              square: change.square,
              piece: change.from,
            },
          ],
        });
      }
    }

    const moves: Move[] = chess.moves({ verbose: true });
    for (const move of moves) {
      const nextPlacement = PiecesPlacement.fromFen(move.after);
      if (nextPlacement.diff(placement).length === 0) {
        return ChessPosition.fromFEN(move.after);
      }
    } */
}
