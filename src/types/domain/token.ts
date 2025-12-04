// Domain models - internal representation with Date objects
export interface Token {
  id: string;
  userId: string;
  scopes: string[];
  token: string;
  createdAt: Date;
  expiresAt: Date;
}