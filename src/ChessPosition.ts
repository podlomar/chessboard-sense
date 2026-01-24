import { Chess, type Move } from 'chess.js';
import { PiecesPlacement, type Target, type TargetChange } from './PiecesPlacement.js';
import type { Piece, Side } from './piece.js';
import type { Square } from './square.js';

export interface LiftedPieceStatus {
  type: 'lifted';
  piece: Piece;
  square: Square;
}

export interface ErrorsStatus {
  type: 'errors';
  targets: Target[];
}

export interface ReadyStatus {
  type: 'ready';
}

export interface MovedStatus {
  type: 'moved';
}

export type PositionStatus = LiftedPieceStatus | ErrorsStatus | ReadyStatus | MovedStatus;

export type GameEnding =
  | 'checkmate'
  | 'stalemate'
  | 'insufficient_material'
  | 'threefold_repetition'
  | '50move_rule';

interface PendingSide {
  readonly side: Side;
  readonly returnPlacement: PiecesPlacement;
  readonly legalMoves: readonly Move[];
}

interface TurnSide {
  readonly side: Side;
  readonly legalMoves: readonly Move[];
}

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export interface Turn {
  white: string;
  black: string | null;
}

export class ChessPosition {
  public readonly placement: PiecesPlacement;
  public readonly turnSide: TurnSide;
  public readonly pendingSide: PendingSide | null;
  public readonly status: PositionStatus;

  private chess: Chess;

  public constructor(
    chess: Chess,
    status: PositionStatus,
    turnSide: TurnSide,
    pendingSide: PendingSide | null,
  ) {
    this.chess = chess;
    this.placement = PiecesPlacement.fromFen(chess.fen().split(' ')[0]);
    this.status = status;
    this.turnSide = turnSide;
    this.pendingSide = pendingSide;
  }

  public static initial(): ChessPosition {
    const chess = new Chess();
    const legalMoves = chess.moves({ verbose: true });
    return new ChessPosition(chess, { type: 'ready' }, { side: 'w', legalMoves }, null);
  }

  public toFEN(): string {
    return this.chess.fen();
  }

  public pgn(): string {
    return this.chess.pgn();
  }

  public isStarting(): boolean {
    return this.toFEN() === STARTING_FEN && this.status === null;
  }

  public turnColor(): Side {
    return this.chess.turn();
  }

  public withStatus(status: PositionStatus): ChessPosition {
    return new ChessPosition(this.chess, status, this.turnSide, this.pendingSide);
  }

  private liftedPiece(change: TargetChange): Piece | null {
    if (change.before === null) {
      return null;
    }

    if (change.after !== null) {
      return null;
    }

    const fromColor = change.before.side();
    return fromColor === this.chess.turn() ? change.before : null;
  }

  public movesHistory(): Turn[] {
    const turns: Turn[] = [];
    const history = this.chess.history({ verbose: true });

    for (let i = 0; i < history.length; i += 2) {
      turns.push({
        white: history[i].san,
        black: history[i + 1] ? history[i + 1].san : null,
      });
    }

    return turns;
  }

  public next(placement: PiecesPlacement): ChessPosition {
    const diff = this.placement.diff(placement);

    if (this.status.type === 'lifted' || this.status.type === 'errors') {
      if (diff.length === 0) {
        console.log('CHESS POSITION: clearing alteration');
        return this.withStatus({ type: 'ready' });
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
        return this.withStatus({
          type: 'errors',
          targets: [
            {
              piece: change.before,
              square: change.square,
            },
          ],
        });
      }

      console.log('CHESS POSITION: registering lifted piece');
      return this.withStatus({
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
          { type: 'ready' },
          {
            side: this.pendingSide.side,
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
            { type: 'moved' },
            {
              side: this.chess.turn(),
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
        piece: change.before,
        square: change.square,
      }));

      return this.withStatus({
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
          { type: 'moved' },
          {
            side: this.chess.turn(),
            legalMoves: this.chess.moves({ verbose: true }),
          },
          {
            side: this.turnSide.side,
            returnPlacement: this.placement,
            legalMoves: this.turnSide.legalMoves,
          },
        );
      }
    }

    const errors: Target[] = diff.map((change) => ({
      piece: change.before,
      square: change.square,
    }));

    console.log('CHESS POSITION: registering errors');
    return this.withStatus({
      type: 'errors',
      targets: errors,
    });
  }

  public gameEnding(): GameEnding | null {
    if (this.chess.isCheckmate()) {
      return 'checkmate';
    }

    if (this.chess.isStalemate()) {
      return 'stalemate';
    }

    if (this.chess.isInsufficientMaterial()) {
      return 'insufficient_material';
    }

    if (this.chess.isThreefoldRepetition()) {
      return 'threefold_repetition';
    }

    if (this.chess.isDrawByFiftyMoves()) {
      return '50move_rule';
    }

    return null;
  }
}
