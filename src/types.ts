export type TicketStatus =
  | 'Waiting for Driver'
  | 'Accepted'
  | 'Enroute to Pickup'
  | 'Arrived at Pickup'
  | 'Boarded'
  | 'Enroute to Drop Off'
  | 'Arrived at Drop Off'
  | 'Payment Pending'
  | 'Payment Confirmed'
  | 'Completed'
  | 'Cancelled';

export interface AdminComment {
  id: string;
  adminName: string;
  message: string;
  type: 'Response Required' | 'Info Only';
  createdAt: string;
  driverReply?: string;
  repliedAt?: string;
  isClosed?: boolean;
}

export interface TicketReview {
  rating: number; // 1 to 5
  comment: string;
  submittedAt: string;
  skipped?: boolean;
  autoUnlocked?: boolean;
  adminComments?: AdminComment[];
}

export interface Ticket {
  id: string; // e.g. OLX-847291
  createdAt: string; // ISO string
  date: string; // DD/MM/YYYY
  time: string; // e.g. 4:53 PM
  pickup: string; // Inside Nyandarua
  destination: string; // Anywhere in Kenya
  pickupCoords: [number, number]; // [lat, lng]
  destCoords: [number, number]; // [lat, lng]
  routeCoords: [number, number][];
  distanceKm: number; // e.g. 47.4
  estimatedTime: string; // e.g. 1h 10m
  fare: number; // e.g. KSH 2242
  mobile: string;
  telephone?: string;
  status: TicketStatus;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
  driverVehicle?: string;
  paymentMethod?: 'M-Pesa' | 'Cash';
  completedAt?: string;
  review?: TicketReview;
  reviewTimeoutAt?: number; // timestamp ms when 5 min timer ends
  bookingUnlocked?: boolean;
}

export interface KenyaTown {
  name: string;
  county: string;
  isNyandarua: boolean;
  coords: [number, number]; // [lat, lng]
  aliases?: string[];
}
