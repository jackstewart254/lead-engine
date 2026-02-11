export interface Prospect {
  id: string;
  google_place_id: string | null;
  business_name: string;
  category: string;
  location: string;
  website: string | null;
  website_status: "none" | "outdated" | "active";
  owner_name: string | null;
  owner_email: string | null;
  general_email: string | null;
  owner_source: "website" | "companies_house" | "linkedin" | "manual" | null;
  phone: string | null;
  google_rating: number | null;
  email_verified: boolean;
  created_at: string;
}

export interface GooglePlacesResult {
  displayName: { text: string; languageCode: string };
  formattedAddress: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  types: string[];
  googleMapsUri: string;
  id: string;
}

export interface GooglePlacesResponse {
  places: GooglePlacesResult[];
  nextPageToken?: string;
}

export interface Campaign {
  id: string;
  name: string;
  target_category: string;
  target_location: string;
  email_template: string;
  status: "draft" | "active" | "paused" | "completed";
  created_at: string;
}

export interface EmailSent {
  id: string;
  prospect_id: string;
  campaign_id: string;
  email_content: string;
  subject: string;
  sent_at: string;
  opened: boolean;
  opened_at: string | null;
  open_count: number;
  replied: boolean;
  replied_at: string | null;
  bounced: boolean;
  clicked: boolean;
  clicked_at: string | null;
  follow_up_number: number;
}

export interface FollowUp {
  id: string;
  email_id: string;
  follow_up_number: number;
  sent_at: string;
  content: string;
}

export interface Lead {
  id: string;
  prospect_id: string;
  status: "warm" | "hot" | "converted" | "lost";
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
}
