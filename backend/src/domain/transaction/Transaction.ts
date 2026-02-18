export class Transaction {
  private readonly id: string;
  private readonly amount: number;
  private readonly type: "credit" | "debit";
  private readonly timestamp: Date;

  constructor(id: string, amount: number, type: "credit" | "debit") {
    this.id = id;
    this.amount = amount;
    this.type = type;
    this.timestamp = new Date();
  }

  getId(): string {
    return this.id;
  }

  getAmount(): number {
    return this.amount;
  }

  getType(): string {
    return this.type;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }
}
