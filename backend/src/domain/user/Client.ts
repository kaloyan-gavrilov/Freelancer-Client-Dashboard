import { User } from "./User";

export class Client extends User {
  constructor(id: string, email: string) {
    super(id, email, "client");
  }
}
