// config/permissions.ts

export const permissions = {
  ADMIN: {
    area: ["create", "read", "update", "delete"],
    user: ["create", "read", "update", "delete"],
    pop: ["create", "read", "update", "delete"],
    odp: ["create", "read", "update", "delete"],
    ont: ["create", "read", "update", "delete"],
    paket: ["create", "read", "update", "delete"],
    fab: ["create", "read", "update", "delete"],
    baa: ["read"],
    materialList: ["read"],
  },

  LEADER: {
    area: [],
    user: [],
    pop: [],
    odp: ["create", "read", "update", "delete"],
    ont: [],
    paket: [],
    fab: [],
    pelanggan: [],
    baa: [],
    materialList: [],
  },

  SALES: {
    area: [],
    user: [],
    pop: [],
    odp: [],
    ont: [],
    paket: [],
    fab: ["create", "read", "update", "delete"],
    baa: ["create", "read", "update", "delete"],
    materialList: [],
  },

  TEKNISI: {
    area: [],
    user: [],
    pop: ["read"],
    odp: [],
    ont: ["create", "read", "update", "delete"],
    paket: [],
    fab: [],
    baa: ["create", "read", "update", "delete"],
    materialList: ["create", "read", "update", "delete"],
  },

  LOGISTIK: {
    area: ["read"],
    user: [],
    pop: [],
    odp: [],
    ont: ["create", "read", "update", "delete"],
    paket: ["create", "read", "update", "delete"],
    fab: [],
    baa: [],
    materialList: ["read"],
  },
} as const;