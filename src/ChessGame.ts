import type { ChessPosition } from './ChessPosition';
import { PiecesPlacement } from './PiecesPlacement.js';

export interface SettingUpState {
  readonly type: 'setting-up';
  readonly placement: PiecesPlacement;
}

export interface InProgressState {
  readonly type: 'in-progress';
  readonly position: ChessPosition;
}

export type ChessGameState = SettingUpState | InProgressState;

type StateChangeCallback = (newState: ChessGameState) => void;

export class ChessGame {
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
