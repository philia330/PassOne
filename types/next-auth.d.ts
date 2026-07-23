import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id_user: number;
      kode_user: string;
      nama: string;
      username: string;
      role:
        | "ADMIN"
        | "LEADER"
        | "SALES"
        | "TEKNISI"
        | "LOGISTIK";
      foto?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id_user: number;
    kode_user: string;
    nama: string;
    username: string;
    role:
      | "ADMIN"
      | "LEADER"
      | "SALES"
      | "TEKNISI"
      | "LOGISTIK";
    foto?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id_user: number;
    kode_user: string;
    nama: string;
    username: string;
    role:
      | "ADMIN"
      | "LEADER"
      | "SALES"
      | "TEKNISI"
      | "LOGISTIK";
    foto?: string | null;
  }
}