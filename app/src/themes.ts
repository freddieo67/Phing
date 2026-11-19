export interface ThemeItem {
  title: string; // Kortnamn som visas på spelbrickan (1-2 ord)
  hint: string;  // Fullständig ledtråd/beskrivning vid tryck
  icon: string;  // Emoji som visas i rutan
}

export interface ThemeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: ThemeItem[];
}

export const THEME_CATEGORIES: ThemeCategory[] = [
  // =========================================================================
  // 1. STAD & TRAFIK (Allt blandat: stadsmiljö, detaljer och vanliga fordon)
  // =========================================================================
  {
    id: 'city',
    name: 'Stad & Trafik',
    description: 'En härlig mix av stadsmiljö, prylar, butiker, folk och fordon!',
    icon: '🏙️',
    items: [
      // --- Stadsmiljö & gator ---
      { title: 'Parkerad cykel', hint: 'En cykel som står parkerad eller fastlåst', icon: '🚲' },
      { title: 'Övergångsställe', hint: 'Vita ränder (zebralag) målade på gatan', icon: '🚶' },
      { title: 'Papperskorg', hint: 'Offentlig papperskorg på gatan eller i park', icon: '🗑️' },
      { title: 'Parkbänk', hint: 'Sittbänk utomhus längs trottoaren eller i park', icon: '🪑' },
      { title: 'Lyktstolpe', hint: 'Gatlykta längs trottoaren eller vägen', icon: '💡' },
      { title: 'Trafikljus', hint: 'Ljusignal för bilar eller gående', icon: '🚦' },
      { title: 'Busskur', hint: 'Busskur eller hållplatsskylt med tidtabell', icon: '🚏' },
      { title: 'Blomkruka', hint: 'Stadskruka eller blomlåda på gatan', icon: '🪴' },
      { title: 'Skyltfönster', hint: 'Butiksfönster med uppställda varor', icon: '🛍️' },
      { title: 'Brunnslock', hint: 'Gjutjärnslock på trottoaren eller i gatan', icon: '🔘' },
      { title: 'Entrédörr', hint: 'Port eller entrédörr med portkod / porttelefon', icon: '🚪' },
      { title: 'Trappa utomhus', hint: 'Trappa utomhus i betong, sten eller metall', icon: '🪜' },
      { title: 'Askkopp', hint: 'Fast monterad askkopp på stolpe eller vägg', icon: '🚬' },
      { title: 'Vägmärke', hint: 'Hastighetsskylt eller förbudsmärke', icon: '🛑' },
      { title: 'Reklamaffisch', hint: 'Affisch på reklampelare eller i busskur', icon: '📜' },
      { title: 'Trädstöd', hint: 'Ungt träd med stöttande träpinnar eller band', icon: '🌳' },
      { title: 'Kantsten', hint: 'Granit- eller betongkantsten vid trottoarkanten', icon: '🧱' },
      { title: 'Brevlåda', hint: 'Gul eller blå PostNord-brevlåda', icon: '📮' },
      { title: 'Cykelställ', hint: 'Offentligt cykelställ på trottoar eller torg', icon: '🚲' },
      { title: 'Uteservering', hint: 'Stol eller bord vid en uteservering/café', icon: '☕' },
      { title: 'Gatuskylt', hint: 'Skylt som visar gatans eller grändens namn', icon: '🪧' },
      { title: 'Stadsfågel', hint: 'Duva, skata eller mås som pickar på marken', icon: '🕊️' },
      { title: 'Fönsterväxt', hint: 'Krukväxt synlig på en fönsterbräda utifrån', icon: '🌿' },
      { title: 'Person m ryggsäck', hint: 'Fotgängare med ryggsäck på ryggen', icon: '🎒' },
      { title: 'P-automat', hint: 'Parkeringsautomat eller P-skylt', icon: '🅿️' },
      { title: 'Staket el räcke', hint: 'Metallräcke eller trästaket', icon: '🚧' },
      { title: 'Markis', hint: 'Utfälld tygmarkis över butik eller fönster', icon: '🎪' },
      { title: 'Gatukonst', hint: 'Färgstark graffiti, muralmålning eller stencil', icon: '🎨' },
      { title: 'Kopplad hund', hint: 'Hund som rastas i koppel av sin ägare', icon: '🐕' },
      { title: 'Staty', hint: 'Skulptur, byst eller konstverk utomhus', icon: '🗿' },
      { title: 'Fontän', hint: 'Vattenspel eller fontän på torg eller i park', icon: '⛲' },
      { title: 'Svensk flagga', hint: 'Flaggstång med svensk flagga eller vimpel', icon: '🇸🇪' },
      { title: 'Takkupol', hint: 'Torn, spira eller kupol på ett äldre hustak', icon: '🏰' },
      { title: 'Brandpost', hint: 'Brandpost, brandventil eller röd brandpostskylt', icon: '🚒' },
      { title: 'Smidesräcke', hint: 'Utsmyckat trappräcke eller grind i smidesjärn', icon: '⛩️' },
      { title: 'Kullersten', hint: 'Gata eller torg belagd med klassisk kullersten', icon: '🪨' },
      { title: 'Fasadklocka', hint: 'Stor analog klocka monterad på en husfasad', icon: '🕒' },
      { title: 'Snörasskylt', hint: 'Varningsskylt eller bock för takskottning/istappar', icon: '⚠️' },
      { title: 'Blomsterampel', hint: 'Hängande blomkorg fäst på en lyktstolpe', icon: '🌸' },
      { title: 'Solglasögon', hint: 'Person på gatan som bär solglasögon', icon: '🕶️' },
      { title: 'Dörrknackare', hint: 'Gammaldags dörrknackare i metall på en port', icon: '🚪' },
      { title: 'Trafikspegel', hint: 'Rund konvex spegel i en skymd gatukorsning', icon: '🪞' },
      { title: 'Neonskylt', hint: 'Lysande neonskylt eller retro ljusskylt', icon: '💡' },
      { title: 'Balkongparasoll', hint: 'Balkong med ett uppfällt parasoll', icon: '⛱️' },
      { title: 'Återvinningskärl', hint: 'Kärl eller container för glas, papper eller plast', icon: '♻️' },
      { title: 'Take-away kaffe', hint: 'Person som går med en take-away kaffemugg', icon: '☕' },
      { title: 'Tegelskorsten', hint: 'Synlig klassisk tegelskorsten på ett tak', icon: '🧱' },
      { title: 'Stuprörsutkast', hint: 'Böjt utkastarrör längst ner vid trottoaren', icon: '🌧️' },
      { title: 'Torgstånd', hint: 'Bord med försäljning av blommor, bär eller frukt', icon: '🍓' },
      { title: 'Skyltdekal', hint: 'Klistermärke fäst på baksidan av en gatuskylt', icon: '🏷️' },
      { title: 'Fönsterkatt', hint: 'Katt som spanar ut genom ett fönster', icon: '🐈' },
      { title: 'Solur', hint: 'Solur på en husfasad eller sockel i en park', icon: '☀️' },
      { title: 'Skor på ledning', hint: 'Skor med knutna skosnören kastade över ledning', icon: '👟' },
      { title: 'Fasadreklam', hint: 'Äldre målad reklam direkt på tegel- eller putsfasad', icon: '🎨' },
      { title: 'Byggnadsår', hint: 'Årtal ingjutet eller hugget i husfasaden', icon: '🏛️' },
      { title: 'Kärlekslås', hint: 'Hänglås fastsatt på en bro eller ett räcke', icon: '🔒' },
      { title: 'Gatumosaik', hint: 'Mosaik- eller stenmönster i markbeläggningen', icon: '💠' },
      { title: 'Trädgårdstomte', hint: 'Tomte eller trädgårdsfigur synlig från gatan', icon: '🧙' },
      { title: 'Balkongodling', hint: 'Tomatplantor eller grönsaksland på en balkong', icon: '🍅' },
      { title: 'Väntande hund', hint: 'Hund som sitter kopplad utanför en butik och väntar', icon: '🐶' },
      { title: 'Krittavla', hint: 'Handskriven meny eller skylt på griffeltavla', icon: '📋' },

      // --- Inmixade realistiska fordon ---
      { title: 'Stadsbuss', hint: 'Kollektivtrafikbuss i trafik eller vid hållplats', icon: '🚌' },
      { title: 'Vit skåpbil', hint: 'Hantverkarbil eller transportbil', icon: '🚐' },
      { title: 'Röd personbil', hint: 'Röd personbil i rörelse eller parkerad', icon: '🚗' },
      { title: 'Elsparkcykel', hint: 'Elscooter parkerad eller i drift', icon: '🛴' },
      { title: 'Taxibil', hint: 'Taxi med taxiskylt på taket', icon: '🚕' },
      { title: 'Släpkärra', hint: 'Släpvagn kopplad till bil eller parkerad', icon: '🛞' },
      { title: 'Tung lastbil', hint: 'Fleraxlad lastbil eller distributionsbil', icon: '🚛' },
      { title: 'Motorcykel', hint: 'Tvåhjulig tung MC parkerad eller i trafik', icon: '🏍️' },
      { title: 'Moped / Scooter', hint: 'Moped klass 1 eller klass 2', icon: '🛵' },
      { title: 'Stadsjeep / SUV', hint: 'Högbyggd personbil/SUV', icon: '🚙' },
      { title: 'Elbil på laddning', hint: 'Elbil inkopplad till laddstolpe med laddkabel', icon: '⚡' },
      { title: 'Skateboard', hint: 'Skateboard, longboard eller sparkcykel', icon: '🛹' },
      { title: 'Lådcykel', hint: 'Cykellåda med hjul för barn eller paket', icon: '🛺' },
      { title: 'Paketbudbil', hint: 'Budbil från DHL, PostNord, Bring, UPS el Best', icon: '📦' },
      { title: 'Kombi m takbox', hint: 'Kombibil med monterad takbox', icon: '🚙' },
      { title: 'Pickup med flak', hint: 'Flakbil med öppet lastflak', icon: '🛻' },
      { title: 'Gult fordon', hint: 'Gult fordon i trafiken (taxi, post eller service)', icon: '🚖' },
      { title: 'Polis el ambulans', hint: 'Utryckningsfordon i trafik eller parkerat', icon: '🚓' },
      { title: 'Campervan', hint: 'Campinginredd skåpbil ("plåtis")', icon: '🚐' },
      { title: 'A-traktor (EPA)', hint: 'A-traktor med röd varningstriangel (LGF) bakpå', icon: '⚠️' },
      { title: 'Gatusopmaskin', hint: 'Sopmaskin med roterande borstar', icon: '🧹' },
      { title: 'Hjullastare / Grävare', hint: 'Gul eller orange entreprenadmaskin', icon: '🚜' },
      { title: 'Husbil', hint: 'Alkov- eller helintegrerad husbil', icon: '🏕️' },
      { title: 'Cabriolet', hint: 'Bil med fällbart tyg- eller plåttak', icon: '☀️' },
      { title: 'Brandbil', hint: 'Röd släckbil eller stegbil från räddningstjänsten', icon: '🚒' },
      { title: 'Bärgningsbil', hint: 'Bärgningsfordon med vinsch eller flak', icon: '🚚' },
      { title: 'Food truck', hint: 'Matvagn eller rullande serveringsbil', icon: '🍔' },
      { title: 'Betongbil', hint: 'Lastbil med roterande cementtrumma', icon: '🚛' },
      { title: 'Veteranfordon', hint: 'Äldre bil eller moped från förr', icon: '🚙' },
      { title: 'Silvergrå bil', hint: 'Klassisk silver- eller gråmetallic personbil', icon: '🚗' },
      { title: 'Reservhjul bak', hint: 'Fordon med reservhjul monterat utanpå bakluckan', icon: '🛞' },
    ],
  },

  // =========================================================================
  // 2. BILMODELLER (Sveriges vanligaste och roligaste bilmärken & modeller)
  // =========================================================================
  {
    id: 'car_models',
    name: 'Bilmodeller & Märken',
    description: 'Håll utkik efter specifika bilmärken, modeller och klassiker!',
    icon: '🏎️',
    items: [
      { title: 'Volvo V60 / V90', hint: 'Modern svensk kombi med Tors hammare-lyktor', icon: '🇸🇪' },
      { title: 'Volvo V70', hint: 'Sveriges mest älskade folkhemskombi från 00-/10-talet', icon: '🇸🇪' },
      { title: 'Volvo XC60', hint: 'Sveriges mest populära mellanklass-SUV', icon: '🇸🇪' },
      { title: 'Volvo XC40', hint: 'Kompakt svensk crossover eller elbil', icon: '🇸🇪' },
      { title: 'Volvo 240 / 740', hint: 'Svensk odödlig tegelsten med bakhjulsdrift', icon: '🇸🇪' },
      { title: 'Tesla Model Y', hint: 'Sveriges mest sålda el-SUV utan frontgrill', icon: '⚡' },
      { title: 'Tesla Model 3', hint: 'Låg eldriven fyrsitsig sedan från Tesla', icon: '⚡' },
      { title: 'VW Golf', hint: 'Klassisk Volkswagen Golf i valfri generation', icon: '🇩🇪' },
      { title: 'VW Passat', hint: 'Klassisk tysk tjänstebilskombi', icon: '🇩🇪' },
      { title: 'VW Tiguan', hint: 'Mellanstor tysk familje-SUV från Volkswagen', icon: '🇩🇪' },
      { title: 'VW Bubbla', hint: 'Luftkyld klassisk Volkswagen Typ 1 ("Bubblan")', icon: '🐞' },
      { title: 'Toyota Yaris / Corolla', hint: 'Japansk hybridstorsäljare med Toyota-emblemet', icon: '🇯🇵' },
      { title: 'Toyota RAV4', hint: 'Fyrhjulsdriven robust hybrid-SUV från Toyota', icon: '🇯🇵' },
      { title: 'Toyota Hilux', hint: 'Oslagbar slitstark pickup med öppet flak', icon: '🛻' },
      { title: 'Kia Ceed / Niro', hint: 'Vanlig koreansk kombi eller crossover', icon: '🇰🇷' },
      { title: 'Kia EV6', hint: 'Futuristisk crossover på modern 800V-plattform', icon: '⚡' },
      { title: 'Skoda Octavia', hint: 'Praktisk tjeckisk kombi med den bevingade pilen', icon: '🇨🇿' },
      { title: 'Ford Focus / Fiesta', hint: 'Kompakt Ford med den blå ovalen i grillen', icon: '🇺🇸' },
      { title: 'Ford Mustang', hint: 'Amerikansk ponnybil med hästen i grillen', icon: '🐎' },
      { title: 'Ford Transit', hint: 'Vit eller färgad transportskåpbil', icon: '🚐' },
      { title: 'BMW 3-serie', hint: 'Bavarian sedan eller touring med klassisk njurgrill', icon: '🇩🇪' },
      { title: 'BMW 5-serie', hint: 'Klassisk tysk premiumbil i sedan- el herrgårdsvagnsutförande', icon: '🇩🇪' },
      { title: 'Audi A4 / A6', hint: 'Audi kombi med de fyra sammankopplade ringarna', icon: '🇩🇪' },
      { title: 'Mercedes C-klass', hint: 'Mercedes sedan eller kombi med stjärnan', icon: '🇩🇪' },
      { title: 'Mercedes E-klass', hint: 'Klassisk tysk taxisedan eller kombi med stjärnan', icon: '🇩🇪' },
      { title: 'Polestar 2', hint: 'Svensk eldriven fastback med Polestar-stjärna', icon: '⚡' },
      { title: 'Saab 900 / 9-3', hint: 'Trollhätte-ikon med flyginspirerad vindruta', icon: '🇸🇪' },
      { title: 'Porsche Macan / Cayenne', hint: 'Sport-SUV från Stuttgart med Porsche-vapen', icon: '🇩🇪' },
      { title: 'Porsche 911', hint: 'Klassisk svansmotor-ikon med runda grodögon', icon: '🇩🇪' },
      { title: 'Mini Cooper', hint: 'Modern brittisk ikon med runt formspråk', icon: '🇬🇧' },
      { title: 'Jeep Wrangler', hint: 'Klassisk amerikansk terrängbil med 7 ribbor i grillen', icon: '🇺🇸' },
      { title: 'Dacia Duster', hint: 'Prisvärd fyrhjulsdriven SUV', icon: '🇷🇴' },
      { title: 'Nissan Qashqai', hint: 'Pionjären bland kompakta japanska crossovers', icon: '🇯🇵' },
      { title: 'Peugeot 208 / 308', hint: 'Fransk bil med lejonemblemet i nosen', icon: '🇫🇷' },
      { title: 'Renault Clio', hint: 'Fransk småbil med den kromade romben i nosen', icon: '🇫🇷' },
      { title: 'Mazda MX-5 Miata', hint: 'Världens mest sålda tvåsitsiga sportbil', icon: '🇯🇵' },
      { title: 'Jänkare / Raggarbil', hint: 'Amerikansk 50-/60-tals klassiker med mullrande V8', icon: '🇺🇸' },
      { title: 'Subaru Outback', hint: 'Boxermotor och permanent symmetrisk fyrhjulsdrift', icon: '🇯🇵' },
      { title: 'Dodge RAM / Silverado', hint: 'Enorm amerikansk fullsize V8-pickup', icon: '🛻' },
      { title: 'Fiat 500', hint: 'Kompakt italiensk retro-småbil', icon: '🇮🇹' },
    ],
  },
];

/**
 * Slumpar fram ett givet antal unika föremål ur den valda kategorin.
 */
export function drawRandomTiles(
  categoryId: string = 'city',
  count: number = 9
): ThemeItem[] {
  const category = THEME_CATEGORIES.find(c => c.id === categoryId) || THEME_CATEGORIES[0];
  const pool = category.items;

  // Blanda med Fisher-Yates shuffle
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
