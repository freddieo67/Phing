export interface ThemeItem {
  title: string;  // Kortnamn som visas på spelbrickan (1-2 ord)
  hint?: string;  // Valfri beskrivning (om tom öppnas kameran direkt vid klick)
  icon: string;   // Emoji/flagga som visas i rutan
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
}

export interface ThemeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  type?: 'objects' | 'locations';
  items: ThemeItem[];
}

export const THEME_CATEGORIES: ThemeCategory[] = [
  // =========================================================================
  // 0. PLATSER & KROGAR: SÖDERMALM (Stockholm)
  // =========================================================================
  {
    id: 'sodermalm',
    name: 'Södermalm (Stockholm)',
    description: 'Torg, utsiktsplatser, parker och klassiska krogar på Söder!',
    icon: '📍',
    type: 'locations',
    items: [
      { title: 'Mariatorget', hint: 'Fontänen Tors fiske mitt i parken', icon: '📍', latitude: 59.3175, longitude: 18.0628, radius_meters: 50 },
      { title: 'Nytorget', hint: 'Parken och hjärtat av SoFo', icon: '📍', latitude: 59.3126, longitude: 18.0838, radius_meters: 50 },
      { title: 'Mosebacke torg', hint: 'Framför Södra Teatern och fontänen', icon: '📍', latitude: 59.3180, longitude: 18.0740, radius_meters: 50 },
      { title: 'Medborgarplatsen', hint: 'Mitt på torget framför trappan och Söderhallarna', icon: '📍', latitude: 59.3148, longitude: 18.0718, radius_meters: 50 },
      { title: 'Bofills båge', hint: 'Halvcirkeln i Fatbursparken vid Södra Station', icon: '📍', latitude: 59.3142, longitude: 18.0678, radius_meters: 50 },
      { title: 'Katarinahissen', hint: 'Katarinahissen vid Slussen', icon: '📍', latitude: 59.3197, longitude: 18.0722, radius_meters: 50 },
      { title: 'Skinnarviksberget', hint: 'Högsta utsiktspunkten över Riddarfjärden', icon: '📍', latitude: 59.3195, longitude: 18.0515, radius_meters: 50 },
      { title: 'Monteliusvägen', hint: 'Utsiktsbryggan vid Ivar Los park', icon: '📍', latitude: 59.3204, longitude: 18.0592, radius_meters: 50 },
      { title: 'Fjällgatan', hint: 'Utsiktsterrassen över Saltsjön och Djurgården', icon: '📍', latitude: 59.3172, longitude: 18.0865, radius_meters: 50 },
      { title: 'Sofia kyrka', hint: 'Kyrkan uppe på Vitabergsparkens topp', icon: '📍', latitude: 59.3120, longitude: 18.0886, radius_meters: 50 },
      { title: 'Tanto strandbad', hint: 'Badstranden och bryggorna i Tantolunden', icon: '📍', latitude: 59.3115, longitude: 18.0475, radius_meters: 50 },
      { title: 'Hornstulls torg', hint: 'Torget utanför tunnelbanan vid Hornstull', icon: '📍', latitude: 59.3160, longitude: 18.0345, radius_meters: 50 },
      { title: 'Pelikan', hint: 'Blekingegatan 40 – klassisk ölhall sedan 1700-talet', icon: '📍', latitude: 59.3106, longitude: 18.0762, radius_meters: 50 },
      { title: 'Gröne Jägaren', hint: 'Götgatan 64 – klassisk supporter- och ölkrog', icon: '📍', latitude: 59.3133, longitude: 18.0736, radius_meters: 50 },
      { title: 'Kvarnen', hint: 'Tjärhovsgatan 4 – anrik krog och ölhall vid Medis', icon: '📍', latitude: 59.3148, longitude: 18.0743, radius_meters: 50 },
      { title: 'Carmen', hint: 'Tjärhovsgatan 14 – kultpub vid Björns Trädgård', icon: '📍', latitude: 59.3151, longitude: 18.0759, radius_meters: 50 },
      { title: 'Akkurat', hint: 'Hornsgatan 18 – känd för öl- och whisky vid Bellmansgatan', icon: '📍', latitude: 59.3198, longitude: 18.0605, radius_meters: 50 },
      { title: 'Oliver Twist', hint: 'Repslagargatan 6 – brittisk ölpub vid Götgatsbacken', icon: '📍', latitude: 59.3183, longitude: 18.0697, radius_meters: 50 },
      { title: 'Urban Deli', hint: 'Nytorget 4 – hjärtat av SoFo', icon: '📍', latitude: 59.3125, longitude: 18.0825, radius_meters: 50 },
      { title: 'Tjoget', hint: 'Hornsbruksgatan 24 – prisbelönt cocktailbar vid Hornstull', icon: '📍', latitude: 59.3162, longitude: 18.0348, radius_meters: 50 },
      { title: 'Häktet', hint: 'Hornsgatan 82 – krog och bar i gamla 1700-talshäktet vid Bysis', icon: '📍', latitude: 59.3175, longitude: 18.0570, radius_meters: 50 },
      { title: 'Morfar Ginko', hint: 'Swedenborgsgatan 13 nära Södra station', icon: '📍', latitude: 59.3157, longitude: 18.0625, radius_meters: 50 },
      { title: 'Bleck', hint: 'Katarina Bangata 68 vid Lilla Blecktornsparken', icon: '📍', latitude: 59.3094, longitude: 18.0861, radius_meters: 50 },
      { title: 'Gondolen', hint: 'Stadsgården 6 – klassikern svävande över Slussen', icon: '📍', latitude: 59.3195, longitude: 18.0732, radius_meters: 50 },
      { title: 'Fåfängan', hint: 'Utsiktsberget och klocktornet i öster', icon: '📍', latitude: 59.3150, longitude: 18.1008, radius_meters: 50 },
      { title: 'Södermalmstorg', hint: 'Ryssgården och Stadsmuseet vid Slussen', icon: '📍', latitude: 59.3198, longitude: 18.0712, radius_meters: 50 },
      { title: 'Zinkensdamms IP', hint: 'Idrottsplatsen vid Ringvägen', icon: '📍', latitude: 59.3156, longitude: 18.0500, radius_meters: 50 },
      { title: 'Skanstulls torg', hint: 'Götgatan vid Ringen köpcentrum', icon: '📍', latitude: 59.3082, longitude: 18.0758, radius_meters: 50 },
      { title: 'Münchenbryggeriet', hint: 'Söder Mälarstrand 29', icon: '📍', latitude: 59.3207, longitude: 18.0539, radius_meters: 50 },
      { title: 'Långholmsbron', hint: 'Bron över till Långholmen vid Bergsunds strand', icon: '📍', latitude: 59.3193, longitude: 18.0281, radius_meters: 50 },
      { title: 'Stig Claessons park', hint: 'Parken vid Åsögatan och Beckbrännarbacken', icon: '📍', latitude: 59.3149, longitude: 18.0883, radius_meters: 50 },
      { title: 'Snövit', hint: 'Ringvägen 147 – anrik kultbar vid Skanstull', icon: '📍', latitude: 59.3090, longitude: 18.0822, radius_meters: 50 },
    ],
  },
  // =========================================================================
  // 1. STAD & TRAFIK (Allt blandat: stadsmiljö, detaljer och vardagliga fordon)
  // =========================================================================
  {
    id: 'city',
    name: 'Stad & Trafik',
    description: 'En härlig mix av stadsmiljö, detaljer, butiker, folk och fordon!',
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

      // --- Inmixade fordon ---
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
  // 2. BIL- & MC-MODELLER (Enskilda modeller utan beskrivningar – direktfoto!)
  // =========================================================================
  {
    id: 'vehicles_models',
    name: 'Bil- & MC-modeller',
    description: 'Över 110 enskilda modeller – massor av svenska favoriter och MC!',
    icon: '🏎️',
    items: [
      // --- Svenska bilar: Volvo ---
      { title: 'Volvo 240', icon: '🇸🇪' },
      { title: 'Volvo 740', icon: '🇸🇪' },
      { title: 'Volvo 940', icon: '🇸🇪' },
      { title: 'Volvo 850', icon: '🇸🇪' },
      { title: 'Volvo V70', icon: '🇸🇪' },
      { title: 'Volvo V60', icon: '🇸🇪' },
      { title: 'Volvo XC60', icon: '🇸🇪' },
      { title: 'Volvo XC40', icon: '🇸🇪' },
      { title: 'Volvo XC90', icon: '🇸🇪' },
      { title: 'Volvo V40', icon: '🇸🇪' },
      { title: 'Volvo V90', icon: '🇸🇪' },
      { title: 'Volvo S60', icon: '🇸🇪' },
      { title: 'Volvo S80', icon: '🇸🇪' },
      { title: 'Volvo C30', icon: '🇸🇪' },
      { title: 'Volvo Amazon', icon: '🇸🇪' },
      { title: 'Volvo PV 544', icon: '🇸🇪' },
      { title: 'Volvo Duett', icon: '🇸🇪' },

      // --- Svenska bilar: Saab ---
      { title: 'Saab 900', icon: '🇸🇪' },
      { title: 'Saab 9000', icon: '🇸🇪' },
      { title: 'Saab 9-3', icon: '🇸🇪' },
      { title: 'Saab 9-5', icon: '🇸🇪' },
      { title: 'Saab 99', icon: '🇸🇪' },
      { title: 'Saab 96', icon: '🇸🇪' },

      // --- Svenska bilar: Polestar ---
      { title: 'Polestar 2', icon: '⚡' },
      { title: 'Polestar 3', icon: '⚡' },
      { title: 'Polestar 4', icon: '⚡' },

      // --- Svenska MC & mopeder ---
      { title: 'Husqvarna Svartpilen', icon: '🇸🇪' },
      { title: 'Husqvarna Vitpilen', icon: '🇸🇪' },
      { title: 'Husqvarna 701', icon: '🇸🇪' },
      { title: 'Crescent Compact', icon: '🇸🇪' },
      { title: 'Puch Dakota', icon: '🛵' },

      // --- Tesla & Elbilar ---
      { title: 'Tesla Model Y', icon: '⚡' },
      { title: 'Tesla Model 3', icon: '⚡' },
      { title: 'Tesla Model S', icon: '⚡' },
      { title: 'Tesla Model X', icon: '⚡' },
      { title: 'VW ID.4', icon: '⚡' },
      { title: 'VW ID.3', icon: '⚡' },
      { title: 'Kia EV6', icon: '⚡' },
      { title: 'Hyundai Ioniq 5', icon: '⚡' },

      // --- Volkswagen & Skoda ---
      { title: 'VW Golf', icon: '🇩🇪' },
      { title: 'VW Passat', icon: '🇩🇪' },
      { title: 'VW Tiguan', icon: '🇩🇪' },
      { title: 'VW Polo', icon: '🇩🇪' },
      { title: 'VW Caddy', icon: '🚐' },
      { title: 'VW Transporter', icon: '🚐' },
      { title: 'VW Bubbla', icon: '🐞' },
      { title: 'Skoda Octavia', icon: '🇨🇿' },
      { title: 'Skoda Fabia', icon: '🇨🇿' },
      { title: 'Skoda Kodiaq', icon: '🇨🇿' },
      { title: 'Skoda Superb', icon: '🇨🇿' },

      // --- Toyota, Kia & Hyundai ---
      { title: 'Toyota RAV4', icon: '🇯🇵' },
      { title: 'Toyota Yaris', icon: '🇯🇵' },
      { title: 'Toyota Corolla', icon: '🇯🇵' },
      { title: 'Toyota Hilux', icon: '🛻' },
      { title: 'Toyota C-HR', icon: '🇯🇵' },
      { title: 'Kia Ceed', icon: '🇰🇷' },
      { title: 'Kia Niro', icon: '🇰🇷' },
      { title: 'Kia Sportage', icon: '🇰🇷' },
      { title: 'Hyundai Tucson', icon: '🇰🇷' },

      // --- BMW, Audi, Mercedes & Porsche ---
      { title: 'BMW 3-serie', icon: '🇩🇪' },
      { title: 'BMW 5-serie', icon: '🇩🇪' },
      { title: 'BMW 1-serie', icon: '🇩🇪' },
      { title: 'BMW X3', icon: '🇩🇪' },
      { title: 'BMW X5', icon: '🇩🇪' },
      { title: 'Audi A4', icon: '🇩🇪' },
      { title: 'Audi A6', icon: '🇩🇪' },
      { title: 'Audi A3', icon: '🇩🇪' },
      { title: 'Audi Q5', icon: '🇩🇪' },
      { title: 'Mercedes C-klass', icon: '🇩🇪' },
      { title: 'Mercedes E-klass', icon: '🇩🇪' },
      { title: 'Mercedes A-klass', icon: '🇩🇪' },
      { title: 'Mercedes GLC', icon: '🇩🇪' },
      { title: 'Porsche 911', icon: '🇩🇪' },
      { title: 'Porsche Macan', icon: '🇩🇪' },
      { title: 'Porsche Cayenne', icon: '🇩🇪' },

      // --- Övriga kända personbilar ---
      { title: 'Ford Mustang', icon: '🐎' },
      { title: 'Ford Focus', icon: '🇺🇸' },
      { title: 'Ford Transit', icon: '🚐' },
      { title: 'Mini Cooper', icon: '🇬🇧' },
      { title: 'Peugeot 208', icon: '🇫🇷' },
      { title: 'Renault Clio', icon: '🇫🇷' },
      { title: 'Fiat 500', icon: '🇮🇹' },
      { title: 'Jeep Wrangler', icon: '🇺🇸' },
      { title: 'Dacia Duster', icon: '🇷🇴' },
      { title: 'Mazda CX-5', icon: '🇯🇵' },
      { title: 'Mazda MX-5 Miata', icon: '🇯🇵' },
      { title: 'Subaru Outback', icon: '🇯🇵' },
      { title: 'Nissan Qashqai', icon: '🇯🇵' },

      // --- Motorcyklar & Scooters ---
      { title: 'BMW R 1250 GS', icon: '🏍️' },
      { title: 'Honda Africa Twin', icon: '🏍️' },
      { title: 'Yamaha Ténéré 700', icon: '🏍️' },
      { title: 'Suzuki V-Strom 650', icon: '🏍️' },
      { title: 'KTM 890 Adventure', icon: '🏍️' },
      { title: 'Honda Goldwing', icon: '🏍️' },
      { title: 'Yamaha MT-07', icon: '🏍️' },
      { title: 'Yamaha MT-09', icon: '🏍️' },
      { title: 'KTM 390 Duke', icon: '🏍️' },
      { title: 'Kawasaki Z900', icon: '🏍️' },
      { title: 'Honda CB650R', icon: '🏍️' },
      { title: 'Ducati Monster', icon: '🏍️' },
      { title: 'Triumph Street Triple', icon: '🏍️' },
      { title: 'Harley Sportster', icon: '🇺🇸' },
      { title: 'Harley Fat Boy', icon: '🇺🇸' },
      { title: 'Harley Street Glide', icon: '🇺🇸' },
      { title: 'Honda Rebel 500', icon: '🏍️' },
      { title: 'Kawasaki Ninja', icon: '🏍️' },
      { title: 'Yamaha YZF-R1', icon: '🏍️' },
      { title: 'Honda CBR1000RR', icon: '🏍️' },
      { title: 'BMW S 1000 RR', icon: '🏍️' },
      { title: 'Triumph Bonneville', icon: '🇬🇧' },
      { title: 'Vespa Primavera', icon: '🛵' },
    ],
  },

  // =========================================================================
  // 3. STANNFÅGLAR (Svenska stannfåglar & vintergäster)
  // =========================================================================
  {
    id: 'birds',
    name: 'Stannfåglar',
    description: '36 svenska fågelarter – spana i träd, buskar, vatten och fågelbord!',
    icon: '🐦',
    items: [
      { title: 'Björktrast', icon: '🐦' },
      { title: 'Blåmes', icon: '🐦' },
      { title: 'Domherre', icon: '🐦' },
      { title: 'Fasan', icon: '🪶' },
      { title: 'Fiskmås', icon: '🪶' },
      { title: 'Gråsparv', icon: '🐦' },
      { title: 'Gråtrut', icon: '🪶' },
      { title: 'Gräsand', icon: '🦆' },
      { title: 'Grönfink', icon: '🐦' },
      { title: 'Gröngöling', icon: '🪵' },
      { title: 'Gulsparv', icon: '🐦' },
      { title: 'Havsörn', icon: '🦅' },
      { title: 'Kaja', icon: '🐦' },
      { title: 'Kattuggla', icon: '🦉' },
      { title: 'Koltrast', icon: '🐦' },
      { title: 'Kråka', icon: '🐦' },
      { title: 'Kungsfågel', icon: '🐦' },
      { title: 'Nötskrika', icon: '🐦' },
      { title: 'Nötväcka', icon: '🐦' },
      { title: 'Orre', icon: '🪶' },
      { title: 'Pilfink', icon: '🐦' },
      { title: 'Sidensvans', icon: '🐦' },
      { title: 'Skata', icon: '🐦' },
      { title: 'Skrattmås', icon: '🪶' },
      { title: 'Sparvhök', icon: '🦅' },
      { title: 'Spillkråka', icon: '🪵' },
      { title: 'Stjärtmes', icon: '🐦' },
      { title: 'Strömstare', icon: '🌊' },
      { title: 'Större hackspett', icon: '🪵' },
      { title: 'Svartmes', icon: '🐦' },
      { title: 'Talgoxe', icon: '🐦' },
      { title: 'Tallbit', icon: '🐦' },
      { title: 'Tamduva', icon: '🕊️' },
      { title: 'Tjäder', icon: '🪶' },
      { title: 'Tofsmes', icon: '🐦' },
      { title: 'Trädkrypare', icon: '🪵' },
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
