import { type Role } from "@prisma/client";

export type { Role };

declare module "next-auth" {
  interface User {
    role: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
  }
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles?: Role[];
}
