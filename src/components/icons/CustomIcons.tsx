import * as React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Globe,
  User,
  Briefcase,
  Type,
  Sparkles,
  Users,
  GraduationCap,
  Languages,
  Award,
  Trophy,
  HeartHandshake,
  Heart,
  FolderGit2,
} from "lucide-react";
import type { CustomFieldIconName, SectionKey } from "@/types/resume";

export const WhatsAppIcon = ({ size = 16 }: { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12.001 2C17.5238 2 22.001 6.47715 22.001 12C22.001 17.5228 17.5238 22 12.001 22C10.1671 22 8.44851 21.5064 6.97086 20.6447L2.00516 22L3.35712 17.0315C2.49494 15.5536 2.00098 13.8345 2.00098 12C2.00098 6.47715 6.47813 2 12.001 2Z" />
  </svg>
);

export const LinkedInIcon = ({ size = 16 }: { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    strokeWidth={2}
    stroke="currentColor"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24Zm0,192H40V40H216V216ZM96,112v64a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm88,28v36a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140ZM100,84A12,12,0,1,1,88,72,12,12,0,0,1,100,84Z" />
  </svg>
);

export const GithubIcon = ({ size = 16 }: { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const BehanceIcon = ({ size = 16 }: { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M7.5 11C8.60457 11 9.5 10.1046 9.5 9C9.5 7.89543 8.60457 7 7.5 7H3V11H7.5ZM8.5 13H3V17H8.5C9.60457 17 10.5 16.1046 10.5 15C10.5 13.8954 9.60457 13 8.5 13Z" />
  </svg>
);

export const DribbbleIcon = ({ size = 16 }: { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />
    <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />
    <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72" />
  </svg>
);

export const FacebookIcon = ({ size = 16 }: { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const XTwitterIcon = ({ size = 16 }: { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M10.4883 14.651L15.25 21H22.25L14.3917 10.5223L20.9308 3H18.2808L13.1643 8.88578L8.75 3H1.75L9.26086 13.0145L2.31915 21H4.96917L10.4883 14.651Z" />
  </svg>
);

export const YouTubeIcon = ({ size = 16 }: { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

export const CUSTOM_FIELD_ICONS: Record<
  CustomFieldIconName,
  React.ComponentType<{ size?: number | string }>
> = {
  email: Mail,
  phone: Phone,
  whatsapp: WhatsAppIcon,
  location: MapPin,
  link: LinkIcon,
  website: Globe,
  user: User,
  briefcase: Briefcase,
  linkedin: LinkedInIcon,
  github: GithubIcon,
  behance: BehanceIcon,
  dribbble: DribbbleIcon,
  facebook: FacebookIcon,
  x: XTwitterIcon,
  youtube: YouTubeIcon,
};

export const CUSTOM_FIELD_ICON_NAMES: CustomFieldIconName[] = [
  "email",
  "phone",
  "whatsapp",
  "location",
  "link",
  "website",
  "user",
  "briefcase",
  "linkedin",
  "github",
  "behance",
  "dribbble",
  "facebook",
  "x",
  "youtube",
];

export function CustomFieldIcon({
  iconName,
  name,
  size = 14,
  className,
}: {
  iconName?: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const resolved = iconName || name;
  if (!resolved) return null;
  const key = resolved.toLowerCase() as CustomFieldIconName;
  const IconComp = CUSTOM_FIELD_ICONS[key] || LinkIcon;
  return (
    <span className={className}>
      <IconComp size={size} />
    </span>
  );
}

export function SectionIcon({
  section,
  className = "size-4",
}: {
  section: SectionKey | "basics";
  className?: string;
}) {
  switch (section) {
    case "basics":
      return <User className={className} />;
    case "summary":
      return <Type className={className} />;
    case "experience":
      return <Briefcase className={className} />;
    case "projects":
      return <FolderGit2 className={className} />;
    case "skills":
      return <Sparkles className={className} />;
    case "softSkills":
      return <Users className={className} />;
    case "education":
      return <GraduationCap className={className} />;
    case "languages":
      return <Languages className={className} />;
    case "certifications":
      return <Award className={className} />;
    case "awards":
      return <Trophy className={className} />;
    case "volunteering":
      return <HeartHandshake className={className} />;
    case "interests":
      return <Heart className={className} />;
    default:
      return <Briefcase className={className} />;
  }
}
