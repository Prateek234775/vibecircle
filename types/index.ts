export interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  attendees: number;
  image: string;
  badge?: string;
  community?: string;
}

export type BadgeVariant =
  | "default"
  | "purple"
  | "warning"
  | "success";

// ─── House Party / VibeCircle domain types ────────────────────────────────────

export type EventStatus = "upcoming" | "registration_open" | "payment_open" | "closed" | "completed";

export type RegistrationStatus = "pending" | "approved" | "rejected" | "paid" | "waitlist";

export interface PartyEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address: string;
  category: string;
  maxAttendees: number;
  ticketPrice: number;
  platformFee: number;
  hostPayout: number;
  coverImage: string;
  registrationDeadline: string;
  paymentDeadline: string;
  status: EventStatus;
  createdBy: string;
  createdByName: string;
  isUserEvent: boolean;
  approved?: boolean;          // admin must approve user-posted events; auto-set by createEvent
  createdAt: string;
  attendeeCount: number;
  chatGroupId?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "booking_confirmed"
  | "party_reminder"
  | "new_booking"
  | "event_approved"
  | "event_rejected"
  | "refund_request";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  eventId?: string;
  eventTitle?: string;
  read: boolean;
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto?: string;
  status: RegistrationStatus;
  registeredAt: string;
  paidAt?: string;
  paymentId?: string;     // Razorpay payment ID
}

export interface ChatMessage {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;         // 1–5
  content: string;
  createdAt: string;
}

// ─── Q&A / Questions ──────────────────────────────────────────────────────────

export interface Question {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: string;
  answers: Answer[];
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  isHost: boolean;        // true if answered by event creator or admin
  createdAt: string;
}

export interface FooterColumn {
  label: string;
  items: string[];
}

// ─── Follow system ────────────────────────────────────────────────────────────

export interface FollowRelation {
  followerId: string;   // who is following
  followingId: string;  // who is being followed
  createdAt: string;
}

export interface UserSummary {
  uid: string;
  name: string;
  username?: string;          // unique @handle e.g. "prateek_vc"
  profession?: string;
  city?: string;
  photoURL?: string;
  followersCount: number;
  followingCount: number;
  aadhaarVerified?: boolean;  // true after Aadhaar KYC
}