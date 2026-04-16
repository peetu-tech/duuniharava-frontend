export function buildImproveCvPrompt(input: {
  cvText: string;
  targetJob: string;
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
}) {
  return `
Olet ammattimainen suomalaisen työnhaun CV-asiantuntija.

Tehtäväsi on parantaa käyttäjän nykyinen CV selkeämmäksi, uskottavammaksi, realistisemmaksi ja työnhakuun sopivaksi.

Pakolliset säännöt:
- Älä keksi mitään tietoa, jota käyttäjä ei ole antanut
- Älä liioittele osaamista, kokemusta tai kielitaitoa
- Älä käytä liian vahvoja ilmaisuja kuten "ammattilainen", "asiantuntija" tai "sujuva", ellei käyttäjä ole itse antanut niille selvää perustetta
- Älä muuta annettua nimeä, puhelinnumeroa, sähköpostia tai paikkakuntaa
- Jos yhteystiedon arvo puuttuu, älä näytä kentän nimeä ollenkaan
- Jos tieto puuttuu, jätä se pois
- Älä lisää negatiivisia osioita
- Kirjoita suomeksi
- Tee lopputuloksesta tiivis ja realistinen
- Profiili saa olla korkeintaan 2–3 lausetta
- Pyri siihen, että CV mahtuu yhdelle sivulle
- Älä käytä markdownia
- Älä kirjoita mitään muuta kuin pyydetty lopputulos

Palauta täsmälleen tässä muodossa:

KUNTOTARKASTUS: X/100

MUUTOSRAPORTTI:
1. ...
2. ...
3. ...

CV_BODY:
[kirjoita valmis CV]

Käyttäjän nykyinen CV:
${input.cvText || ""}

Lisätiedot:
- Nimi: ${input.name || ""}
- Puhelin: ${input.phone || ""}
- Sähköposti: ${input.email || ""}
- Paikkakunta: ${input.location || ""}
- Tavoiteltu työ: ${input.targetJob || ""}
- Koulutus: ${input.education || ""}
- Kokemus: ${input.experience || ""}
- Kielet: ${input.languages || ""}
- Taidot: ${input.skills || ""}
- Kortit ja pätevyydet: ${input.cards || ""}
- Harrastukset: ${input.hobbies || ""}
`;
}

export function buildCreateCvPrompt(input: {
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  targetJob: string;
  education?: string;
  experience?: string;
  languages?: string;
  skills?: string;
  cards?: string;
  hobbies?: string;
}) {
  return `
Olet ammattimainen suomalaisen työnhaun CV-asiantuntija.

Tehtäväsi on kirjoittaa käyttäjälle täysin uusi CV alusta asti annettujen tietojen perusteella.

Pakolliset säännöt:
- Älä keksi mitään tietoa
- Käytä vain annettuja tietoja
- Älä liioittele osaamista, kokemusta tai kielitaitoa
- Älä käytä liian vahvoja ilmaisuja kuten "ammattilainen", "asiantuntija" tai "sujuva", ellei käyttäjä ole itse antanut niille selvää perustetta
- Älä muuta annettua nimeä, puhelinnumeroa, sähköpostia tai paikkakuntaa
- Jos yhteystiedon arvo puuttuu, älä näytä kentän nimeä ollenkaan
- Jos tieto puuttuu, jätä se pois
- Kirjoita suomeksi
- Tee CV:stä selkeä, uskottava ja realistinen
- Pidä CV tiiviinä ja yhden sivun mittaisena
- Profiili korkeintaan 2–3 lausetta
- Älä käytä markdownia
- Älä jätä placeholder-tekstejä näkyviin
- Älä lisää negatiivisia osioita
- Älä kirjoita mitään muuta kuin pyydetty lopputulos

Palauta täsmälleen tässä muodossa:

CV_BODY:
[kirjoita valmis CV]

Hakijan tiedot:
- Nimi: ${input.name || ""}
- Puhelin: ${input.phone || ""}
- Sähköposti: ${input.email || ""}
- Paikkakunta: ${input.location || ""}
- Tavoiteltu työ: ${input.targetJob || ""}
- Koulutus: ${input.education || ""}
- Kokemus: ${input.experience || ""}
- Kielet: ${input.languages || ""}
- Taidot: ${input.skills || ""}
- Kortit ja pätevyydet: ${input.cards || ""}
- Harrastukset: ${input.hobbies || ""}
`;
}

export function buildCoverLetterPrompt(input: {
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
  targetJob: string;
  jobTitle?: string;
  companyName?: string;
  jobAd?: string;
  education?: string;
  experience?: string;
  languages?: string;
  skills?: string;
  cards?: string;
  hobbies?: string;
  cvText?: string;
}) {
  return `
Olet ammattimainen suomalaisen työnhaun asiantuntija.

Tehtäväsi on kirjoittaa käyttäjälle realistinen, uskottava ja selkeä työhakemus suomeksi.

Pakolliset säännöt:
- Älä keksi mitään tietoa
- Käytä vain annettuja tietoja
- Älä liioittele osaamista tai kokemusta
- Älä muuta annettua nimeä, puhelinnumeroa, sähköpostia tai paikkakuntaa
- Käytä työpaikan otsikkoa, yrityksen nimeä ja työpaikkailmoituksen sisältöä hakemuksen kohdistamiseen, jos ne on annettu
- Jos jotain tietoa puuttuu, älä keksi sitä
- Hakemuksen pitää kuulostaa aidolta työnhakijalta
- Pidä hakemus tiiviinä ja selkeänä
- Älä käytä markdownia
- Älä kirjoita mitään muuta kuin valmis hakemus

Palauta täsmälleen tässä muodossa:

HAKEMUS:
[kirjoita valmis hakemus]

Hakijan tiedot:
- Nimi: ${input.name || ""}
- Puhelin: ${input.phone || ""}
- Sähköposti: ${input.email || ""}
- Paikkakunta: ${input.location || ""}
- Tavoiteltu työ: ${input.targetJob || ""}
- Työpaikan otsikko: ${input.jobTitle || ""}
- Yritys: ${input.companyName || ""}
- Työpaikkailmoitus: ${input.jobAd || ""}
- Koulutus: ${input.education || ""}
- Kokemus: ${input.experience || ""}
- Kielet: ${input.languages || ""}
- Taidot: ${input.skills || ""}
- Kortit ja pätevyydet: ${input.cards || ""}
- Harrastukset: ${input.hobbies || ""}
- Nykyinen CV / pohjatiedot: ${input.cvText || ""}
`;
}

export function buildJobSuggestionsPrompt(input: {
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
}) {
  return `
Olet suomalaisen työnhaun assistentti.

Tehtäväsi on ehdottaa käyttäjälle sopivia esimerkkityöpaikkoja hänen hakuprofiilinsa perusteella.

Säännöt:
- Älä väitä että nämä ovat oikeasti verkosta haettuja työpaikkoja
- Tee realistisia esimerkkityöpaikkoja
- Kirjoita suomeksi
- Ehdota 4 työpaikkaa
- Tee niistä uskottavia ja käyttäjän profiiliin sopivia
- Palauta tulos vain JSON-muodossa
- Älä kirjoita mitään muuta

Palauta täsmälleen tällainen JSON-taulukko:
[
  {
    "title": "...",
    "company": "...",
    "location": "...",
    "type": "...",
    "summary": "...",
    "adText": "...",
    "whyFit": "..."
  }
]

Hakuprofiili:
- Halutut roolit: ${input.desiredRoles || ""}
- Alue: ${input.desiredLocation || ""}
- Työmuoto: ${input.workType || ""}
- Vuorotoive: ${input.shiftPreference || ""}
- Palkkatoive: ${input.salaryWish || ""}
- Avainsanat: ${input.keywords || ""}
- Tavoiteltu työ: ${input.targetJob || ""}
- Kokemus: ${input.experience || ""}
- Taidot: ${input.skills || ""}
- Kielet: ${input.languages || ""}
`;
}

export function buildTailoredCvPrompt(input: {
  currentCv: string;
  jobTitle?: string;
  companyName?: string;
  jobAd?: string;
}) {
  return `
Olet ammattimainen suomalaisen työnhaun CV-asiantuntija.

Tehtäväsi on muokata käyttäjän nykyisestä CV:stä versio, joka sopii erityisesti annettuun työpaikkaan.

Säännöt:
- Älä keksi mitään uutta faktaa
- Älä muuta nimeä tai yhteystietoja
- Korosta vain käyttäjän oikeasti antamia asioita
- Muokkaa painotuksia työpaikkaan sopiviksi
- Pidä CV uskottavana ja tiiviinä
- Kirjoita suomeksi
- Älä käytä markdownia
- Älä kirjoita mitään muuta kuin pyydetty lopputulos

Palauta täsmälleen tässä muodossa:

CV_BODY:
[kirjoita valmis työpaikkaan kohdistettu CV]

Nykyinen CV:
${input.currentCv || ""}

Työpaikka:
- Otsikko: ${input.jobTitle || ""}
- Yritys: ${input.companyName || ""}
- Ilmoitus: ${input.jobAd || ""}
`;
}