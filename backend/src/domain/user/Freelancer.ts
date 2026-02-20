import { User } from "./User";

export class Freelancer extends User {
  private readonly skills: string[];
  private hourlyRate: number;

  constructor(id: string, email: string, skills: string[], hourlyRate: number) {
    super(id, email, "freelancer");
    this.skills = skills;
    this.hourlyRate = hourlyRate;
  }

  getSkills(): string[] {
    return this.skills;
  }

  getHourlyRate(): number {
    return this.hourlyRate;
  }

  setHourlyRate(rate: number): void {
    this.hourlyRate = rate;
  }
}
