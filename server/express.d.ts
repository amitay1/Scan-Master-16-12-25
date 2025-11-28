// Augment Express' Request type with our auth-related properties.
// This file is picked up by tsconfig.node.json (see "include").

declare namespace Express {
  // Properties injected by the mockAuth / real auth middleware
  export interface Request {
    userId?: string;
    orgId?: string | null;
  }
}
