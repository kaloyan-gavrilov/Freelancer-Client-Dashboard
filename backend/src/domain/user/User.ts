export abstract class User {
  protected readonly id: string;
  protected readonly email: string;
  protected role: string;

  constructor(id: string, email: string, role: string) {
    this.id = id;
    this.email = email;
    this.role = role;
  }

  getId(): string {
    return this.id;
  }

  getEmail(): string {
    return this.email;
  }

  getRole(): string {
    return this.role;
  }
}
