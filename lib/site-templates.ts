// The 120 website templates (uiuxlabz collection) and the 18 business categories they are grouped into.
// The categories ARE the business types people pick when they sign up, so a business only ever sees templates for its own type.
// Each template is a finished multi-page site. Its live demo is served by GitHub Pages; the card image is a JPEG kept in /public/templates.

export type TemplateCategory = { label: string; hint: string };
export type SiteTemplate = { id: string; slug: string; brand: string; tagline: string; category: string; pages: number; thumb: string };

export const TEMPLATE_CATEGORIES: readonly TemplateCategory[] = [
  { label: "E-Commerce & Retail", hint: "Online storefronts, marketplaces and product catalogs" },
  { label: "Food & Restaurant", hint: "Restaurants, bakeries, cafés and culinary brands" },
  { label: "Health & Medical", hint: "Clinics, dental practices and healthcare providers" },
  { label: "Beauty & Wellness", hint: "Salons, spas, barbershops and wellness brands" },
  { label: "Home Services & Trades", hint: "Repair, maintenance and trade service businesses" },
  { label: "Real Estate & Construction", hint: "Property, architecture and building companies" },
  { label: "Business & Agency", hint: "Agencies, consultancies and professional services" },
  { label: "Tech & SaaS", hint: "Startups, SaaS products, admin dashboards and apps" },
  { label: "Portfolio & Personal", hint: "Personal, developer, photographer and creative portfolios" },
  { label: "Travel & Hospitality", hint: "Hotels, resorts, tourism and travel experiences" },
  { label: "Education & Learning", hint: "Schools, courses, e-learning and training" },
  { label: "Fitness & Sports", hint: "Gyms, fitness studios and wellness coaching" },
  { label: "Media & News", hint: "News portals, magazines and editorial publications" },
  { label: "Finance & Legal", hint: "Financial services, insurance and law firms" },
  { label: "Logistics & Delivery", hint: "Courier, transport and delivery services" },
  { label: "Events & Lifestyle", hint: "Weddings, lifestyle and celebration websites" },
  { label: "Automotive", hint: "Car services, rentals and dealerships" },
  { label: "Landing Pages", hint: "High-converting single-page landing templates" },
];

/** Where the live demos are served from: <base>/<slug>/. Change it if the templates move to another host. */
export const TEMPLATE_DEMO_BASE = process.env.NEXT_PUBLIC_TEMPLATE_DEMO_BASE ?? "https://uiuxlabz.github.io";

const T = (category: string, id: string, slug: string, brand: string, tagline: string, pages: number, thumb = `/templates/${slug}.jpg`): SiteTemplate => ({ id, slug, brand, tagline, category, pages, thumb });

export const SITE_TEMPLATES: readonly SiteTemplate[] = [
  T("E-Commerce & Retail", "product-showcase", "product-showcase-html-template", "Craftly", "Digital Product Showcase & SaaS Landing Page", 2),
  T("E-Commerce & Retail", "electronics-store", "electronics-store-html-template", "ELECTRO", "Premium Tech & Electronics Store", 4),
  T("E-Commerce & Retail", "e-commerce-shop", "e-commerce-shop-html-template", "ESHOP", "Premium E-Commerce Store", 4),
  T("E-Commerce & Retail", "online-store", "online-store-html-template", "ESHOPPER", "Online Marketplace", 4),
  T("E-Commerce & Retail", "digital-store", "digital-store-html-template", "ESTORE", "Digital Store", 4),
  T("E-Commerce & Retail", "multi-store", "multi-store-html-template", "Mercato", "The Curated Fashion Marketplace", 6),
  T("E-Commerce & Retail", "multi-vendor-store", "multi-vendor-store-html-template", "VENDORHIVE", "Multi-Vendor Marketplace", 4, "https://uiuxlabz.github.io/multi-vendor-store-html-template/screenshot.png"),
  T("Food & Restaurant", "bakery", "bakery-html-template", "Brioche & Co.", "Artisan Bakery & Pastry Shop", 6),
  T("Food & Restaurant", "coffee-shop", "coffee-shop-html-template", "Café Alto", "Artisan Coffee House", 6),
  T("Food & Restaurant", "cafe-bakery", "cafe-bakery-html-template", "CRUMB & CO.", "Artisan Bakery & Cafe", 5),
  T("Food & Restaurant", "fruitables", "fruitables-html-template", "FARMFRESH", "Farm to Table, Fresh Daily", 4),
  T("Food & Restaurant", "organic-farm", "organic-farm-html-template", "FarmFresh", "Organic Farm & Produce, Grown With Heart", 10),
  T("Food & Restaurant", "ice-cream-shop", "ice-cream-shop-html-template", "iCREAM", "Artisanal Ice Cream & Dessert Shop", 6),
  T("Food & Restaurant", "dairy", "dairy-html-template", "Meadowgold Creamery", "Fresh Grass-Fed Dairy, From Our Pasture to Your Table", 8),
  T("Food & Restaurant", "restaurant", "restaurant-html-template", "OLIVO", "Seasonal Kitchen & Wine Bar", 4),
  T("Food & Restaurant", "restaurant-bistro", "restaurant-bistro-html-template", "RESTORAN", "Where Every Meal Tells a Story", 4),
  T("Food & Restaurant", "cake-shop", "cake-shop-html-template", "SUCRÉ", "The Best Cake in Town", 5),
  T("Food & Restaurant", "italian-restaurant", "italian-restaurant-html-template", "Trattoria Bella", "Authentic Italian Restaurant", 4),
  T("Health & Medical", "dental-practice", "dental-practice-html-template", "APEX DENTAL", "Modern Dentistry for Healthy Smiles", 5),
  T("Health & Medical", "medical-clinic", "medical-clinic-html-template", "CURA Health", "Compassionate Care, Close to Home", 6),
  T("Health & Medical", "dental-clinic", "dental-clinic-html-template", "DENTCARE", "Care that makes you smile", 4),
  T("Health & Medical", "plastic-surgery", "plastic-surgery-html-template", "Plasery", "Modern Plastic Surgery & Aesthetic Clinic", 7),
  T("Health & Medical", "weight-loss", "weight-loss-html-template", "SlimShift", "Science-Backed Weight Loss & Healthy Lifestyle Program", 1),
  T("Health & Medical", "physical-therapy", "physical-therapy-html-template", "Terapia", "Physical Therapy & Rehabilitation Clinic", 10),
  T("Beauty & Wellness", "beauty-salon", "beauty-salon-html-template", "LUMIÈRE", "Beauty Salon", 5),
  T("Beauty & Wellness", "barber-shop", "barber-shop-html-template", "Razor & Tonic", "Classic Men's Barbershop", 7),
  T("Beauty & Wellness", "salon-beauty", "salon-beauty-html-template", "SALONE", "Where Beauty Meets Artistry", 4),
  T("Beauty & Wellness", "spa-wellness", "spa-wellness-html-template", "SERENITY SPA", "Luxury Wellness & Spa Retreat", 5),
  T("Beauty & Wellness", "hair-salon", "hair-salon-html-template", "STUDIO77", "Premium Hair Salon", 4),
  T("Home Services & Trades", "auto-service", "auto-service-html-template", "CAR SERV", "Fast, Honest Auto Repair", 4),
  T("Home Services & Trades", "car-electronics-repair", "car-electronics-repair-html-template", "CEPAIR", "Car Audio, Diagnostics & Smart Upgrades", 4),
  T("Home Services & Trades", "hvac-services", "hvac-services-html-template", "CLIMATECONTROL", "HVAC Services", 4),
  T("Home Services & Trades", "carpenter", "carpenter-html-template", "Craft & Grain", "Bespoke Carpentry & Custom Furniture Workshop", 8),
  T("Home Services & Trades", "dry-cleaning", "dry-cleaning-html-template", "DRYME", "Premium Dry Cleaning & Laundry Service", 4),
  T("Home Services & Trades", "electrical-services", "electrical-services-html-template", "Electra", "Premium Electrical Contractor Services", 4),
  T("Home Services & Trades", "home-repair", "home-repair-html-template", "FixHaven", "Home Repair & Renovation Services", 8),
  T("Home Services & Trades", "welding-services", "welding-services-html-template", "IRONARC", "Welding & Metal Fabrication", 5),
  T("Home Services & Trades", "security", "security-html-template", "IronWatch Security", "Manned Guarding & Security Services", 7),
  T("Home Services & Trades", "pest-control", "pest-control-html-template", "PestKit", "Professional Pest Control & Extermination Services", 9),
  T("Home Services & Trades", "plumbing", "plumbing-html-template", "PipeCraft", "Plumbing, Heating & Cooling", 8),
  T("Home Services & Trades", "cleaning", "cleaning-html-template", "PureLine", "Professional Home & Office Cleaning Services", 7),
  T("Home Services & Trades", "painting", "painting-html-template", "TrueColor", "Premium Painting & Decorating Studio", 8),
  T("Home Services & Trades", "cctv", "cctv-html-template", "Vigilant", "Professional CCTV Installation & Security Monitoring", 8),
  T("Home Services & Trades", "ac-repair", "ac-repair-html-template", "ZEPHYR", "Cool Air, Calmly Delivered · AC & Climate Service", 4),
  T("Real Estate & Construction", "construction-portfolio", "construction-portfolio-html-template", "CONSTRA", "Construction Portfolio", 4),
  T("Real Estate & Construction", "construction-company", "construction-company-html-template", "FORGE", "We Build What Matters", 5),
  T("Real Estate & Construction", "interior-design", "interior-design-html-template", "iDESIGN", "Interior Design & Decoration Studio", 8),
  T("Real Estate & Construction", "industrial-portfolio", "industrial-portfolio-html-template", "INDUSTRO", "Precision Engineering, Global Reach", 5),
  T("Real Estate & Construction", "industrial-services", "industrial-services-html-template", "Ironbound Industrial", "Engineering & Fabrication", 10),
  T("Real Estate & Construction", "real-estate", "real-estate-html-template", "MAKAAN", "Find Your Dream Home", 4),
  T("Real Estate & Construction", "architecture-studio", "architecture-studio-html-template", "VOSSEN", "Architecture & Interior Design Studio", 5),
  T("Business & Agency", "consulting", "consulting-html-template", "CONSULT", "Strategy that ships", 4),
  T("Business & Agency", "digital-agency", "digital-agency-html-template", "DGcom", "Digital Agency & Web Design Studio", 4),
  T("Business & Agency", "grow-mark", "grow-mark-html-template", "GrowthPulse", "Digital Marketing That Compounds", 8),
  T("Business & Agency", "business", "business-html-template", "Northbridge", "Strategic Business Consulting", 6),
  T("Business & Agency", "creative-agency", "creative-agency-html-template", "PIGRA", "Creative Agency", 1),
  T("Business & Agency", "design-studio", "design-studio-html-template", "PLASERY", "Design That Shapes Perception", 6),
  T("Business & Agency", "branding-agency", "branding-agency-html-template", "POSEIFY", "Brands That Move People", 2),
  T("Business & Agency", "seo-consulting", "seo-consulting-html-template", "SEOCOM", "SEO Consulting", 4),
  T("Business & Agency", "seo-mastery", "seo-mastery-html-template", "SEOMASTER", "Dominate Search. Command Traffic.", 4),
  T("Business & Agency", "marketing-agency", "marketing-agency-html-template", "Vox Digital", "Full-Service Digital Marketing Agency", 7),
  T("Tech & SaaS", "admin-panel", "admin-panel-html-template", "CloudBase", "Admin Panel & SaaS Dashboard", 6),
  T("Tech & SaaS", "documentation", "documentation-html-template", "DocuKit", "Software Documentation & API Reference Template", 2),
  T("Tech & SaaS", "high-tech", "high-tech-html-template", "ForgeStack", "IT Solutions & Managed Services", 8),
  T("Tech & SaaS", "web-hosting", "web-hosting-html-template", "GreenHost", "Eco-Friendly Green Web Hosting", 8),
  T("Tech & SaaS", "startup-launch", "startup-launch-html-template", "IGNITE", "Startup Launch Platform", 4),
  T("Tech & SaaS", "job-portal", "job-portal-html-template", "JobOrbit", "Find Your Next Career Move", 6),
  T("Tech & SaaS", "ai-studio", "ai-studio-html-template", "KORVA", "AI Studio & Machine Intelligence", 5),
  T("Tech & SaaS", "tech-startup", "tech-startup-html-template", "LABSKY", "Code. Cloud. Scale.", 4),
  T("Tech & SaaS", "crypto", "crypto-html-template", "Meridian Exchange", "Trade Digital Assets on a Platform Built for the Long Run", 8),
  T("Tech & SaaS", "admin-dashboard", "admin-dashboard-html-template", "PANELPRO", "Admin Dashboard", 5),
  T("Tech & SaaS", "project-management", "project-management-html-template", "PROMAN", "Project Management Solutions", 5),
  T("Portfolio & Personal", "chef-portfolio", "chef-portfolio-html-template", "CHEFER", "Taste, Memory, Place", 4),
  T("Portfolio & Personal", "developer-portfolio", "developer-portfolio-html-template", "DarkCV", "Developer Portfolio", 4),
  T("Portfolio & Personal", "freelancer-portfolio", "freelancer-portfolio-html-template", "DevFolio", "Freelancer Portfolio", 4),
  T("Portfolio & Personal", "free-folio", "free-folio-html-template", "FOLIOFRAME", "Design. Build. Inspire.", 4),
  T("Portfolio & Personal", "personal-portfolio", "personal-portfolio-html-template", "MYFOLIO", "Crafted with Purpose", 4),
  T("Portfolio & Personal", "photo-studio", "photo-studio-html-template", "Photozone", "Professional Photography Studio", 9),
  T("Portfolio & Personal", "modeling-agency", "modeling-agency-html-template", "POSEIFY", "Model & Talent Agency", 7),
  T("Travel & Hospitality", "coral-resort", "coral-resort-html-template", "Coraluxe", "Where the Ocean Meets Quiet Luxury", 4),
  T("Travel & Hospitality", "travel-blog", "travel-blog-html-template", "ROAMLOG", "Travel Journal & Blog", 5),
  T("Travel & Hospitality", "hotel-booking", "hotel-booking-html-template", "Sable Cove", "Boutique Coastal Hotel", 10),
  T("Travel & Hospitality", "water-park", "water-park-html-template", "SPLASHWAVE", "Family Water Park", 5),
  T("Travel & Hospitality", "travel-agency", "travel-agency-html-template", "TRIPCRAFT", "Craft Your Next Adventure", 5),
  T("Travel & Hospitality", "tourist-guide", "tourist-guide-html-template", "VOYAGEUR", "Curated Travel Destinations", 4),
  T("Travel & Hospitality", "zoo", "zoo-html-template", "Zoofari", "A Modern Safari & Wildlife Park", 9),
  T("Education & Learning", "driving-school", "driving-school-html-template", "DRIVIN", "Driving School", 4),
  T("Education & Learning", "online-courses", "online-courses-html-template", "ECOURSES", "Online Learning Platform", 4),
  T("Education & Learning", "education", "education-html-template", "EDUKATE", "Empowering Future Leaders", 4),
  T("Education & Learning", "kids-education", "kids-education-html-template", "KIDKINDER", "Where Learning Meets Play", 4),
  T("Education & Learning", "kids-daycare", "kids-daycare-html-template", "Little Wonders", "Preschool & Daycare", 6),
  T("Education & Learning", "dance", "dance-html-template", "Verve Dance Studio", "Ballet, Hip-Hop, Contemporary & Salsa Classes", 8),
  T("Fitness & Sports", "gym-fitness", "gym-fitness-html-template", "FITCORE", "Premium Gym & Fitness Center", 4),
  T("Fitness & Sports", "fitness-app-landing", "fitness-app-landing-html-template", "PulseFit", "Workout & Training App", 2),
  T("Fitness & Sports", "yoga", "yoga-html-template", "Sattva Studio", "Yoga Classes & Wellness Retreats", 8),
  T("Media & News", "business-news", "business-news-html-template", "MERIDIAN", "Independent Business & World Daily", 3),
  T("Media & News", "news-agency", "news-agency-html-template", "NEWSERS", "The World, Unfiltered", 4),
  T("Media & News", "news-magazine", "news-magazine-html-template", "NEWSMAG", "Stories That Matter.", 4),
  T("Media & News", "news-portal", "news-portal-html-template", "NEWSROOM", "Truth in Every Headline", 4),
  T("Media & News", "news-room", "news-room-html-template", "NEWSROOM", "Breaking Barriers, Breaking News", 4),
  T("Finance & Legal", "insurance", "insurance-html-template", "AssureShield", "Insurance That Protects What Matters", 6),
  T("Finance & Legal", "investment-consulting", "investment-consulting-html-template", "Calder & Ash", "Private Investment Advisory", 8),
  T("Finance & Legal", "financial-consulting", "financial-consulting-html-template", "FINANZA", "Trusted Financial Consulting", 4),
  T("Finance & Legal", "law-firm", "law-firm-html-template", "Kanun Chambers of Law", "Senior Counsel for Commercial & Civil Litigation", 8),
  T("Finance & Legal", "stock-market", "stock-market-html-template", "TRADEPULSE", "Stock Market Intelligence Platform", 6),
  T("Finance & Legal", "visa-immigration", "visa-immigration-html-template", "Travisa", "Visa & Immigration Consultants", 6),
  T("Logistics & Delivery", "express-delivery", "express-delivery-html-template", "FASTER", "Express Delivery", 4),
  T("Logistics & Delivery", "logistics", "logistics-html-template", "LOGISTICA", "Moving the World, On Time", 4),
  T("Logistics & Delivery", "drinking-water-delivery", "drinking-water-delivery-html-template", "RIVULET", "Spring Water Delivered", 6),
  T("Events & Lifestyle", "charity", "charity-html-template", "Charitize", "Every Hand Shapes Tomorrow", 4),
  T("Events & Lifestyle", "wedding", "wedding-html-template", "Mr&Mrs", "Elena & James", 2),
  T("Events & Lifestyle", "mosque", "mosque-html-template", "The Beacon Mosque", "A Community of Faith, Learning & Service", 9),
  T("Events & Lifestyle", "nature", "nature-html-template", "Wildrealm Trust", "Conservation Charity", 8),
  T("Automotive", "car-wash", "car-wash-html-template", "AquaShine", "Premium Car Wash & Detailing", 6),
  T("Automotive", "car-rental", "car-rental-html-template", "Cental", "Premium Car Rental", 4),
  T("Landing Pages", "footer-showcase", "footer-showcase-html-template", "FooterLab", "Footer Design Patterns", 2),
  T("Landing Pages", "pet-care", "pet-care-html-template", "PetLover", "Pet Grooming, Boarding & Veterinary Care", 8),
  T("Landing Pages", "solar-energy", "solar-energy-html-template", "SOLARIS", "Solar Energy Solutions", 4),
  T("Landing Pages", "solar-technology", "solar-technology-html-template", "SOLARTEC", "Innovating Solar, Empowering Futures", 4),
  T("Landing Pages", "app-landing-page", "app-landing-page-html-template", "VitalApp", "Fitness & Diet App for a Healthier You", 2),
];

/** The three templates shown on the home page: one for service businesses, one for trades and construction, one for online shops. */
export const FEATURED_TEMPLATE_IDS = ["beauty-salon", "construction-company", "multi-store"] as const;
export const featuredTemplates = (): SiteTemplate[] =>
  FEATURED_TEMPLATE_IDS.map((id) => SITE_TEMPLATES.find((t) => t.id === id)).filter((t): t is SiteTemplate => !!t);

export const templateDemoUrl = (t: Pick<SiteTemplate, "slug">) => `${TEMPLATE_DEMO_BASE}/${t.slug}/`;
export const templatesIn = (category: string) => SITE_TEMPLATES.filter((t) => t.category === category);
export const isTemplateCategory = (v: unknown): v is string => typeof v === "string" && TEMPLATE_CATEGORIES.some((c) => c.label === v);

/** The eight business types sign-up offered before the 18 categories. Old links and saved answers still resolve to the right category. */
const LEGACY = new Map<string, string>(Object.entries({
  "hair & beauty": "Beauty & Wellness", "barber shop": "Beauty & Wellness", "photography & media": "Portfolio & Personal",
  "fitness & wellness": "Fitness & Sports", "restaurant & café": "Food & Restaurant", "retail & products": "E-Commerce & Retail",
  "health & clinic": "Health & Medical", "consulting & services": "Business & Agency",
}));

/** A category label (any capitalisation) or an old business type, as the category it belongs to. "" when it is neither. */
export function categoryFor(raw: unknown): string {
  const v = String(raw ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!v) return "";
  return TEMPLATE_CATEGORIES.find((c) => c.label.toLowerCase() === v)?.label ?? LEGACY.get(v) ?? "";
}
