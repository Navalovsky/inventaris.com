import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "KARYAWAN" | "ADMIN";
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role: "KARYAWAN" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "KARYAWAN" | "ADMIN";
  }
}
