# Projektkontext

## Projektöversikt

**Namn:** Avtalsportalen

**Syfte:** En webbaserad portal för att hantera kundavtal, spåra utgångsdatum och skicka automatiska påminnelser via SMTP. Systemet hjälper organisationer att hålla koll på sina avtal och undvika att viktiga avtal går ut utan förvarning.

**Målgrupp:** Företag och organisationer som behöver centraliserad avtalshantering med automatiska notifieringar.

## Arkitektur

**Frontend:**
- React 18 med TypeScript
- Vite som build-verktyg och dev-server
- React Router för navigering
- shadcn-ui komponenter med Tailwind CSS för styling

**Backend:**
- Supabase (PostgreSQL databas med inbyggd autentisering)
- Real-time subscriptions
- Row Level Security (RLS) för säkerhet

**Huvudfunktioner:**
- CRUD-operationer för avtal och kunder
- PDF-uppladdning och dokumenthantering
- Automatiska påminnelser via SMTP
- Granskningslogg (audit logs)
- Avtalsmallar
- Kommentarsfunktion
- Rapportering och statistik

## Tekniska val

**Vite:** Snabb utvecklingsmiljö med Hot Module Replacement (HMR) och optimerad production build.

**Supabase:** Komplett backend-as-a-service som ger PostgreSQL-databas, autentisering, real-time och storage utan att behöva bygga egen backend-infrastruktur.

**shadcn-ui:** Fullt anpassningsbara UI-komponenter som ägs av projektet (inte ett npm-paket), ger full kontroll över design och beteende.

**TypeScript:** Statisk typning minskar buggar, förbättrar utvecklarupplevelsen med IntelliSense och gör refaktorering säkrare.

## Beroenden

**Kärna:**
- `react` & `react-dom` - UI-bibliotek
- `typescript` - Typning
- `vite` - Build-verktyg
- `@supabase/supabase-js` - Backend-klient

**UI & Styling:**
- `tailwindcss` - Utility-first CSS
- `@radix-ui/*` - Headless UI-komponenter (via shadcn-ui)
- `lucide-react` - Ikoner

**Router & State:**
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching och caching

**Formulär & Validering:**
- `react-hook-form` - Formulärhantering
- `zod` - Schema-validering

Se `package.json` för komplett lista.
