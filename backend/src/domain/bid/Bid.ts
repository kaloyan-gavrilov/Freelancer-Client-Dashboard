import { UnauthorizedBidException } from "../exceptions/UnauthorizedBidException";

export class Bid {
  private readonly id: string;
  private readonly freelancerId: string;
  private readonly projectId: string;

  private status: "pending" | "accepted" | "rejected";
  private proposedRate: number;

  constructor(id: string, freelancerId: string, projectId: string, proposedRate: number) {
    this.id = id;
    this.freelancerId = freelancerId;
    this.projectId = projectId;
    this.status = "pending";
    this.proposedRate = proposedRate;
  }

  getStatus(): string {
    return this.status;
  }

  accept(): void {
    if (this.status !== "pending") {
      throw new UnauthorizedBidException();
    }
    this.status = "accepted";
  }

  reject(): void {
    if (this.status !== "pending") {
      throw new UnauthorizedBidException();
    }
    this.status = "rejected";
  }
}
