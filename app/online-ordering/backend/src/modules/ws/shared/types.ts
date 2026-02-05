export type ClientRole = "USER" | "LOCAL_BRIDGE";

export type ClientMeta = {
  id: string;
  role: ClientRole;
};
