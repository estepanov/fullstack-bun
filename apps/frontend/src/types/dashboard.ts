export type UpdateCallback = () => Promise<void>;

export type SessionRecord = {
  id: string;
  userId: string;
  expiresAt: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  impersonatedBy?: string | null;
};

export type AccountRecord = {
  id: string;
  providerId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  accountId: string;
  userId: string;
  scopes: string[];
};

export type PasskeyRecord = {
  id: string;
  name?: string | null;
  publicKey: string;
  userId: string;
  credentialID: string;
  counter: number;
  deviceType: string;
  backedUp: boolean;
  transports?: string | null;
  createdAt?: string | Date | null;
  aaguid?: string | null;
};
