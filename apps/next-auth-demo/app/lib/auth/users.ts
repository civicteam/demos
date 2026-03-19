export interface User {
  id: string;
  email: string;
  name?: string;
  email_verified?: boolean;
  picture?: string;
}

interface StoredUser extends User {
  password: string;
}

function stripPassword({ password: _, ...user }: StoredUser): User {
  return user;
}

// In-memory user store with plain passwords (demo only - not for production)
const users = new Map<string, StoredUser>([
  [
    "demo@example.com",
    {
      id: "user-1",
      email: "demo@example.com",
      name: "Demo User",
      password: "demo123",
    },
  ],
  [
    "user2@example.com",
    {
      id: "user-2",
      email: "user2@example.com",
      name: "Second User",
      password: "demo123",
    },
  ],
  [
    "minimal@example.com",
    {
      id: "user-3",
      email: "minimal@example.com",
      password: "demo123",
    },
  ],
  [
    "maximal@example.com",
    {
      id: "user-4",
      email: "maximal@example.com",
      name: "Maximal User",
      email_verified: true,
      picture: "https://i.pravatar.cc/150?u=maximal@example.com",
      password: "demo123",
    },
  ],
]);

export function findUserByCredentials(email: string, password: string): User | null {
  const user = users.get(email.toLowerCase());
  if (!user) return null;
  if (user.password !== password) return null;

  // Return user without password
  return stripPassword(user);
}

export function getUserById(id: string): User | null {
  for (const user of users.values()) {
    if (user.id === id) {
      return stripPassword(user);
    }
  }
  return null;
}

export function createUser(email: string, password: string, name: string): User {
  const id = `user-${Date.now()}`;
  const user: StoredUser = {
    id,
    email: email.toLowerCase(),
    name,
    password,
  };
  users.set(user.email, user);
  return stripPassword(user);
}
