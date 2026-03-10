# Avtalsportalen — Funktioner & Förbättringar

> Redan implementerat: Kund-/avtals-CRUD, PDF-uppladdning, taggar, relaterade avtal, roller (admin/user/reader), påminnelser (UI), dashboard, inställningar.

---

## 🔴 Hög prioritet

### 1. E-postpåminnelser (automatiska)
- [x] Edge Function som körs dagligen (cron) och skickar påminnelser när uppsägningsfristen närmar sig
- [x] Integration med SMTP (Microsoft 365 / nodemailer) för e-postutskick
- [x] Konfigurerbar e-postmall (redan finns i inställningar)
- [x] Loggning av skickade påminnelser i `reminder_log`
- [x] pg_cron schemalagt dagligen kl 07:00

### 2. Sök & Filtrering
- [x] Fulltext-sökning över avtal, kunder och kontakter (GlobalSearch med Cmd+K)
- [x] Avancerade filter: status, avtalstyp, datum-intervall, värde, taggar (Contracts-sidan)
- [x] Sparade filtervy (t.ex. "Mina avtal", "Utgående Q2")
- [x] Global sökbar (Cmd+K / Ctrl+K)

### 3. Audit Trail / Ändringslogg
- [x] Logga alla ändringar på avtal (vem, vad, när) — `audit_log`-tabell + trigger
- [x] Visa ändringshistorik per avtal — AuditLog-komponent i avtalsdetalj
- [x] Databasbaserad lösning med triggers

---

## 🟡 Medel prioritet

### 4. Avtalsmallar
- [x] Skapa mallar med förifyllda fält (typ, bindningstid, uppsägningstid etc.)
- [x] Skapa nytt avtal från mall (pre-fill formulär via query-param)
- [x] Admin kan hantera mallar (TemplatesPage)

### 5. Kommentarer & Aktivitetslogg
- [x] Kommentarsfält per avtal (intern kommunikation) — ContractComments
- [x] Aktivitetslogg som visar uppladdningar, statusändringar, påminnelser
- [x] @-mentions för att notifiera kollegor

### 6. Rapportering & Export
- [x] CSV/Excel-export av avtalslistor — ContractExport
- [x] Rapport: totalt avtalsvärde per kund, kategori, period
- [x] Dashboard-filter (datumintervall, avtalstyp)
- [x] Grafisk rapport: avtal som löper ut per månad

### 7. Versionshantering av dokument
- [x] Ladda upp ny version av ett dokument (behåll historik) — `contract_documents`-tabell
- [x] Visa och jämför tidigare versioner
- [x] Markera aktiv/giltig version

### 8. Automatisk förnyelse-logik
- [x] När ett avtal med `auto_renew = true` passerar slutdatum: skapa nytt avtal automatiskt — Edge Function
- [x] Notifiera ansvarig vid automatisk förnyelse
- [x] Konfigurerbar förnyelseperiod (använder bindningstid)

---

## 🟢 Lägre prioritet / Nice-to-have

### 9. E-signering
- [ ] Integration med Scrive eller DocuSign
- [ ] Skicka avtal för signering direkt från appen
- [ ] Statusuppdatering när avtal signerats

### 10. Integrationer
- [ ] Kalender-sync (Google Calendar / Outlook) för uppsägningsdatum
- [ ] ERP/ekonomisystem-koppling (Business Central)
- [ ] SSO via Azure AD / Google Workspace
- [ ] Webhook-stöd för externa system

### 11. UX-förbättringar
- [ ] Dark mode (redan stöd i designsystemet, behöver finjusteras)
- [ ] Mobilanpassad vy för avtalslistan
- [x] Bulk-åtgärder (markera flera avtal → ändra status, exportera)
- [ ] Drag-and-drop för dokumentuppladdning
- [ ] Notifikationer i appen (bell icon med olästa händelser)

### 12. Säkerhet & Compliance
- [ ] Tvåfaktorsautentisering (2FA/MFA)
- [ ] GDPR-verktyg: exportera/radera kunddata
- [ ] Sessionstimeout och lösenordspolicy
- [ ] IP-vitlistning för admin-åtkomst

### 13. Klausulbibliotek
- [ ] Bibliotek med standardklausuler (uppsägning, ansvar, sekretess)
- [ ] Koppla klausuler till avtalsmallar
- [ ] Sök och återanvänd klausuler

### 14. Avtalsstatus-workflow / Godkännandeflöde
- [ ] Konfigurerbart workflow: Utkast → Granskning → Godkänt → Aktivt → Uppsagt
- [ ] Godkännandeflöde med notifiering
- [ ] Statusövergångsregler (t.ex. bara admin kan godkänna)

---

## 💡 Framtida idéer
- AI-analys av avtalsvillkor (identifiera risker, sammanfatta klausuler)
- Benchmarking: jämför avtalsvillkor mot branschstandard
- Kundportal: ge kunder läsåtkomst till sina avtal
- Multi-tenant / organisationsstöd
- API för tredjepartsintegrationer
