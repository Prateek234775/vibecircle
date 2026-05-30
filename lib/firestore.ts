import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/firebase/config";
import type { PartyEvent, Registration, ChatMessage, Review, UserSummary } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

export const PLATFORM_FEE_PCT = 0.05; // 5%

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function saveUserProfile(uid: string, data: object) {
  await setDoc(
    doc(db, "users", uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function getAllUsers(): Promise<UserSummary[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserSummary));
}

// ─── Admin check ──────────────────────────────────────────────────────────────

export async function isAdmin(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists();
}

// ─── Follow System ────────────────────────────────────────────────────────────

/** Follow a user. Uses a batch to atomically update both counters. */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) throw new Error("You cannot follow yourself.");

  const relationId = `${followerId}_${followingId}`;
  const relationRef = doc(db, "follows", relationId);

  // Check already following
  const existing = await getDoc(relationRef);
  if (existing.exists()) throw new Error("Already following this user.");

  const batch = writeBatch(db);

  // Create follow relation doc
  batch.set(relationRef, {
    followerId,
    followingId,
    createdAt: serverTimestamp(),
  });

  // Increment follower's followingCount
  batch.update(doc(db, "users", followerId), {
    followingCount: increment(1),
  });

  // Increment target's followersCount
  batch.update(doc(db, "users", followingId), {
    followersCount: increment(1),
  });

  await batch.commit();
}

/** Unfollow a user. Atomically decrements both counters. */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const relationId = `${followerId}_${followingId}`;
  const relationRef = doc(db, "follows", relationId);

  const existing = await getDoc(relationRef);
  if (!existing.exists()) throw new Error("Not following this user.");

  const batch = writeBatch(db);

  batch.delete(relationRef);

  batch.update(doc(db, "users", followerId), {
    followingCount: increment(-1),
  });

  batch.update(doc(db, "users", followingId), {
    followersCount: increment(-1),
  });

  await batch.commit();
}

/** Check if followerId is following followingId */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "follows", `${followerId}_${followingId}`));
  return snap.exists();
}

/** Get list of users that uid is following */
export async function getFollowing(uid: string): Promise<string[]> {
  const q = query(collection(db, "follows"), where("followerId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().followingId as string);
}

/** Get list of users that follow uid */
export async function getFollowers(uid: string): Promise<string[]> {
  const q = query(collection(db, "follows"), where("followingId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().followerId as string);
}

// ─── Party Events ─────────────────────────────────────────────────────────────

function calcFees(ticketPrice: number) {
  const platformFee = Math.round(ticketPrice * PLATFORM_FEE_PCT);
  const hostPayout = ticketPrice - platformFee;
  return { platformFee, hostPayout };
}

export async function createEvent(
  data: Omit<PartyEvent, "id" | "createdAt" | "attendeeCount" | "platformFee" | "hostPayout">
) {
  const { platformFee, hostPayout } = calcFees(data.ticketPrice);
  const ref = await addDoc(collection(db, "events"), {
    ...data,
    platformFee,
    hostPayout,
    attendeeCount: 0,
    // admin events auto-approved; user events need approval
    approved: !data.isUserEvent,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEvent(id: string, data: Partial<PartyEvent>) {
  // Recalculate fees if price changed
  const update: Partial<PartyEvent> & Record<string, unknown> = { ...data };
  if (data.ticketPrice !== undefined) {
    const { platformFee, hostPayout } = calcFees(data.ticketPrice);
    update.platformFee = platformFee;
    update.hostPayout = hostPayout;
  }
  await updateDoc(doc(db, "events", id), { ...update, updatedAt: serverTimestamp() });
}

export async function deleteEvent(id: string) {
  await deleteDoc(doc(db, "events", id));
}

export async function getEvent(id: string): Promise<PartyEvent | null> {
  const snap = await getDoc(doc(db, "events", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as PartyEvent;
}

export async function getAllEvents(): Promise<PartyEvent[]> {
  const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PartyEvent));
}

/** Events created by a specific user */
export async function getUserEvents(uid: string): Promise<PartyEvent[]> {
  const q = query(
    collection(db, "events"),
    where("createdBy", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PartyEvent));
}

// ─── Registrations ────────────────────────────────────────────────────────────

export async function registerForEvent(
  eventId: string,
  userId: string,
  userName: string,
  userEmail: string,
  userPhoto?: string
): Promise<string> {
  const existing = await getRegistration(eventId, userId);
  if (existing) throw new Error("Already registered for this event.");

  const ref = await addDoc(collection(db, "registrations"), {
    eventId,
    userId,
    userName,
    userEmail,
    userPhoto: userPhoto || "",
    status: "pending",
    registeredAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "events", eventId), {
    attendeeCount: increment(1),
  });

  return ref.id;
}

export async function getRegistration(
  eventId: string,
  userId: string
): Promise<Registration | null> {
  const q = query(
    collection(db, "registrations"),
    where("eventId", "==", eventId),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Registration;
}

export async function getEventRegistrations(eventId: string): Promise<Registration[]> {
  const q = query(
    collection(db, "registrations"),
    where("eventId", "==", eventId),
    orderBy("registeredAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Registration));
}

export async function getUserRegistrations(userId: string): Promise<Registration[]> {
  const q = query(
    collection(db, "registrations"),
    where("userId", "==", userId),
    orderBy("registeredAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Registration));
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: Registration["status"],
  extra?: Record<string, unknown>
) {
  await updateDoc(doc(db, "registrations", registrationId), {
    status,
    ...extra,
    updatedAt: serverTimestamp(),
  });
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export async function sendChatMessage(
  eventId: string,
  userId: string,
  userName: string,
  text: string,
  userPhoto?: string
) {
  await addDoc(collection(db, "chats", eventId, "messages"), {
    eventId,
    userId,
    userName,
    userPhoto: userPhoto || "",
    text,
    createdAt: serverTimestamp(),
  });
}

export async function getChatMessages(eventId: string): Promise<ChatMessage[]> {
  const q = query(
    collection(db, "chats", eventId, "messages"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt ?? new Date().toISOString(),
    } as ChatMessage;
  });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function submitReview(
  eventId: string,
  eventTitle: string,
  userId: string,
  userName: string,
  rating: number,
  content: string,
  userPhoto?: string
) {
  const existing = await getUserReviewForEvent(eventId, userId);
  if (existing) throw new Error("You have already reviewed this event.");

  await addDoc(collection(db, "reviews"), {
    eventId,
    eventTitle,
    userId,
    userName,
    userPhoto: userPhoto || "",
    rating,
    content,
    createdAt: serverTimestamp(),
  });
}

export async function getEventReviews(eventId: string): Promise<Review[]> {
  const q = query(
    collection(db, "reviews"),
    where("eventId", "==", eventId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt ?? new Date().toISOString(),
    } as Review;
  });
}

export async function getUserReviewForEvent(
  eventId: string,
  userId: string
): Promise<Review | null> {
  const q = query(
    collection(db, "reviews"),
    where("eventId", "==", eventId),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Review;
}

// ─── Q&A ──────────────────────────────────────────────────────────────────────

export async function postQuestion(
  eventId: string,
  userId: string,
  userName: string,
  text: string,
  userPhoto?: string
): Promise<string> {
  const ref = await addDoc(collection(db, "questions"), {
    eventId,
    userId,
    userName,
    userPhoto: userPhoto || "",
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getEventQuestions(eventId: string) {
  const q = query(
    collection(db, "questions"),
    where("eventId", "==", eventId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  const questions = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data();
      // fetch answers subcollection
      const answersSnap = await getDocs(
        query(collection(db, "questions", d.id, "answers"), orderBy("createdAt", "asc"))
      );
      const answers = answersSnap.docs.map((a) => {
        const ad = a.data();
        return {
          id: a.id,
          questionId: d.id,
          userId: ad.userId,
          userName: ad.userName,
          userPhoto: ad.userPhoto ?? "",
          text: ad.text,
          isHost: ad.isHost ?? false,
          createdAt:
            ad.createdAt instanceof Timestamp
              ? ad.createdAt.toDate().toISOString()
              : ad.createdAt ?? new Date().toISOString(),
        };
      });
      return {
        id: d.id,
        eventId,
        userId: data.userId,
        userName: data.userName,
        userPhoto: data.userPhoto ?? "",
        text: data.text,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt ?? new Date().toISOString(),
        answers,
      };
    })
  );
  return questions;
}

export async function postAnswer(
  questionId: string,
  userId: string,
  userName: string,
  text: string,
  isHost: boolean,
  userPhoto?: string
): Promise<void> {
  await addDoc(collection(db, "questions", questionId, "answers"), {
    questionId,
    userId,
    userName,
    userPhoto: userPhoto || "",
    text: text.trim(),
    isHost,
    createdAt: serverTimestamp(),
  });
}

// ─── All Reviews (for home page) ──────────────────────────────────────────────

export async function getAllReviews(limitCount = 20): Promise<Review[]> {
  const q = query(
    collection(db, "reviews"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.slice(0, limitCount).map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt ?? new Date().toISOString(),
    } as Review;
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

import type { Notification, NotificationType } from "@/types";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  eventId?: string,
  eventTitle?: string
): Promise<void> {
  await addDoc(collection(db, "notifications"), {
    userId,
    type,
    title,
    message,
    eventId: eventId ?? "",
    eventTitle: eventTitle ?? "",
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt ?? new Date().toISOString(),
    } as Notification;
  });
}

export async function markNotificationRead(notifId: string): Promise<void> {
  await updateDoc(doc(db, "notifications", notifId), { read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

// ─── Pending user events (admin approval) ────────────────────────────────────

export async function getPendingUserEvents(): Promise<PartyEvent[]> {
  const q = query(
    collection(db, "events"),
    where("isUserEvent", "==", true),
    where("approved", "==", false),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PartyEvent));
}

export async function approveEvent(eventId: string, hostUid: string, eventTitle: string): Promise<void> {
  await updateDoc(doc(db, "events", eventId), { approved: true });
  await createNotification(
    hostUid,
    "event_approved",
    "Event Approved! 🎉",
    `Your event "${eventTitle}" has been approved and is now live.`,
    eventId,
    eventTitle
  );
}

export async function rejectEvent(eventId: string, hostUid: string, eventTitle: string): Promise<void> {
  await updateDoc(doc(db, "events", eventId), { status: "closed", approved: false });
  await createNotification(
    hostUid,
    "event_rejected",
    "Event Not Approved",
    `Your event "${eventTitle}" was not approved. Please review our guidelines.`,
    eventId,
    eventTitle
  );
}

// ─── Refund requests ──────────────────────────────────────────────────────────

export interface RefundRequest {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  registrationId: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export async function submitRefundRequest(
  data: Omit<RefundRequest, "id" | "createdAt" | "status">
): Promise<void> {
  await addDoc(collection(db, "refundRequests"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getRefundRequests(): Promise<RefundRequest[]> {
  const q = query(collection(db, "refundRequests"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt ?? new Date().toISOString(),
    } as RefundRequest;
  });
}

export async function updateRefundStatus(
  refundId: string,
  status: "approved" | "rejected"
): Promise<void> {
  await updateDoc(doc(db, "refundRequests", refundId), { status });
}
