import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/firebase/config";

export async function saveUserProfile(
  uid: string,
  data: any
) {
  await setDoc(
    doc(db, "users", uid),
    data,
    { merge: true }
  );
}

export async function getUserProfile(
  uid: string
) {
  const docRef = doc(db, "users", uid);

  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }

  return null;
}