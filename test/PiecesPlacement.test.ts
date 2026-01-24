import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  PiecesPlacement,
  type Square,
  algebraicToIndex,
  parsePiece,
  parseSquare,
} from '../src/PiecesPlacement.js';

describe('PiecesPlacement', () => {
  describe('empty()', () => {
    it('should create an empty board with 64 null squares', () => {
      const placement = PiecesPlacement.empty();

      expect(placement.pieces).to.have.lengthOf(64);

      for (let i = 0; i < 64; i++) {
        expect(placement.pieceAtIndex(i)).to.be.null;
      }
    });

    it('should return null for any square on empty board', () => {
      const placement = PiecesPlacement.empty();

      expect(placement.pieceAt('a1')).to.be.null;
      expect(placement.pieceAt('e4')).to.be.null;
      expect(placement.pieceAt('h8')).to.be.null;
    });
  });

  describe('initial()', () => {
    it('should create the standard chess starting position', () => {
      const placement = PiecesPlacement.starting();

      // Check white pieces (rank 1)
      expect(placement.pieceAt('a1')).to.equal('R');
      expect(placement.pieceAt('b1')).to.equal('N');
      expect(placement.pieceAt('c1')).to.equal('B');
      expect(placement.pieceAt('d1')).to.equal('Q');
      expect(placement.pieceAt('e1')).to.equal('K');
      expect(placement.pieceAt('f1')).to.equal('B');
      expect(placement.pieceAt('g1')).to.equal('N');
      expect(placement.pieceAt('h1')).to.equal('R');

      // Check white pawns (rank 2)
      for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(placement.pieceAt(`${file}2` as Square)).to.equal('P');
      }

      // Check empty squares (ranks 3-6)
      for (const rank of [3, 4, 5, 6]) {
        for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
          expect(placement.pieceAt(`${file}${rank}` as Square)).to.be.null;
        }
      }

      // Check black pawns (rank 7)
      for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(placement.pieceAt(`${file}7` as Square)).to.equal('p');
      }

      // Check black pieces (rank 8)
      expect(placement.pieceAt('a8')).to.equal('r');
      expect(placement.pieceAt('b8')).to.equal('n');
      expect(placement.pieceAt('c8')).to.equal('b');
      expect(placement.pieceAt('d8')).to.equal('q');
      expect(placement.pieceAt('e8')).to.equal('k');
      expect(placement.pieceAt('f8')).to.equal('b');
      expect(placement.pieceAt('g8')).to.equal('n');
      expect(placement.pieceAt('h8')).to.equal('r');
    });
  });

  describe('fromFen()', () => {
    it('should parse the starting position FEN', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      const placement = PiecesPlacement.fromFen(fen);

      expect(placement.pieceAt('e1')).to.equal('K');
      expect(placement.pieceAt('e8')).to.equal('k');
      expect(placement.pieceAt('a2')).to.equal('P');
      expect(placement.pieceAt('a7')).to.equal('p');
      expect(placement.pieceAt('e4')).to.be.null;
    });

    it('should parse FEN with full notation (ignoring extra parts)', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const placement = PiecesPlacement.fromFen(fen);

      expect(placement.pieceAt('e1')).to.equal('K');
    });

    it('should parse a position after e4', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR';
      const placement = PiecesPlacement.fromFen(fen);

      expect(placement.pieceAt('e4')).to.equal('P');
      expect(placement.pieceAt('e2')).to.be.null;
    });

    it('should parse a position with multiple pieces on same rank', () => {
      const fen = 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R';
      const placement = PiecesPlacement.fromFen(fen);

      expect(placement.pieceAt('b5')).to.equal('B');
      expect(placement.pieceAt('c6')).to.equal('n');
      expect(placement.pieceAt('f6')).to.equal('n');
      expect(placement.pieceAt('e5')).to.equal('p');
    });

    it('should parse an empty board', () => {
      const fen = '8/8/8/8/8/8/8/8';
      const placement = PiecesPlacement.fromFen(fen);

      for (let i = 0; i < 64; i++) {
        expect(placement.pieceAtIndex(i)).to.be.null;
      }
    });

    it('should throw error for invalid FEN with wrong number of ranks', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP';

      expect(() => PiecesPlacement.fromFen(fen)).to.throw('Invalid FEN: must have 8 ranks');
    });

    it('should throw error for FEN with incorrect square count', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN';

      expect(() => PiecesPlacement.fromFen(fen)).to.throw(
        'Invalid FEN: board must have exactly 64 squares',
      );
    });

    it('should throw error for empty FEN', () => {
      expect(() => PiecesPlacement.fromFen('')).to.throw('Invalid FEN');
    });
  });

  describe('at() and atIndex()', () => {
    it('should get piece at algebraic notation', () => {
      const placement = PiecesPlacement.starting();

      expect(placement.pieceAt('e1')).to.equal('K');
      expect(placement.pieceAt('e8')).to.equal('k');
      expect(placement.pieceAt('a1')).to.equal('R');
      expect(placement.pieceAt('h8')).to.equal('r');
    });

    it('should get piece at index', () => {
      const placement = PiecesPlacement.starting();

      // Index 0 is a8
      expect(placement.pieceAtIndex(0)).to.equal('r');
      // Index 7 is h8
      expect(placement.pieceAtIndex(7)).to.equal('r');
      // Index 56 is a1
      expect(placement.pieceAtIndex(56)).to.equal('R');
      // Index 63 is h1
      expect(placement.pieceAtIndex(63)).to.equal('R');
    });

    it('should return null for empty squares', () => {
      const placement = PiecesPlacement.starting();

      expect(placement.pieceAt('e4')).to.be.null;
      expect(placement.pieceAt('d5')).to.be.null;
      expect(placement.pieceAtIndex(27)).to.be.null; // d5
    });
  });

  describe('put()', () => {
    it('should create new placement with piece added', () => {
      const empty = PiecesPlacement.empty();
      const withKing = empty.withPieceAt('e4', 'K');

      expect(withKing.pieceAt('e4')).to.equal('K');
      expect(empty.pieceAt('e4')).to.be.null; // Original unchanged
    });

    it('should create new placement with piece replaced', () => {
      const initial = PiecesPlacement.starting();
      const modified = initial.withPieceAt('e2', 'Q');

      expect(modified.pieceAt('e2')).to.equal('Q');
      expect(initial.pieceAt('e2')).to.equal('P'); // Original unchanged
    });

    it('should create new placement with piece removed', () => {
      const initial = PiecesPlacement.starting();
      const modified = initial.withPieceAt('e2', null);

      expect(modified.pieceAt('e2')).to.be.null;
      expect(initial.pieceAt('e2')).to.equal('P'); // Original unchanged
    });

    it('should preserve immutability', () => {
      const placement1 = PiecesPlacement.empty();
      const placement2 = placement1.withPieceAt('e4', 'K');
      const placement3 = placement2.withPieceAt('d4', 'Q');

      expect(placement1.pieceAt('e4')).to.be.null;
      expect(placement1.pieceAt('d4')).to.be.null;

      expect(placement2.pieceAt('e4')).to.equal('K');
      expect(placement2.pieceAt('d4')).to.be.null;

      expect(placement3.pieceAt('e4')).to.equal('K');
      expect(placement3.pieceAt('d4')).to.equal('Q');
    });
  });

  describe('putRank()', () => {
    it('should set an entire rank with pieces', () => {
      const empty = PiecesPlacement.empty();
      const withRank = empty.putRank(1, ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']);

      expect(withRank.at('a1')).to.equal('R');
      expect(withRank.at('b1')).to.equal('N');
      expect(withRank.at('c1')).to.equal('B');
      expect(withRank.at('d1')).to.equal('Q');
      expect(withRank.at('e1')).to.equal('K');
      expect(withRank.at('f1')).to.equal('B');
      expect(withRank.at('g1')).to.equal('N');
      expect(withRank.at('h1')).to.equal('R');
    });

    it('should set rank with null values for empty squares', () => {
      const empty = PiecesPlacement.empty();
      const withRank = empty.putRank(4, ['P', null, null, null, null, null, null, 'P']);

      expect(withRank.at('a4')).to.equal('P');
      expect(withRank.at('b4')).to.be.null;
      expect(withRank.at('c4')).to.be.null;
      expect(withRank.at('d4')).to.be.null;
      expect(withRank.at('e4')).to.be.null;
      expect(withRank.at('f4')).to.be.null;
      expect(withRank.at('g4')).to.be.null;
      expect(withRank.at('h4')).to.equal('P');
    });

    it('should replace existing rank', () => {
      const initial = PiecesPlacement.starting();
      const modified = initial.putRank(2, [null, null, null, null, null, null, null, null]);

      // Rank 2 should be empty
      expect(modified.at('a2')).to.be.null;
      expect(modified.at('e2')).to.be.null;
      expect(modified.at('h2')).to.be.null;

      // Other ranks should be unchanged
      expect(modified.at('a1')).to.equal('R');
      expect(modified.at('e1')).to.equal('K');
    });

    it('should work with all ranks 1-8', () => {
      const empty = PiecesPlacement.empty();
      const pieces: ('p' | null)[] = ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'];

      for (let rank = 1; rank <= 8; rank++) {
        const withRank = empty.putRank(rank as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, pieces);

        // Check all squares in the rank
        for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
          expect(withRank.at(`${file}${rank}` as Square)).to.equal('p');
        }
      }
    });

    it('should preserve immutability', () => {
      const placement1 = PiecesPlacement.empty();
      const placement2 = placement1.putRank(1, ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']);

      expect(placement1.pieceAt('e1')).to.be.null;
      expect(placement2.at('e1')).to.equal('K');
    });

    it('should throw error if not exactly 8 pieces provided', () => {
      const empty = PiecesPlacement.empty();

      expect(() => empty.putRank(1, ['R', 'N', 'B'])).to.throw(
        'Must provide exactly 8 pieces for the rank',
      );

      expect(() => empty.putRank(1, ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R', 'R'])).to.throw(
        'Must provide exactly 8 pieces for the rank',
      );

      expect(() => empty.putRank(1, [])).to.throw('Must provide exactly 8 pieces for the rank');
    });

    it('should allow building a position rank by rank', () => {
      const position = PiecesPlacement.empty()
        .putRank(1, ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'])
        .putRank(2, ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'])
        .putRank(7, ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'])
        .putRank(8, ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']);

      expect(position.toFen()).to.equal('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    });
  });

  describe('toFen()', () => {
    it('should convert initial position to FEN', () => {
      const placement = PiecesPlacement.starting();
      const fen = placement.toFen();

      expect(fen).to.equal('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    });

    it('should convert empty board to FEN', () => {
      const placement = PiecesPlacement.empty();
      const fen = placement.toFen();

      expect(fen).to.equal('8/8/8/8/8/8/8/8');
    });

    it('should convert position after e4 to FEN', () => {
      const placement = PiecesPlacement.starting().withPieceAt('e2', null).withPieceAt('e4', 'P');
      const fen = placement.toFen();

      expect(fen).to.equal('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR');
    });

    it('should handle consecutive empty squares', () => {
      const placement = PiecesPlacement.empty().withPieceAt('a1', 'K').withPieceAt('h1', 'R');
      const fen = placement.toFen();

      expect(fen).to.equal('8/8/8/8/8/8/8/K6R');
    });

    it('should round-trip FEN parsing and generation', () => {
      const originalFen = 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R';
      const placement = PiecesPlacement.fromFen(originalFen);
      const generatedFen = placement.toFen();

      expect(generatedFen).to.equal(originalFen);
    });

    it('should round-trip with starting position', () => {
      const originalFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      const placement = PiecesPlacement.fromFen(originalFen);
      const generatedFen = placement.toFen();

      expect(generatedFen).to.equal(originalFen);
    });
  });

  describe('algebraicToIndex()', () => {
    it('should convert a1 to index 56', () => {
      expect(algebraicToIndex('a1')).to.equal(56);
    });

    it('should convert h1 to index 63', () => {
      expect(algebraicToIndex('h1')).to.equal(63);
    });

    it('should convert a8 to index 0', () => {
      expect(algebraicToIndex('a8')).to.equal(0);
    });

    it('should convert h8 to index 7', () => {
      expect(algebraicToIndex('h8')).to.equal(7);
    });

    it('should convert e4 to index 36', () => {
      expect(algebraicToIndex('e4')).to.equal(36);
    });

    it('should convert d5 to index 27', () => {
      expect(algebraicToIndex('d5')).to.equal(27);
    });
  });

  describe('parsePiece()', () => {
    it('should parse valid white pieces', () => {
      expect(parsePiece('P')).to.equal('P');
      expect(parsePiece('N')).to.equal('N');
      expect(parsePiece('B')).to.equal('B');
      expect(parsePiece('R')).to.equal('R');
      expect(parsePiece('Q')).to.equal('Q');
      expect(parsePiece('K')).to.equal('K');
    });

    it('should parse valid black pieces', () => {
      expect(parsePiece('p')).to.equal('p');
      expect(parsePiece('n')).to.equal('n');
      expect(parsePiece('b')).to.equal('b');
      expect(parsePiece('r')).to.equal('r');
      expect(parsePiece('q')).to.equal('q');
      expect(parsePiece('k')).to.equal('k');
    });

    it('should return null for invalid pieces', () => {
      expect(parsePiece('X')).to.be.null;
      expect(parsePiece('1')).to.be.null;
      expect(parsePiece('')).to.be.null;
      expect(parsePiece('PP')).to.be.null;
      expect(parsePiece(' ')).to.be.null;
    });
  });

  describe('parseSquare()', () => {
    it('should parse valid squares', () => {
      expect(parseSquare('a1')).to.equal('a1');
      expect(parseSquare('h8')).to.equal('h8');
      expect(parseSquare('e4')).to.equal('e4');
      expect(parseSquare('d5')).to.equal('d5');
      expect(parseSquare('a8')).to.equal('a8');
      expect(parseSquare('h1')).to.equal('h1');
    });

    it('should return null for invalid files', () => {
      expect(parseSquare('i1')).to.be.null;
      expect(parseSquare('z5')).to.be.null;
      expect(parseSquare('A1')).to.be.null;
    });

    it('should return null for invalid ranks', () => {
      expect(parseSquare('a0')).to.be.null;
      expect(parseSquare('a9')).to.be.null;
      expect(parseSquare('e10')).to.be.null;
    });

    it('should return null for invalid length', () => {
      expect(parseSquare('a')).to.be.null;
      expect(parseSquare('a12')).to.be.null;
      expect(parseSquare('')).to.be.null;
    });

    it('should return null for completely invalid input', () => {
      expect(parseSquare('xy')).to.be.null;
      expect(parseSquare('12')).to.be.null;
      expect(parseSquare('  ')).to.be.null;
    });
  });

  describe('toString()', () => {
    it('should display the board as ASCII art', () => {
      const placement = PiecesPlacement.starting();
      const str = placement.toAscii();

      expect(str).to.include('r n b q k b n r   8');
      expect(str).to.include('p p p p p p p p   7');
      expect(str).to.include('P P P P P P P P   2');
      expect(str).to.include('R N B Q K B N R   1');
      expect(str).to.include('a b c d e f g h');
    });

    it('should display empty squares as dots', () => {
      const placement = PiecesPlacement.empty();
      const str = placement.toAscii();

      expect(str).to.include('. . . . . . . .   8');
      expect(str).to.include('. . . . . . . .   1');
      expect(str).to.include('a b c d e f g h');
    });

    it('should display mixed pieces and empty squares', () => {
      const placement = PiecesPlacement.empty().withPieceAt('e4', 'P').withPieceAt('e5', 'p');
      const str = placement.toAscii();

      expect(str).to.include('. . . . p . . .   5');
      expect(str).to.include('. . . . P . . .   4');
    });
  });
});
