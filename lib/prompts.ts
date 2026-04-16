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

export type CoverLetterTone = "professional" | "warm" | "sales";

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

function clean(value?: string) {
  return value?.trim() || "";
}

export function buildImproveCvPrompt(input: CvPromptInput) {
  return `
Paranna seuraava CV suomen kielellä.

TÄRKEIN TAVOITE:
Tee CV:stä uskottava, selkeä, moderni ja helposti luettava suomalaisen työnhaun käyttöön.

YLEISET SÄÄNNÖT:
- Kirjoita luonnollista, sujuvaa suomea.
- Älä keksi kokemusta, tutkintoja, saavutuksia, kursseja tai vastuualueita.
- Käytä vain käyttäjän antamia tietoja tai niistä varovasti pääteltäviä asioita.
- Poista toisto, liian heikko ilmaisu ja turha täytesisältö.
- Nosta esiin vahvuudet, jotka tukevat tavoiteltua työtä.
- Tee tekstistä napakka ja uskottava.
- Älä kirjoita liian mahtipontisesti.
- Älä käytä tekoälymäisiä fraaseja kuten “olen erittäin motivoitunut ja intohimoinen”.
- Jos jokin osio on lähes tyhjä, pidä se lyhyenä äläkä keksi sisältöä.

MITÄ HALUAN SISÄLTÖÖN:
- Profiili-osion tulee olla 3–5 lausetta.
- Työkokemus-osiossa pitää painottaa konkreettista tekemistä.
- Taidot-osio ei saa olla pelkkä geneerinen lista, vaan siinä voi näkyä työn kannalta olennaiset vahvuudet.
- Kielitaito, kortit ja harrastukset pidetään selkeinä ja lyhyinä.
- Tavoiteltu työ saa näkyä profiilissa tai muuten luonnollisesti painotuksissa.

ARVIOINTI:
KUNTOTARKASTUS-pisteiden pitää perustua siihen, kuinka valmis CV on työnhakuun.
- 50–65 = puutteellinen
- 66–79 = käyttökelpoinen mutta kaipaa hiomista
- 80–89 = hyvä
- 90–100 = erittäin hyvä

MUOTO:
Palauta vastaus TÄSMÄLLEEN tässä muodossa:

KUNTOTARKASTUS:
[pisteet muodossa esim. 78/100]

MUUTOSRAPORTTI:
1. ...
2. ...
3. ...
4. ...

CV_BODY:
[koko valmis parannettu CV]

CV_BODY-RAKENNE:
- Ensimmäinen rivi: nimi
- Seuraavat rivit: puhelin, sähköposti, paikkakunta
- Sen jälkeen osiot tässä järjestyksessä:
Profiili
Työkokemus
Koulutus
Kielitaito
Taidot
Kortit ja pätevyydet
Harrastukset

TÄRKEITÄ LISÄOHJEITA CV_BODYYN:
- Ei bullet pointteja, ellei se ole aivan välttämätöntä.
- Ei markdown-merkkejä.
- Ei selityksiä CV:n sekaan.
- Vain valmis CV-teksti.
- Tee rakenteesta visuaalisesti siisti tavallisena tekstinä.

Käyttäjän nykyinen CV:
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

PÄÄTAVOITE:
Kirjoita uskottava, selkeä ja työnhakuun sopiva CV, joka näyttää aidolta eikä tekoälyn tekemältä.

YLEISET SÄÄNNÖT:
- Älä keksi kokemusta, koulutuksia, saavutuksia tai vastuita.
- Käytä vain käyttäjän antamia tietoja.
- Jos tieto puuttuu, älä täytä sitä keksityllä sisällöllä.
- Kirjoita luonnollista, napakkaa ja hyvää suomea.
- Pidä sävy ammattimaisena mutta inhimillisenä.
- Tuo profiilissa esiin käyttäjän vahvuudet suhteessa tavoiteltuun työhön.
- Tee tekstistä helppolukuinen.

SISÄLTÖOHJE:
- Profiili: 3–5 lausetta
- Työkokemus: käytännöllinen, konkreettinen ja uskottava
- Koulutus: vain annetut tiedot
- Kielitaito: selkeästi
- Taidot: työn kannalta relevantit
- Kortit ja pätevyydet: lyhyesti
- Harrastukset: lyhyesti

ARVIOINTI:
Anna KUNTOTARKASTUS sen mukaan, kuinka käyttövalmis CV on.
- 50–65 = puutteellinen
- 66–79 = käyttökelpoinen
- 80–89 = hyvä
- 90–100 = erittäin hyvä

MUOTO:
Palauta vastaus TÄSMÄLLEEN tässä muodossa:

KUNTOTARKASTUS:
[pisteet muodossa esim. 84/100]

MUUTOSRAPORTTI:
1. ...
2. ...
3. ...
4. ...

CV_BODY:
[koko valmis CV]

CV_BODY-RAKENNE:
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

LISÄSÄÄNNÖT:
- Ei markdownia
- Ei bullet pointteja, ellei sisältö muuten hajoa
- Ei selityksiä CV_BODYn sisään
- Tee lopputuloksesta suoraan käyttökelpoinen

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

TAVOITE:
Muodosta realistisia ja hyödyllisiä työpaikkaehdotuksia käyttäjän profiilin perusteella.

SÄÄNNÖT:
- Keskity rooleihin, jotka oikeasti sopivat käyttäjän kokemukseen, taitoihin ja toiveisiin.
- Älä ehdota epärealistisia asiantuntija- tai johtorooleja, jos tausta ei tue niitä.
- Suosi käytännöllisiä rooleja, jos käyttäjän profiili on käytännönläheinen.
- Huomioi sijainti, työmuoto ja avainsanat.
- Jos jokin toive puuttuu, tee järkeviä mutta maltillisia oletuksia.
- company voi olla realistinen esimerkkityönantaja.
- Tee ehdotuksista erilaisia mutta saman profiilin sisällä.
- Palauta 4–6 ehdotusta.

JOKAISESSA EHDOTUKSESSA PITÄÄ OLLA KENTÄT:
- title
- company
- location
- type
- summary
- adText
- whyFit
- source
- matchScore

KENTTIEN OHJEET:
- title: realistinen työnimike
- company: uskottava yritysnimi
- location: käyttäjän toiveeseen sopiva alue
- type: esim. kokoaikainen, osa-aikainen, vuorotyö
- summary: 1–2 virkettä
- adText: 3–5 virkettä, kuin tiivistetty työpaikkakuvaus
- whyFit: 2–4 virkettä siitä miksi työ sopii käyttäjälle
- source: käytä arvoa "AI-ehdotus"
- matchScore: numero 1–100, käytä realistista vaihtelua

ERITTÄIN TÄRKEÄÄ:
- Palauta VAIN validi JSON-taulukko
- Ei markdownia
- Ei selityksiä
- Ei otsikoita ennen tai jälkeen
- Kaikkien kenttien arvot pitää olla merkkijonoja paitsi matchScore, joka on numero

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

PÄÄTAVOITE:
Tee CV:stä kohdistetumpi juuri tähän työpaikkaan ilman että sisältö muuttuu epäuskottavaksi.

SÄÄNNÖT:
- Älä keksi uutta kokemusta, koulutusta, saavutuksia tai taitoja.
- Käytä vain nykyisessä CV:ssä olevia tietoja tai niistä varovasti pääteltäviä painotuksia.
- Muokkaa erityisesti profiilia, taitoja ja työkokemuksen painotuksia.
- Korosta niitä asioita, jotka ovat työn kannalta olennaisimpia.
- Tee tekstistä edelleen selkeä, napakka ja luonnollinen.
- Jos työpaikkailmoituksessa painotetaan asiakaspalvelua, vastuullisuutta, myyntiä, tarkkuutta tai tiimityötä, nosta niitä esiin vain jos ne sopivat nykyiseen CV:hen.
- Älä tee CV:stä pidempää vain pidentämisen vuoksi.

PALAUTA TÄSMÄLLEEN TÄSSÄ MUODOSSA:

CV_BODY:
[koko uusi työpaikkaan kohdistettu CV]

LISÄOHJEET:
- Säilytä rakenne selkeänä
- Älä lisää selityksiä ennen tai jälkeen
- Ei markdownia
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
SÄVY:
- lämmin
- helposti lähestyttävä
- inhimillinen
- edelleen ammattimainen
- vältä liian jäykkää yrityskieltä
`
      : input.tone === "sales"
      ? `
SÄVY:
- energinen
- vakuuttava
- myyntihenkinen
- aktiivinen
- itsevarma mutta ei ylimielinen
- korosta asiakaspalvelua, tuloshakuisuutta ja oma-aloitteisuutta silloin kun se sopii taustaan
`
      : `
SÄVY:
- asiallinen
- ammattimainen
- selkeä
- rauhallisen vakuuttava
`;

  return `
Kirjoita SUOMEKSI laadukas, uskottava ja napakka työhakemus.

PÄÄTAVOITE:
Kirjoita hakemus, joka tuntuu aidosti tältä hakijalta eikä geneeriseltä mallipohjalta.

YLEISET SÄÄNNÖT:
- Hyödynnä sekä käyttäjän CV:tä että työpaikkailmoitusta.
- Älä keksi työkokemusta, koulutusta, saavutuksia tai vastuuta, joita käyttäjä ei ole antanut.
- Älä käytä ympäripyöreitä ja geneerisiä lauseita.
- Älä käytä tekoälymäisiä fraaseja.
- Älä kirjoita liian muodollisesti tai liian korulauseisesti.
- Hakemuksen pitää tuntua suomalaisen työnhaun tyyliin sopivalta.
- Korosta 2–4 oikeasti relevanttia vahvuutta.
- Näytä, miksi hakija sopii juuri tähän tehtävään.
- Yrityksen nimeä ja tehtävää pitää käyttää luontevasti tekstissä.
- Tekstin pitää olla helposti luettava ja luonnollinen.

${toneGuide}

RAKENNE:
1. Avaus:
   - mainitse haettava tehtävä
   - mainitse yritys
   - kerro kiinnostus tehtävää kohtaan luonnollisesti

2. Keskiosa:
   - nosta esiin hakijan relevantti kokemus
   - yhdistä kokemus työpaikan tarpeisiin
   - nosta esiin käytännöllisiä vahvuuksia, ei pelkkää yleistä itsekehua
   - osoita miksi hakija olisi hyvä lisä tiimiin

3. Lopetus:
   - ilmaise halu keskustella lisää
   - pidä lopetus luontevana ja napakkana

4. Allekirjoitus:
   - nimi
   - puhelin
   - sähköposti
   - paikkakunta tarvittaessa

PITUUS:
- noin 170–260 sanaa
- ei bullet pointteja
- ei väliotsikoita itse hakemukseen

ERITTÄIN TÄRKEÄÄ:
- Hakemus ei saa kuulostaa samalta kuin tavallinen geneerinen ChatGPT-hakemus
- Kirjoita vaihtelevaa ja luonnollista lauserakennetta
- Vältä näitä ilmauksia tai vastaavia:
  - "olen erittäin motivoitunut"
  - "intohimoni on"
  - "olen täydellinen valinta"
  - "haluan tuoda lisäarvoa organisaatiollenne"
- Pidä hakemus uskottavana nuorelle tai käytännönläheiselle hakijalle, jos tausta viittaa siihen

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