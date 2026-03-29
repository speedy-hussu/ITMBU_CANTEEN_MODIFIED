export const verifyAdmin = async (username: string, password: string) => {
  if (username === "admin" && password === "admin") {
    return {
      username,
    };
  }
  return null;
};
