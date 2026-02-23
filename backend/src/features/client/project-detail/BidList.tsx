import { Bid } from '@/types/project.types';
import { useAcceptBid } from './useAcceptBid';
import { useRejectBid } from './useRejectBid';

type Props = {
  bids: Bid[];
};

export function BidList({ bids }: Props) {
  const { mutate: acceptBid } = useAcceptBid();
  const { mutate: rejectBid } = useRejectBid();

  return (
    <div>
      {bids.map((bid) => (
        <div key={bid.id}>
          <h4>{bid.freelancer.name}</h4>
          <p>${bid.proposed_rate}</p>
          <p>{bid.cover_letter.slice(0, 100)}...</p>
          <button onClick={() => acceptBid(bid.id)}>Accept</button>
          <button onClick={() => rejectBid(bid.id)}>Reject</button>
        </div>
      ))}
    </div>
  );
}
