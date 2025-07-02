// types/database.ts
// TypeScript interfaces matching your Supabase database schema

export interface Template {
  template_id: number;
  name: string;
  image_url: string;
  thumbnail_url: string;
  usage_count: number;
  category_id?: number | null;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface TextZone {
  zone_id: number;
  template_id: number;
  zone_name: string;
  x_position: string; // percentage like "60%"
  y_position: string; // percentage like "25%"
  width: string;      // percentage like "35%"
  height: string;     // percentage like "20%"
  font_size: string;  // like "24px"
  text_color: string; // hex color like "#FFFFFF"
  text_align?: 'left' | 'center' | 'right';
  max_characters?: number;
  font_family?: string;
}

export interface Category {
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  color_hex?: string;
  sort_order?: number;
}

export interface AnalyticsEvent {
  event_id: number;
  template_id: number;
  event_type: 'view' | 'generate' | 'download' | 'copy';
  timestamp: string;
  user_ip_hash?: string;
}

// Combined types for working with templates and their zones
export interface TemplateWithZones extends Template {
  text_zones: TextZone[];
}

export interface TemplateWithCategory extends Template {
  category: Category | null;
}

// Types for meme generation
export interface MemeText {
  [zoneName: string]: string;
}

export interface MemeConfig {
  template: Template;
  textZones: TextZone[];
  textValues: MemeText;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  totalPages: number;
}

// Supabase specific types
export interface Database {
  public: {
    Tables: {
      templates: {
        Row: Template;
        Insert: Omit<Template, 'template_id' | 'created_at' | 'usage_count'>;
        Update: Partial<Omit<Template, 'template_id' | 'created_at'>>;
      };
      text_zones: {
        Row: TextZone;
        Insert: Omit<TextZone, 'zone_id'>;
        Update: Partial<Omit<TextZone, 'zone_id'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'category_id'>;
        Update: Partial<Omit<Category, 'category_id'>>;
      };
      analytics: {
        Row: AnalyticsEvent;
        Insert: Omit<AnalyticsEvent, 'event_id' | 'timestamp'>;
        Update: Partial<Omit<AnalyticsEvent, 'event_id'>>;
      };
    };
  };
}

// Hook return types
export interface UseTemplatesReturn {
  templates: Template[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

export interface UseTextZonesReturn {
  textZones: TextZone[];
  loading: boolean;
  error: string | null;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
}

// Search and filter types
export interface TemplateFilters {
  categoryId?: number | null;
  searchTerm?: string;
  sortBy?: 'name' | 'usage_count' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult<T> {
  results: T[];
  total: number;
  query: string;
  filters: TemplateFilters;
}