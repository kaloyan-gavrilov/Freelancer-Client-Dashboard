import { Bid } from '../Bid';
import { UnauthorizedBidException } from '../../exceptions/UnauthorizedBidException';

describe('Bid (domain entity)', () => {
  let bid: Bid;

  beforeEach(() => {
    bid = new Bid('bid-1', 'freelancer-1', 'project-1', 75.5);
  });

  // ── Initial state ────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with pending status', () => {
      expect(bid.getStatus()).toBe('pending');
    });
  });

  // ── accept() ─────────────────────────────────────────────────────────

  describe('accept()', () => {
    it('transitions from pending to accepted', () => {
      bid.accept();
      expect(bid.getStatus()).toBe('accepted');
    });

    it('throws UnauthorizedBidException if already accepted', () => {
      bid.accept();
      expect(() => bid.accept()).toThrow(UnauthorizedBidException);
    });

    it('throws UnauthorizedBidException if already rejected', () => {
      bid.reject();
      expect(() => bid.accept()).toThrow(UnauthorizedBidException);
    });
  });

  // ── reject() ─────────────────────────────────────────────────────────

  describe('reject()', () => {
    it('transitions from pending to rejected', () => {
      bid.reject();
      expect(bid.getStatus()).toBe('rejected');
    });

    it('throws UnauthorizedBidException if already rejected', () => {
      bid.reject();
      expect(() => bid.reject()).toThrow(UnauthorizedBidException);
    });

    it('throws UnauthorizedBidException if already accepted', () => {
      bid.accept();
      expect(() => bid.reject()).toThrow(UnauthorizedBidException);
    });
  });
});
