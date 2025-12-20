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
        expect(placement.atIndex(i)).to.be.null;
      }
    });

    it('should return null for any square on empty board', () => {
      const placement = PiecesPlacement.empty();

      expect(placement.at('a1')).to.be.null;
      expect(placement.at('e4')).to.be.null;
      expect(placement.at('h8')).to.be.null;
    });
  });

  describe('initial()', () => {
    it('should create the standard chess starting position', () => {
      const placement = PiecesPlacement.initial();

      // Check white pieces (rank 1)
      expect(placement.at('a1')).to.equal('R');
      expect(placement.at('b1')).to.equal('N');
      expect(placement.at('c1')).to.equal('B');
      expect(placement.at('d1')).to.equal('Q');
      expect(placement.at('e1')).to.equal('K');
      expect(placement.at('f1')).to.equal('B');
      expect(placement.at('g1')).to.equal('N');
      expect(placement.at('h1')).to.equal('R');

      // Check white pawns (rank 2)
      for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(placement.at(`${file}2` as Square)).to.equal('P');
      }

      // Check empty squares (ranks 3-6)
      for (const rank of [3, 4, 5, 6]) {
        for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
          expect(placement.at(`${file}${rank}` as Square)).to.be.null;
        }
      }

      // Check black pawns (rank 7)
      for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(placement.at(`${file}7` as Square)).to.equal('p');
      }

      // Check black pieces (rank 8)
      expect(placement.at('a8')).to.equal('r');
      expect(placement.at('b8')).to.equal('n');
      expect(placement.at('c8')).to.equal('b');
      expect(placement.at('d8')).to.equal('q');
      expect(placement.at('e8')).to.equal('k');
      expect(placement.at('f8')).to.equal('b');
      expect(placement.at('g8')).to.equal('n');
      expect(placement.at('h8')).to.equal('r');
    });
  });

  describe('fromFen()', () => {
    it('should parse the starting position FEN', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      const placement = PiecesPlacement.fromFen(fen);

      expect(placement.at('e1')).to.equal('K');
      expect(placement.at('e8')).to.equal('k');
      expect(placement.at('a2')).to.equal('P');
      expect(placement.at('a7')).to.equal('p');
      expect(placement.at('e4')).to.be.null;
    });

    it('should parse FEN with full notation (ignoring extra parts)', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const placement = PiecesPlacement.fromFen(fen);

      expect(placement.at('e1')).to.equal('K');
    });

    it('should parse a position after e4', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR';
      const placement = PiecesPlacement.fromFen(fen);

      expect(placement.at('e4')).to.equal('P');
      expect(placement.at('e2')).to.be.null;
    });

    it('should parse a position with multiple pieces on same rank', () => {
      const fen = 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R';
      const placement = PiecesPlacement.fromFen(fen);

      expect(placement.at('b5')).to.equal('B');
      expect(placement.at('c6')).to.equal('n');
      expect(placement.at('f6')).to.equal('n');
      expect(placement.at('e5')).to.equal('p');
    });

    it('should parse an empty board', () => {
      const fen = '8/8/8/8/8/8/8/8';
      const placement = PiecesPlacement.fromFen(fen);

      for (let i = 0; i < 64; i++) {
        expect(placement.atIndex(i)).to.be.null;
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
      const placement = PiecesPlacement.initial();

      expect(placement.at('e1')).to.equal('K');
      expect(placement.at('e8')).to.equal('k');
      expect(placement.at('a1')).to.equal('R');
      expect(placement.at('h8')).to.equal('r');
    });

    it('should get piece at index', () => {
      const placement = PiecesPlacement.initial();

      // Index 0 is a8
      expect(placement.atIndex(0)).to.equal('r');
      // Index 7 is h8
      expect(placement.atIndex(7)).to.equal('r');
      // Index 56 is a1
      expect(placement.atIndex(56)).to.equal('R');
      // Index 63 is h1
      expect(placement.atIndex(63)).to.equal('R');
    });

    it('should return null for empty squares', () => {
      const placement = PiecesPlacement.initial();

      expect(placement.at('e4')).to.be.null;
      expect(placement.at('d5')).to.be.null;
      expect(placement.atIndex(27)).to.be.null; // d5
    });
  });

  describe('put()', () => {
    it('should create new placement with piece added', () => {
      const empty = PiecesPlacement.empty();
      const withKing = empty.put('e4', 'K');

      expect(withKing.at('e4')).to.equal('K');
      expect(empty.at('e4')).to.be.null; // Original unchanged
    });

    it('should create new placement with piece replaced', () => {
      const initial = PiecesPlacement.initial();
      const modified = initial.put('e2', 'Q');

      expect(modified.at('e2')).to.equal('Q');
      expect(initial.at('e2')).to.equal('P'); // Original unchanged
    });

    it('should create new placement with piece removed', () => {
      const initial = PiecesPlacement.initial();
      const modified = initial.put('e2', null);

      expect(modified.at('e2')).to.be.null;
      expect(initial.at('e2')).to.equal('P'); // Original unchanged
    });

    it('should preserve immutability', () => {
      const placement1 = PiecesPlacement.empty();
      const placement2 = placement1.put('e4', 'K');
      const placement3 = placement2.put('d4', 'Q');

      expect(placement1.at('e4')).to.be.null;
      expect(placement1.at('d4')).to.be.null;

      expect(placement2.at('e4')).to.equal('K');
      expect(placement2.at('d4')).to.be.null;

      expect(placement3.at('e4')).to.equal('K');
      expect(placement3.at('d4')).to.equal('Q');
    });
  });

  describe('toFen()', () => {
    it('should convert initial position to FEN', () => {
      const placement = PiecesPlacement.initial();
      const fen = placement.toFen();

      expect(fen).to.equal('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    });

    it('should convert empty board to FEN', () => {
      const placement = PiecesPlacement.empty();
      const fen = placement.toFen();

      expect(fen).to.equal('8/8/8/8/8/8/8/8');
    });

    it('should convert position after e4 to FEN', () => {
      const placement = PiecesPlacement.initial().put('e2', null).put('e4', 'P');
      const fen = placement.toFen();

      expect(fen).to.equal('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR');
    });

    it('should handle consecutive empty squares', () => {
      const placement = PiecesPlacement.empty().put('a1', 'K').put('h1', 'R');
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
      const placement = PiecesPlacement.initial();
      const str = placement.toString();

      expect(str).to.include('r n b q k b n r   8');
      expect(str).to.include('p p p p p p p p   7');
      expect(str).to.include('P P P P P P P P   2');
      expect(str).to.include('R N B Q K B N R   1');
      expect(str).to.include('a b c d e f g h');
    });

    it('should display empty squares as dots', () => {
      const placement = PiecesPlacement.empty();
      const str = placement.toString();

      expect(str).to.include('. . . . . . . .   8');
      expect(str).to.include('. . . . . . . .   1');
      expect(str).to.include('a b c d e f g h');
    });

    it('should display mixed pieces and empty squares', () => {
      const placement = PiecesPlacement.empty().put('e4', 'P').put('e5', 'p');
      const str = placement.toString();

      expect(str).to.include('. . . . p . . .   5');
      expect(str).to.include('. . . . P . . .   4');
    });
  });
});
