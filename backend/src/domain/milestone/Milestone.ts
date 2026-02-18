export class Milestone {
  private readonly id: string;
  private readonly order: number;
  private status: "pending" | "in_progress" | "completed";
  private deliverables: string[];

  constructor(id: string, order: number, deliverables: string[]) {
    this.id = id;
    this.order = order;
    this.status = "pending";
    this.deliverables = deliverables;
  }

  getOrder(): number {
    return this.order;
  }

  getStatus(): string {
    return this.status;
  }

  start(): void {
    if (this.status === "pending") {
      this.status = "in_progress";
    }
  }

  complete(): void {
    if (this.status === "in_progress") {
      this.status = "completed";
    }
  }
}
