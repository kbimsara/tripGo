export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number]; // [lat, lng]
  type: "destination" | "viewpoint" | "restaurant" | "hotel" | "activity";
  duration?: string; // e.g., "2 hours"
  tips?: string;
  imageQuery?: string;
  imageUrl?: string;
  rating?: number;
  address?: string;
}

export interface RouteSegment {
  from: string;
  to: string;
  distance: string;
  duration: string;
  mode: "driving" | "walking" | "cycling";
  instructions?: string[];
}

export interface Day {
  day: number;
  title: string;
  description: string;
  places: Place[];
  routes: RouteSegment[];
}

export interface Trip {
  _id: string;
  title: string;
  description: string;
  coverImage?: string;
  coverImageQuery?: string;
  owner: {
    _id: string;
    name: string;
    avatar?: string;
  };
  originalTrip?: string; // if cloned from another trip
  destinations: string[]; // high-level destination names
  days: Day[];
  totalDays: number;
  totalDistance?: string;
  budget?: "budget" | "moderate" | "luxury";
  tags: string[];
  isPublic: boolean;
  saves: number;
  savedBy: string[]; // user IDs
  chatHistory: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface TripFormData {
  destinations: string[];
  days: number;
  budget: "budget" | "moderate" | "luxury";
  interests: string[];
  startDate?: string;
  travelers?: number;
  notes?: string;
}

export interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  type: Place["type"];
  popup?: string;
  dayIndex?: number;
}
