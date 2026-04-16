type CvPromptInput = {
  cvText?: string;
  targetJob?: string;
  education?: string;
  experience?: string;
  languages?: string;
  skills?: string;
  phone?: string;
  email?: string;
  location?: string;
  cards?: string;
  hobbies?: string;
  name?: string;
};

type CreateCvPromptInput = {
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
  targetJob?: string;
  education?: string;
  experience?: string;
  languages?: string;
  skills?: string;
  cards?: string;
  hobbies?: string;
};

type JobSuggestionsPromptInput = {
  desiredRoles?: string;
  desiredLocation?: string;
  workType?: string;
  shiftPreference?: string;
  salaryWish?: string;
  keywords?: string;
  targetJob?: string;
  experience?: string;
  skills?: string;
  languages?: string;
};

type TailoredCvPromptInput = {
  currentCv?: string;
  jobTitle?: string;
  companyName?: string;
  jobAd?: string;
};

type CoverLetterTone = "professional" | "warm" | "sales";

type CoverLetterPromptInput = {
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
  targetJob?: string;
  cvText?: string;
  jobTitle?: string;
  companyName?: string;
  jobAd?: string;
  tone?: CoverLetterTone;
};

export function buildImproveCvPrompt(input: CvPromptInput) {
  return `
Paranna seuraava CV suomen kielellä.

Tavoite:
- Tee CV:stä selkeä, uskottava ja työhaussa toimiva.
- Sovita sisältö käyttäjän tavoittelemaan työhön.
- Säilytä vain tiedot, jotka ovat uskottavia käyttäjän antamien tietojen perusteella.
- Älä keksi kokemusta, tutkintoja, saavutuksia tai kursseja.
- Poista turha toisto, ympäripyöreys ja liian heikko ilmaisu.
- Kirjoita luonnollisella suomen kielellä.
- Tee sisällöstä napakka, helposti luettava ja käytännöllinen.
- Korosta vahvuuksia, jotka sopivat haettavaan työhön.

Muoto:
Palauta vastaus täsmälleen tässä muodossa:

KUNTOTARKASTUS:
[pisteet muodossa esim. 78/100]

MUUTOSRAPORTTI:
1. ...
2. ...
3. ...

CV_BODY:
[koko valmis parannettu CV]

Sisältöohje:
- CV_BODY alkaa henkilön nimellä.
- Sen jälkeen yhteystiedot omille riveilleen.
- Käytä osioita:
Profiili
Työkokemus
Koulutus
Kielitaito
Taidot
Kortit ja pätevyydet
Harrastukset

Käyttäjän nykyinen CV:
${input.cvText || ""}

Lisätiedot:
Nimi: ${input.name || ""}
Puhelin: ${input.phone || ""}
Sähköposti: ${input.email || ""}
Paikkakunta: ${input.location || ""}
Tavoiteltu työ: ${input.targetJob || ""}
Koulutus: ${input.education || ""}
Kokemus: ${input.experience || ""}
Kielet: ${input.languages || ""}
Taidot: ${input.skills || ""}
Kortit ja pätevyydet: ${input.cards || ""}
Harrastukset: ${input.hobbies || ""}
`.trim();
}

export function buildCreateCvPrompt(input: CreateCvPromptInput) {
  return `
Luo uusi valmis CV suomen kielellä käyttäjän antamien tietojen pohjalta.

Tavoite:
- Tee uskottava, selkeä ja napakka CV.
- Kirjoita luonnollista, hyvää suomea.
- Älä keksi kokemusta, tutkintoja tai saavutuksia, joita käyttäjä ei ole antanut.
- Muotoile sisältö työnhakuun sopivaksi.
- Korosta käyttäjän vahvuuksia suhteessa tavoiteltuun työhön.
- Jos tietoa puuttuu, älä täytä sitä keksityllä sisällöllä.

Muoto:
Palauta vastaus täsmälleen tässä muodossa:

KUNTOTARKASTUS:
[pisteet muodossa esim. 84/100]

MUUTOSRAPORTTI:
1. ...
2. ...
3. ...

CV_BODY:
[koko valmis CV]

CV_BODY-rakenne:
- Nimi
- Puhelin
- Sähköposti
- Paikkakunta

Sen jälkeen osiot:
Profiili
Työkokemus
Koulutus
Kielitaito
Taidot
Kortit ja pätevyydet
Harrastukset

Käyttäjän tiedot:
Nimi: ${input.name || ""}
Puhelin: ${input.phone || ""}
Sähköposti: ${input.email || ""}
Paikkakunta: ${input.location || ""}
Tavoiteltu työ: ${input.targetJob || ""}
Koulutus: ${input.education || ""}
Kokemus: ${input.experience || ""}
Kielet: ${input.languages || ""}
Taidot: ${input.skills || ""}
Kortit ja pätevyydet: ${input.cards || ""}
Harrastukset: ${input.hobbies || ""}
`.trim();
}

export function buildJobSuggestionsPrompt(input: JobSuggestionsPromptInput) {
  return `
Ehdota käyttäjälle sopivia työpaikkoja suomen kielellä.

Tavoite:
- Luo realistisia työpaikkaehdotuksia käyttäjän profiilin pohjalta.
- Keskity töihin, jotka sopivat osaamiseen, kokemukseen, sijaintiin ja toiveisiin.
- Älä keksi täysin epärealistisia rooleja.
- Kirjoita tulos JSON-muodossa.
- Palauta 4-6 ehdotusta.

Jokaisessa ehdotuksessa pitää olla kentät:
- title
- company
- location
- type
- summary
- adText
- whyFit
- source
- matchScore

Säännöt:
- matchScore on numero välillä 1-100
- source voi olla esim. "AI-ehdotus"
- summary on lyhyt kuvaus työstä
- adText on hieman pidempi työpaikkateksti
- whyFit kertoo miksi työ sopii hakijalle

Palauta VAIN validi JSON-taulukko.
Ei markdownia.
Ei selityksiä.
Ei muita otsikoita.

Käyttäjän hakuprofiili:
Halutut roolit: ${input.desiredRoles || ""}
Sijainti: ${input.desiredLocation || ""}
Työmuoto: ${input.workType || ""}
Vuorotoive: ${input.shiftPreference || ""}
Palkkatoive: ${input.salaryWish || ""}
Avainsanat: ${input.keywords || ""}

Käyttäjän tausta:
Tavoiteltu työ: ${input.targetJob || ""}
Kokemus: ${input.experience || ""}
Taidot: ${input.skills || ""}
Kielet: ${input.languages || ""}
`.trim();
}

export function buildTailoredCvPrompt(input: TailoredCvPromptInput) {
  return `
Muokkaa annettua CV:tä paremmin sopivaksi tiettyyn työpaikkaan.

Tavoite:
- Säilytä CV:n sisältö uskottavana.
- Älä keksi uutta kokemusta.
- Muokkaa painotuksia, profiilia, taitoja ja sanamuotoja työpaikkaan sopivammiksi.
- Tee CV:stä edelleen selkeä ja napakka.
- Korosta vain sellaisia asioita, jotka löytyvät nykyisestä CV:stä tai ovat siitä loogisesti pääteltävissä.

Palauta täsmälleen tässä muodossa:

CV_BODY:
[koko uusi työpaikkaan kohdistettu CV]

Työpaikka:
Tehtävä: ${input.jobTitle || ""}
Yritys: ${input.companyName || ""}
Työpaikkailmoitus:
${input.jobAd || ""}

Nykyinen CV:
${input.currentCv || ""}
`.trim();
}

export function buildCoverLetterPrompt(input: CoverLetterPromptInput) {
  const toneGuide =
    input.tone === "warm"
      ? "Sävyn tulee olla lämmin, inhimillinen ja helposti lähestyttävä, mutta edelleen ammattimainen."
      : input.tone === "sales"
      ? "Sävyn tulee olla energinen, myyntihenkinen ja vakuuttava, mutta ei ylimielinen tai liian aggressiivinen."
      : "Sävyn tulee olla asiallinen, ammattimainen ja selkeä.";

  return `
Kirjoita SUOMEKSI laadukas, uskottava ja napakka työhakemus.

Tavoite:
- Tee hakemuksesta persoonallinen mutta ammattimainen.
- Hyödynnä sekä käyttäjän CV:tä että työpaikkailmoitusta.
- Korosta vain asioita, jotka aidosti sopivat käyttäjän taustaan.
- Älä keksi työkokemusta, koulutusta tai saavutuksia.
- Älä kirjoita liian geneerisesti.
- Älä käytä tekoälymäisiä fraaseja tai liioittelua.
- Kirjoita luonnollisella suomalaisen työnhaun tyylillä.

Rakenne:
1. Lyhyt ja vakuuttava avaus, jossa mainitaan haettava tehtävä ja yritys.
2. Keskiosa, jossa nostetaan esiin 2–4 vahvuutta CV:n perusteella suhteessa työpaikkaan.
3. Lopetus, jossa ilmaistaan kiinnostus keskustella lisää.
4. Lopuksi allekirjoitus käyttäjän tiedoilla.

Tyyli:
- Pituus noin 150–230 sanaa.
- Ei bullet pointteja.
- Ei väliotsikoita itse hakemukseen.
- Tekstin pitää olla helposti luettavaa ja luonnollista.
- ${toneGuide}

Käyttäjän tiedot:
Nimi: ${input.name || ""}
Puhelin: ${input.phone || ""}
Sähköposti: ${input.email || ""}
Paikkakunta: ${input.location || ""}
Tavoiteltu työ: ${input.targetJob || ""}

Työpaikka:
Tehtävä: ${input.jobTitle || ""}
Yritys: ${input.companyName || ""}
Työpaikkailmoitus:
${input.jobAd || ""}

CV:
${input.cvText || ""}

Palauta täsmälleen tässä muodossa:

HAKEMUS:
[koko valmis hakemus]
`.trim();
}