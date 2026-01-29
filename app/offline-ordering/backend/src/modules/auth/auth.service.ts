// src/modules/auth/auth.service.ts
import type { StaffLoginRequest } from "@shared/types/user.types";

export const validateStaffCredentials = (credentials: StaffLoginRequest) => {
  const { role, username, password } = credentials;

  let expectedUser, expectedPass;

  if (role === "POS") {
    expectedUser = process.env.POS_USERNAME;
    expectedPass = process.env.POS_PASSWORD;
  } else if (role === "KDS") {
    expectedUser = process.env.KDS_USERNAME;
    expectedPass = process.env.KDS_PASSWORD;
  }

  return username === expectedUser && password === expectedPass;
};
