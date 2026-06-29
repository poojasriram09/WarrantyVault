import {
  auth,
  googleProvider,
  isNativePlatform,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
} from "../config/firebase";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

export const authService = {
  async loginWithGoogle() {
    if (isNativePlatform) {
      // Native Google sign-in via Capacitor plugin → Firebase credential
      const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
      await GoogleAuth.initialize({
        clientId: "314056451501-h8q6p0dbbkek6ijpfucpt93hi99i72qc.apps.googleusercontent.com",
        scopes: ["profile", "email"],
        grantOfflineAccess: true,
      });
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      const credential = GoogleAuthProvider.credential(idToken);
      return signInWithCredential(auth, credential);
    }
    return signInWithPopup(auth, googleProvider);
  },

  async loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },

  async signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    return result;
  },

  async logout() {
    return signOut(auth);
  },

  async resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  },
};
