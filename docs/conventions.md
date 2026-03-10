# Kodkonventioner

## Kodstil

- **TypeScript strict mode** aktiverad
- **Funktionella komponenter** med hooks (inga class components)
- **Explicita typer** - undvik `any`, använd specifika interface/type
- **Beskrivande namn** - variabler och funktioner ska vara självdokumenterande
- **Destructuring** föredras för props och objekt
- **Async/await** istället för `.then()` för asynkron kod

## Namngivning

**Komponenter:**
- `PascalCase` - `CustomerList.tsx`, `ContractCard.tsx`

**Funktioner & variabler:**
- `camelCase` - `getUserContracts()`, `isLoading`, `contractData`

**Filer:**
- `kebab-case` för utility-filer - `date-utils.ts`, `api-client.ts`
- `PascalCase` för komponent-filer - `CustomerForm.tsx`

**Konstanter:**
- `UPPER_SNAKE_CASE` - `MAX_FILE_SIZE`, `API_BASE_URL`

**CSS-klasser:**
- Tailwind utilities föredras
- Custom klasser med `kebab-case` vid behov

## Mappstruktur

```
src/
├── components/        # Återanvändbara UI-komponenter
├── pages/            # Sidkomponenter (en per route)
├── hooks/            # Custom React hooks
├── contexts/         # React Context providers
├── lib/              # Utilities och hjälpfunktioner
├── types/            # TypeScript type-definitioner
├── integrations/     # Externa integrationsklienter (Supabase, etc.)
├── data/             # Statisk data och konstanter
└── test/             # Test-utilities och konfiguration
```

**Komponentorganisation:**
- En komponent per fil (undantag: små interna komponenter)
- Relaterade komponenter kan grupperas i undermappar
- Index-filer (`index.ts`) för clean imports

## Commit-format

Använd **Conventional Commits:**

```
type(scope): beskrivning

[valfri kropp]

[valfri footer]
```

**Typer:**
- `feat` - Ny funktionalitet
- `fix` - Buggfix
- `docs` - Dokumentationsändringar
- `style` - Formatering (ingen kod-förändring)
- `refactor` - Kod-omstrukturering
- `test` - Lägga till eller ändra tester
- `chore` - Uppdatera dependencies, config, etc.

**Exempel:**
```
feat(contracts): lägg till PDF-uppladdning för avtal
fix(auth): rätta login-redirect efter autentisering
docs(readme): uppdatera installation-instruktioner
refactor(api): extrahera Supabase-klient till egen fil
```

**Regler:**
- Använd imperativ form: "lägg till" inte "lade till"
- Håll första raden under 72 tecken
- Scope är valfritt men rekommenderat för större projekt
