import { Chess, type Move } from 'chess.js';
import {
  type Piece,
  type PieceColor,
  PiecesPlacement,
  type Square,
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

interface PendingSide {
  readonly color: PieceColor;
  readonly returnPlacement: PiecesPlacement;
  readonly legalMoves: readonly Move[];
}

interface TurnSide {
  readonly color: PieceColor;
  readonly legalMoves: readonly Move[];
}

export class ChessPosition {
  public readonly placement: PiecesPlacement;
  public readonly pendingSide: PendingSide | null;
  public readonly turnSide: TurnSide | null;
  public readonly alteration: Alteration | null;

  private chess: Chess;

  public constructor(
    chess: Chess,
    alteration: Alteration | null,
    turnSide: TurnSide | null,
    pendingSide: PendingSide | null,
  ) {
    this.placement = PiecesPlacement.fromFen(chess.fen().split(' ')[0]);
    this.alteration = alteration;
    this.turnSide = turnSide;
    this.pendingSide = pendingSide;
    this.chess = chess;
  }

  public static initial(): ChessPosition {
    const chess = new Chess();
    const legalMoves = chess.moves({ verbose: true });
    return new ChessPosition(chess, null, { color: 'w', legalMoves }, null);
  }

  public toFEN(): string {
    return this.chess.fen();
  }

  // public updateAt(square: Square, piece: Piece | null): ChessPosition {
  //   return new ChessPosition(
  //     this.placement.put(square, piece),
  //     this.activeColor,
  //     this.castlingRights,
  //     this.enPassantSquare,
  //     this.halfmoveClock,
  //     this.fullmoveNumber,
  //     // TODO: update alteration accordingly
  //     this.alteration,
  //     this.turnSide,
  //     this.pendingSide,
  //     this.chess,
  //   );
  // }

  public withAlteration(alteration: Alteration | null): ChessPosition {
    return new ChessPosition(this.chess, alteration, this.turnSide, this.pendingSide);
  }

  private liftedPiece(change: TargetChange): Piece | null {
    if (change.from === null) {
      return null;
    }

    if (change.to !== null) {
      return null;
    }

    const fromColor = change.from.color();
    return fromColor === this.chess.turn() ? change.from : null;
  }

  public next(placement: PiecesPlacement): ChessPosition {
    const diff = this.placement.diff(placement);

    if (this.alteration !== null) {
      if (diff.length === 0) {
        console.log('CHESS POSITION: clearing alteration');
        return this.withAlteration(null);
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
        return this.withAlteration({
          type: 'errors',
          targets: [
            {
              piece: change.from,
              square: change.square,
            },
          ],
        });
      }

      console.log('CHESS POSITION: registering lifted piece');
      return this.withAlteration({
        type: 'lifted',
        piece: liftedPiece,
        square: change.square,
      });
    }

    if (this.pendingSide !== null) {
      if (placement.equals(this.pendingSide.returnPlacement)) {
        console.log('CHESS POSITION: pending side return detected, no alteration');
        this.chess.undo();
        return new ChessPosition(
          this.chess,
          null,
          {
            color: this.pendingSide.color,
            legalMoves: this.chess.moves({ verbose: true }),
          },
          null,
        );
      }

      for (const move of this.pendingSide.legalMoves) {
        const movePlacement = move.after.split(' ')[0];
        if (movePlacement === placement.toFen()) {
          console.log('CHESS POSITION: pending side legal move detected, no alteration');
          this.chess.undo();
          this.chess.move(move);
          return new ChessPosition(
            this.chess,
            null,
            {
              color: this.chess.turn(),
              legalMoves: this.chess.moves({ verbose: true }),
            },
            this.pendingSide,
          );
        }
      }
    }

    if (this.turnSide === null) {
      console.log('CHESS POSITION: no turn side available, registering errors');
      const errors: Target[] = diff.map((change) => ({
        piece: change.from,
        square: change.square,
      }));

      return this.withAlteration({
        type: 'errors',
        targets: errors,
      });
    }

    for (const move of this.turnSide?.legalMoves ?? []) {
      const movePlacement = move.after.split(' ')[0];
      if (movePlacement === placement.toFen()) {
        console.log('CHESS POSITION: legal move detected, no alteration');
        this.chess.move(move);
        return new ChessPosition(
          this.chess,
          null,
          {
            color: this.chess.turn(),
            legalMoves: this.chess.moves({ verbose: true }),
          },
          {
            color: this.turnSide.color,
            returnPlacement: this.placement,
            legalMoves: this.turnSide.legalMoves,
          },
        );
      }
    }

    const errors: Target[] = diff.map((change) => ({
      piece: change.from,
      square: change.square,
    }));

    console.log('CHESS POSITION: registering errors');
    return this.withAlteration({
      type: 'errors',
      targets: errors,
    });
  }
}
