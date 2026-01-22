import type { ChessPosition } from './ChessPosition.js';
import { PiecesPlacement } from './PiecesPlacement.js';

export class ChessBoard {
  private gameState: ChessGameState;
  private onChangeCallback: StateChangeCallback | null = null;

  public constructor() {
    this.gameState = {
      type: 'setting-up',
      placement: PiecesPlacement.empty(),
    };
  }

  public onStateChange(callback: StateChangeCallback): void {
    this.onChangeCallback = callback;
  }

  public get state(): ChessGameState {
    return this.gameState;
  }

  public updatePlacement(placement: PiecesPlacement): void {
    if (this.gameState.type === 'setting-up') {
      this.updateState({
        type: 'setting-up',
        placement: placement,
      });
    }

    return;
  }

  private updateState(newState: ChessGameState): void {
    this.gameState = newState;
    if (this.onChangeCallback) {
      this.onChangeCallback(newState);
    }
  }
}

// if (this.currentState?.status === 'playing') {
//       const currentPosition = this.currentState.position;
//       const feedback = currentPosition.buildFeedback(placement);
//       if (feedback.isEmpty()) {
//         this.currentState = {
//           position: currentPosition,
//           chess: this.currentState.chess,
//           status: 'playing',
//           feedback,
//           returned: true,
//         };
//         this.onNewState?.(this.currentState);
//         return;
//       }

//       if (feedback.isLifted(this.turnSide!.color)) {
//         this.currentState = {
//           position: currentPosition,
//           chess: this.currentState.chess,
//           status: 'playing',
//           feedback,
//           returned: false,
//         };
//         this.pendingSide = null;
//         this.onNewState?.(this.currentState);
//         return;
//       }

//       if (this.pendingSide !== null) {
//         const returnPlacement = this.pendingSide.returnPlacement;
//         if (returnPlacement.equals(placement)) {
//           this.currentState.chess.undo();
//           this.currentState = {
//             position: new BoardPosition(returnPlacement, this.pendingSide.color),
//             chess: this.currentState.chess,
//             status: 'playing',
//             feedback: BoardFeedback.empty(),
//             returned: true,
//           };
//           this.onNewState?.(this.currentState);
//           return;
//         }
//       }

//       for (const move of this.turnSide!.validMoves) {
//         const position = BoardPosition.fromFen(move.after);
//         const feedback = position.buildFeedback(placement);
//         if (feedback.isEmpty()) {
//           this.currentState.chess.move(move);
//           console.log("Detected move:", move.san);
//           if (this.currentState.chess.isGameOver()) {
//             this.currentState = {
//               position,
//               status: 'over',
//               chess: this.currentState.chess,
//             };
//             this.releaseWakeLock();
//             this.onNewState?.(this.currentState);
//             return;
//           }

//           this.pendingSide = {
//             color: this.turnSide!.color,
//             returnPlacement: currentPosition.placement,
//             validMoves: this.turnSide!.validMoves,
//           }
//           this.turnSide = {
//             color: this.turnSide!.color === 'w' ? 'b' : 'w',
//             validMoves: this.currentState.chess.moves({ verbose: true }),
//           };
//           this.currentState = {
//             position,
//             chess: this.currentState.chess,
//             status: 'playing',
//             feedback,
//             returned: false,
//           };
//           this.onNewState?.(this.currentState);
//           return;
//         }
//       }

//       for (const move of (this.pendingSide?.validMoves ?? [])) {
//         const position = BoardPosition.fromFen(move.after);
//         const feedback = position.buildFeedback(placement);
//         if (feedback.isEmpty()) {
//           this.currentState.chess.undo();
//           this.currentState.chess.move(move);

//           if (this.currentState.chess.isGameOver()) {
//             this.currentState = {
//               position,
//               status: 'over',
//               chess: this.currentState.chess,
//             };
//             this.releaseWakeLock();
//             this.onNewState?.(this.currentState);
//             return;
//           }

//           this.turnSide = {
//             color: this.turnSide!.color,
//             validMoves: this.currentState.chess.moves({ verbose: true }),
//           };
//           this.currentState = {
//             position,
//             chess: this.currentState.chess,
//             status: 'playing',
//             feedback,
//             returned: false,
//           };
//           this.onNewState?.(this.currentState);
//           return;
//         }
//       }

//       this.currentState = {
//         position: currentPosition,
//         chess: this.currentState.chess,
//         status: 'playing',
//         feedback,
//         returned: false,
//       };
//       this.onNewState?.(this.currentState);
//       return;
//     }

//     const newState: GameState = {
//       placement,
//       status: 'random',
//     };
//     this.currentState = newState;
//     this.onNewState?.(newState);
//   }
