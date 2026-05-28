import { db } from "@/firebase/config";
import { doc, setDoc } from "firebase/firestore";

export async function saveUserProfile(uid: string, data: any) {
  console.log("Saving started");

  await setDoc(doc(db, "users", uid), data);

  console.log("Saved successfully");
}