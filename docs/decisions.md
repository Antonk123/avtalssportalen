# Arkitektur- och Designbeslut

Detta dokument loggar viktiga tekniska beslut som påverkar projektets arkitektur och riktning. Använd ADR-formatet (Architecture Decision Record) för att dokumentera beslut med kontext och konsekvenser.

---

## Format för beslut

```markdown
## [YYYY-MM-DD] Beslutets titel

**Status:** Proposed/Accepted/Deprecated/Superseded

**Kontext:**
Vilket problem eller behov står vi inför?

**Beslut:**
Vad bestämde vi oss för?

**Konsekvenser:**
Vilka för- och nackdelar medför detta beslut?
```

---

## [2026-03-10] Supabase som backend-plattform

**Status:** Accepted

**Kontext:**
Projektet behöver en komplett backend med databas, autentisering, real-time funktionalitet och storage för PDF-filer. Alternativen var att bygga en egen Node.js/Express backend eller använda en Backend-as-a-Service.

**Beslut:**
Vi valde Supabase som vår backend-plattform. Supabase ger oss:
- PostgreSQL databas med migrations
- Inbyggd autentisering
- Real-time subscriptions
- File storage
- Row Level Security (RLS)
- Auto-genererat REST API

**Konsekvenser:**

*Fördelar:*
- Snabbare utveckling - ingen egen backend att bygga och underhålla
- Inbyggd säkerhet med RLS
- Skalbarhet hanteras av Supabase
- Minskar infrastruktur-komplexitet

*Nackdelar:*
- Vendor lock-in - svårt att migrera från Supabase senare
- Mindre flexibilitet i backend-logik (måste använda PostgreSQL funktioner eller Edge Functions)
- Kostnad kan öka med skala
- Begränsad kontroll över backend-infrastruktur

*Mitigering:*
- Vi använder standardiserad SQL och TypeScript - minskar vendor lock-in
- Edge Functions kan användas för komplex backend-logik vid behov
