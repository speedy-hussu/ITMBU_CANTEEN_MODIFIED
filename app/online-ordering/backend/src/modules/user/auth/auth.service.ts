// online/backend/src/services/auth.service.ts

import { User } from "../../../database/models/user.model";


export const verifyUser = async (enrollmentId: string, password: string) => {
  // 1. Normalize the Input
  const inputID = enrollmentId.trim().toLowerCase();
  const inputPass = password.trim();

  console.log(`🔍 Attempting login for: |${inputID}|`);

  try {
    // 2. Find the user in Atlas
    const user = await User.findOne({ enrollmentId: inputID });

    if (!user) {
      console.log("❌ User not found in database");
      return null;
    }

    // 3. Password Comparison
    // Currently using direct comparison for your dummy data (pass1, pass2)
    const isMatch = user.password === inputPass;

    /** * NOTE: When you start using hashed passwords, use this instead:
     * const isMatch = await bcrypt.compare(inputPass, user.password);
     */

    if (!isMatch) {
      console.log(`❌ Password mismatch for ${inputID}`);
      return null;
    }

    console.log(`✅ User verified: ${user.enrollmentId}`);
    return user;
  } catch (error) {
    console.error("database Error during verification:", error);
    throw error;
  }
};
