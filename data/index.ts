import type { FooterColumn } from "@/types";

export const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Software Engineer",
    company: "Google",
    content: "Amazing networking experience with professionals.",
    rating: 5,
    avatar: "RS",
  },
  {
    name: "Priya Mehta",
    role: "Product Designer",
    company: "Flipkart",
    content: "The house parties on VibeCircle are next level. Met my co-founder here!",
    rating: 5,
    avatar: "PM",
  },
  {
    name: "Arjun Kapoor",
    role: "Startup Founder",
    company: "TechVentures",
    content: "Best community platform I've used. The ticket system is seamless.",
    rating: 5,
    avatar: "AK",
  },
];

export const events = [
  {
    title: "Startup Networking Night",
    date: "June 12, 2026",
    location: "Delhi",
    category: "Business",
    attendees: 120,
  },
];

export const footerColumns: FooterColumn[] = [
  {
    label: "Product",
    items: ["Events", "Communities", "Discover", "Pricing"],
  },
  {
    label: "Company",
    items: ["About", "Blog", "Careers", "Press"],
  },
  {
    label: "Support",
    items: ["Help Center", "Contact", "Privacy", "Terms"],
  },
];
