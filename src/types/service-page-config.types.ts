// Type definitions for service page configuration

export interface ServicePageConfig {
  serviceName: string;
  hero: {
    title: string;
    subtitle: string;
    trustBadges: string[];
  };
  seo: {
    metaDescription: string;
  };
  introContent: {
    paragraphs: string[];
  };
  emergencyBanner: {
    show: boolean;
    title?: string;
    text?: string;
    ctaText?: string;
    ctaPhone?: string;
  };
  signsList: {
    show: boolean;
    title?: string;
    items?: string[];
  };
  sectionTitle: string;
  sidebar: {
    badge: string;
    title: string;
    description: string;
    ctaPhone: string;
    ctaBook: string;
    benefits: string[];
    testimonial: {
      text: string;
      author: string;
    };
  };
  faq: {
    show: boolean;
    questions?: Array<{
      question: string;
      answer: string;
    }>;
  };
}

export interface ServicePageConfigCollection {
  [key: string]: ServicePageConfig;
  "garage-door-repair": ServicePageConfig;
  "garage-door": ServicePageConfig;
  "garage-door-opener": ServicePageConfig;
}