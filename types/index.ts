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