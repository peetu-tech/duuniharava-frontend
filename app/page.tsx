import { redirect } from "next/navigation";

export default function HomePage() {
  // Ohjaa etusivun kävijät suoraan studioon. 
  // (Vaihda '/studio' tarvittaessa siihen reittiin, missä se sijaitsee)
  redirect("/studio"); 
}
