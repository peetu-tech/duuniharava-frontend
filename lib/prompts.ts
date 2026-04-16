export type CvPromptInput = {
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

export type CreateCvPromptInput = {
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

export type JobSuggestionsPromptInput = {
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

export type TailoredCvPromptInput = {
  currentCv?: string;
  jobTitle?: string;
  companyName?: string;
  jobAd?: string;
};

export type CoverLetterTone = "professional" | "warm" | "sales";

export type CoverLetterPromptInput = {
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

function clean(value?: string) {
  return value?.trim() || "";
}

export function buildImproveCvPrompt(input: CvPromptInput) {
  return `
Paranna seuraava CV suomen kielellä.

Tavoite:
- Tee CV:stä uskottava, selkeä, moderni ja helposti luettava suomalaisen työnhaun käyttöön.
- Korosta käyttäjän vahvuuksia suhteessa tavoiteltuun työhön.
- Säilytä sisältö realistisena ja käytännöllisenä.

Säännöt:
- Älä keksi kokemusta, tutkintoja, kursseja, saavutuksia tai vastuualueita.
- Käytä vain käyttäjän antamia tietoja tai niistä hyvin varovasti pääteltäviä painotuksia.
- Poista toisto, ympäripyöreys ja liian heikko ilmaisu.
- Kirjoita luonnollista, sujuvaa suomea.
- Vältä geneerisiä tekoälymäisiä fraaseja.
- Jos jokin osio on lähes tyhjä, pidä se lyhyenä äläkä täytä sitä keksityllä sisällöllä.

Sisältöohje:
- Profiili: 3–5 lausetta, napakka ja työnhakuun sopiva.
- Työkokemus: painota konkreettista tekemistä.
- Taidot: nosta esiin työn kannalta olennaiset vahvuudet.
- Kielitaito, kortit ja harrastukset: pidä selkeinä ja lyhyinä.

Arviointi:
- 50–65 = puutteellinen
- 66–79 = käyttökelpoinen mutta kaipaa hiomista
- 80–89 = hyvä
- 90–100 = erittäin hyvä

Palauta vastaus täsmälleen tässä muodossa:

KUNTOTARKASTUS:
[pisteet muodossa esim. 78/100]

MUUTOSRAPORTTI:
1. ...
2. ...
3. ...
4. ...

CV_BODY:
[koko valmis parannettu CV]

CV_BODY-rakenne:
Nimi
Puhelin
Sähköposti
Paikkakunta

Profiili
Työkokemus
Koulutus
Kielitaito
Taidot
Kortit ja pätevyydet
Harrastukset

Lisäsäännöt:
- Ei markdownia
- Ei selityksiä CV_BODYn sisään
- Ei bullet pointteja ellei ole aivan pakko
- Vain valmis CV-teksti

Nykyinen CV:
${clean(input.cvText)}

Lisätiedot:
Nimi: ${clean(input.name)}
Puhelin: ${clean(input.phone)}
Sähköposti: ${clean(input.email)}
Paikkakunta: ${clean(input.location)}
Tavoiteltu työ: ${clean(input.targetJob)}
Koulutus: ${clean(input.education)}
Kokemus: ${clean(input.experience)}
Kielet: ${clean(input.languages)}
Taidot: ${clean(input.skills)}
Kortit ja pätevyydet: ${clean(input.cards)}
Harrastukset: ${clean(input.hobbies)}
`.trim();
}

export function buildCreateCvPrompt(input: CreateCvPromptInput) {
  return `
Luo uusi valmis CV suomen kielellä käyttäjän antamien tietojen pohjalta.

Tavoite:
- Kirjoita uskottava, selkeä ja työnhakuun sopiva CV.
- Tee lopputuloksesta luonnollinen ja aidon oloinen.
- Korosta käyttäjän vahvuuksia suhteessa tavoiteltuun työhön.

Säännöt:
- Älä keksi kokemusta, koulutuksia, saavutuksia tai vastuita.
- Käytä vain käyttäjän antamia tietoja.
- Jos tietoa puuttuu, älä täytä sitä keksityllä sisällöllä.
- Kirjoita napakkaa, hyvää suomea.
- Pidä sävy ammattimaisena mutta inhimillisenä.

Sisältöohje:
- Profiili: 3–5 lausetta
- Työkokemus: konkreettinen ja uskottava
- Koulutus: vain annetut tiedot
- Kielitaito: selkeästi
- Taidot: työn kannalta relevantit
- Kortit ja pätevyydet: lyhyesti
- Harrastukset: lyhyesti

Arviointi:
- 50–65 = puutteellinen
- 66–79 = käyttökelpoinen
- 80–89 = hyvä
- 90–100 = erittäin hyvä

Palauta vastaus täsmälleen tässä muodossa:

KUNTOTARKASTUS:
[pisteet muodossa esim. 84/100]

MUUTOSRAPORTTI:
1. ...
2. ...
3. ...
4. ...

CV_BODY:
[koko valmis CV]

CV_BODY-rakenne:
Nimi
Puhelin
Sähköposti
Paikkakunta

Profiili
Työkokemus
Koulutus
Kielitaito
Taidot
Kortit ja pätevyydet
Harrastukset

Lisäsäännöt:
- Ei markdownia
- Ei selityksiä CV_BODYn sisään
- Ei bullet pointteja ellei ole pakko

Käyttäjän tiedot:
Nimi: ${clean(input.name)}
Puhelin: ${clean(input.phone)}
Sähköposti: ${clean(input.email)}
Paikkakunta: ${clean(input.location)}
Tavoiteltu työ: ${clean(input.targetJob)}
Koulutus: ${clean(input.education)}
Kokemus: ${clean(input.experience)}
Kielet: ${clean(input.languages)}
Taidot: ${clean(input.skills)}
Kortit ja pätevyydet: ${clean(input.cards)}
Harrastukset: ${clean(input.hobbies)}
`.trim();
}

export function buildJobSuggestionsPrompt(input: JobSuggestionsPromptInput) {
  return `
Ehdota käyttäjälle sopivia työpaikkoja suomen kielellä.

Tavoite:
- Luo realistisia ja hyödyllisiä työpaikkaehdotuksia käyttäjän profiilin perusteella.
- Keskity rooleihin, jotka aidosti sopivat käyttäjän kokemukseen, taitoihin ja toiveisiin.
- Suosi käytännöllisiä ja realistisia rooleja.

Säännöt:
- Älä ehdota epärealistisia asiantuntija- tai johtorooleja, jos tausta ei tue niitä.
- Huomioi sijainti, työmuoto, vuorotoive ja avainsanat.
- company voi olla realistinen esimerkkiyritys.
- Tee ehdotuksista hieman erilaisia, mutta pysy saman profiilin sisällä.
- Palauta 4–6 ehdotusta.

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

Kenttien ohjeet:
- title: realistinen työnimike
- company: uskottava yritysnimi
- location: käyttäjän toiveeseen sopiva alue
- type: esim. kokoaikainen, osa-aikainen, vuorotyö
- summary: 1–2 virkettä
- adText: 3–5 virkettä, tiivistetty työpaikkakuvaus
- whyFit: 2–4 virkettä miksi työ sopii käyttäjälle
- source: käytä arvoa "AI-ehdotus"
- matchScore: numero 1–100

ERITTÄIN TÄRKEÄÄ:
- Palauta VAIN validi JSON-taulukko
- Ei markdownia
- Ei selityksiä
- Ei otsikoita
- Kaikki kentät ovat merkkijonoja paitsi matchScore, joka on numero

Käyttäjän hakuprofiili:
Halutut roolit: ${clean(input.desiredRoles)}
Sijainti: ${clean(input.desiredLocation)}
Työmuoto: ${clean(input.workType)}
Vuorotoive: ${clean(input.shiftPreference)}
Palkkatoive: ${clean(input.salaryWish)}
Avainsanat: ${clean(input.keywords)}

Käyttäjän tausta:
Tavoiteltu työ: ${clean(input.targetJob)}
Kokemus: ${clean(input.experience)}
Taidot: ${clean(input.skills)}
Kielet: ${clean(input.languages)}
`.trim();
}

export function buildTailoredCvPrompt(input: TailoredCvPromptInput) {
  return `
Muokkaa annettua CV:tä paremmin sopivaksi tiettyyn työpaikkaan.

Tavoite:
- Tee CV:stä kohdistetumpi juuri tähän työpaikkaan.
- Säilytä sisältö uskottavana ja realistisena.
- Korosta työn kannalta olennaisimpia jo olemassa olevia vahvuuksia.

Säännöt:
- Älä keksi uutta kokemusta, koulutusta, saavutuksia tai taitoja.
- Käytä vain nykyisessä CV:ssä olevia tietoja tai niistä varovasti pääteltäviä painotuksia.
- Muokkaa erityisesti profiilia, taitoja ja työkokemuksen painotuksia.
- Tee tekstistä edelleen selkeä, napakka ja luonnollinen.
- Älä pidennä CV:tä turhaan.

Palauta täsmälleen tässä muodossa:

CV_BODY:
[koko uusi työpaikkaan kohdistettu CV]

Lisäsäännöt:
- Säilytä rakenne selkeänä
- Ei markdownia
- Ei selityksiä ennen tai jälkeen
- Ei bullet pointteja ellei ole pakko

Työpaikka:
Tehtävä: ${clean(input.jobTitle)}
Yritys: ${clean(input.companyName)}
Työpaikkailmoitus:
${clean(input.jobAd)}

Nykyinen CV:
${clean(input.currentCv)}
`.trim();
}

export function buildCoverLetterPrompt(input: CoverLetterPromptInput) {
  const toneGuide =
    input.tone === "warm"
      ? `
Sävy:
- lämmin
- helposti lähestyttävä
- inhimillinen
- edelleen ammattimainen
- vältä liian jäykkää yrityskieltä
`
      : input.tone === "sales"
      ? `
Sävy:
- energinen
- vakuuttava
- myyntihenkinen
- aktiivinen
- itsevarma mutta ei ylimielinen
- korosta asiakaspalvelua, oma-aloitteisuutta ja tuloshakuisuutta vain jos ne sopivat taustaan
`
      : `
Sävy:
- asiallinen
- ammattimainen
- selkeä
- rauhallisen vakuuttava
`;

  return `
Kirjoita SUOMEKSI laadukas, uskottava ja napakka työhakemus.

Päätavoite:
- Kirjoita hakemus, joka tuntuu aidosti tältä hakijalta eikä geneeriseltä mallipohjalta.
- Hyödynnä sekä käyttäjän CV:tä että työpaikkailmoitusta.
- Korosta vain sellaisia vahvuuksia, jotka sopivat aidosti käyttäjän taustaan.

Säännöt:
- Älä keksi työkokemusta, koulutusta, saavutuksia tai vastuuta.
- Älä käytä ympäripyöreitä tai tekoälymäisiä fraaseja.
- Älä kirjoita liian muodollisesti tai liian korulauseisesti.
- Käytä yrityksen nimeä ja tehtävää luontevasti.
- Nosta esiin 2–4 relevanttia vahvuutta.
- Hakemuksen pitää kuulostaa suomalaisen työnhaun tyyliin sopivalta.

${toneGuide}

Rakenne:
1. Lyhyt avaus, jossa mainitaan tehtävä ja yritys
2. Keskiosa, jossa yhdistetään hakijan kokemus ja työpaikan tarpeet
3. Luonteva lopetus, jossa ilmaistaan kiinnostus keskustella lisää
4. Allekirjoitus käyttäjän tiedoilla

Pituus:
- noin 170–260 sanaa
- ei bullet pointteja
- ei väliotsikoita itse hakemukseen

Vältä erityisesti tällaisia ilmauksia:
- "olen erittäin motivoitunut"
- "intohimoni on"
- "olen täydellinen valinta"
- "haluan tuoda lisäarvoa organisaatiollenne"

Käyttäjän tiedot:
Nimi: ${clean(input.name)}
Puhelin: ${clean(input.phone)}
Sähköposti: ${clean(input.email)}
Paikkakunta: ${clean(input.location)}
Tavoiteltu työ: ${clean(input.targetJob)}

Työpaikka:
Tehtävä: ${clean(input.jobTitle)}
Yritys: ${clean(input.companyName)}
Työpaikkailmoitus:
${clean(input.jobAd)}

CV:
${clean(input.cvText)}

Palauta täsmälleen tässä muodossa:

HAKEMUS:
[koko valmis hakemus]
`.trim();
}