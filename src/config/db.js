const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { createSlug } = require('../utils/helpers');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let dbCache = null;

/**
 * Domyślne dane startowe (Seed), dzięki którym strona po uruchomieniu jest kompletna
 */
function getInitialSeedData() {
  const initialUser = process.env.ADMIN_INITIAL_USER || 'admin';
  const initialPass = process.env.ADMIN_INITIAL_PASS || 'Admin123!';
  const passwordHash = bcrypt.hashSync(initialPass, 10);
  const demoAgentHash = bcrypt.hashSync('Agent123!', 10);

  return {
    users: [
      {
        id: 1,
        username: initialUser,
        passwordHash,
        role: 'admin',
        active: true,
        name: 'Marek Kowalski',
        title: 'Właściciel Biura · Licencjonowany Pośrednik',
        licenseNumber: 'Licencja PFRN nr 28491',
        phone: '+48 600 700 800',
        email: 'kontakt@kowalskinieruchomosci.pl',
        avatar: '/images/demo/agent-portrait.svg',
        bio: 'Założyciel biura z 11-letnim doświadczeniem w sprzedaży mieszkań, domów oraz gruntów inwestycyjnych.',
        createdAt: '2026-01-10T09:00:00.000Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        username: 'agent',
        passwordHash: demoAgentHash,
        role: 'agent',
        active: true,
        name: 'Karolina Nowak',
        title: 'Starszy Doradca ds. Nieruchomości',
        licenseNumber: 'Licencja PFRN nr 31045',
        phone: '+48 600 700 805',
        email: 'k.nowak@kowalskinieruchomosci.pl',
        avatar: '/images/demo/agent-female.svg',
        bio: 'Specjalistka ds. sprzedaży i wynajmu apartamentów, lokali komercyjnych oraz profesjonalnego Home Stagingu.',
        createdAt: '2026-03-15T10:00:00.000Z',
        updatedAt: new Date().toISOString()
      }
    ],
    settings: {
      brandName: 'Kowalski Nieruchomości',
      agentName: 'Marek Kowalski',
      agentRole: 'Licencjonowany Pośrednik w Obrocie Nieruchomościami',
      licenseNumber: 'Licencja PFRN nr 28491',
      agentPhoto: '/images/demo/agent-portrait.svg',
      heroBadge: 'Ekspert rynku nieruchomości premium i mieszkań',
      heroTitle: 'Skuteczna sprzedaż i bezpieczny zakup Twojej nieruchomości',
      heroSubtitle: 'Przeprowadzam klientów przez cały proces transakcji – od rzetelnej wyceny rynkowej, przez profesjonalny home staging i marketing, aż po bezpieczne przekazanie kluczy u notariusza.',
      heroImage: '/images/demo/hero-villa.svg',
      stats: [
        { value: '185+', label: 'Sprzedanych i wynajętych nieruchomości' },
        { value: '11 lat', label: 'Doświadczenia na rynku nieruchomości' },
        { value: '98%', label: 'Transakcji sfinalizowanych w cenie ofertowej' },
        { value: '39 dni', label: 'Średni czas sprzedaży nieruchomości' }
      ],
      about: {
        title: 'Twój zaufany doradca na każdym etapie transakcji',
        subtitle: 'Łączę znajomość lokalnego rynku, prawa nieruchomości i nowoczesnego marketingu, aby maksymalizować zysk i spokój moich klientów.',
        bioHtml: `<p>Nazywam się <strong>Marek Kowalski</strong> i od ponad 11 lat pomagam właścicielom mieszkań, domów oraz działek przejść przez proces sprzedaży i wynajmu bez stresu, ukrytych ryzyk i straty czasu.</p>
<p>Moja praca zaczyna się na długo przed publikacją ogłoszenia. Każdą nieruchomość dokładnie weryfikuję pod kątem prawnym, przygotowuję strategię cenową opartą o rzeczywiste ceny transakcyjne (a nie wyłącznie ofertowe) oraz organizuję profesjonalny <strong>home staging, sesję fotograficzną, ujęcia z drona i wirtualny spacer</strong>.</p>
<p>Wierzę w pełną przejrzystość: pracuję na jasnych zasadach, regularnie raportuję postępy i osobiście uczestniczę w każdej prezentacji oraz negocjacjach.</p>`,
        values: [
          {
            title: 'Bezpieczeństwo prawne i finansowe',
            description: 'Sprawdzam księgi wieczyste, podstawy nabycia, plany zagospodarowania oraz kompletuję wszystkie zaświadczenia do aktu notarialnego.'
          },
          {
            title: 'Marketing, który przyciąga kupujących',
            description: 'Profesjonalna fotografia wnętrz, filmy wideo, rzuty 2D/3D, promocja na wiodących portalach i w mediach społecznościowych.'
          },
          {
            title: 'Skuteczne negocjacje cenowe',
            description: 'Reprezentuję wyłącznie Twój interes przy stole negocjacyjnym, dbając o uzyskanie najwyższej możliwej ceny oraz bezpiecznych warunków płatności.'
          },
          {
            title: 'Oszczędność Twojego czasu',
            description: 'Weryfikuję dzwoniących klientów, odsiewam tzw. „turystów mieszkaniowych” i organizuję prezentacje tylko ze zdecydowanymi nabywcami.'
          }
        ]
      },
      contact: {
        phone: '+48 600 700 800',
        email: 'kontakt@kowalskinieruchomosci.pl',
        address: '',
        city: '',
        hideOffice: false,
        workingHours: 'Poniedziałek – Piątek: 9:00 – 19:00, Sobota: 10:00 – 15:00',
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        linkedin: 'https://linkedin.com',
        mapEmbedUrl: ''
      },
      seo: {
        siteTitle: 'Kowalski Nieruchomości – Licencjonowany Agent Nieruchomości',
        siteDescription: 'Profesjonalne pośrednictwo w sprzedaży, zakupie i wynajmie mieszkań, domów oraz działek. Sprawdź aktualne oferty nieruchomości.'
      }
    },
    services: [
      {
        id: 1,
        title: 'Pośrednictwo w sprzedaży nieruchomości',
        subtitle: 'Kompleksowa sprzedaż mieszkań, domów i apartamentów w najwyższej cenie rynkowej.',
        icon: 'home',
        description: 'Przejmuję na siebie cały proces sprzedaży – od analizy rynku i przygotowania nieruchomości, przez szeroką promocję, aż po negocjacje i podpisanie aktu notarialnego.',
        features: [
          'Rzetelna analiza porównawcza rynku i ustalenie optymalnej ceny ofertowej',
          'Weryfikacja i regulacja stanu prawnego księgi wieczystej oraz dokumentów',
          'Profesjonalna sesja zdjęciowa, film promocyjny i wirtualny spacer 360°',
          'Publikacja wyróżnionych ogłoszeń na Otodom, Morizon, Gratka, OLX i w Social Media',
          'Prezentacje nieruchomości w systemie Dni Otwartych oraz indywidualnych spotkań'
        ],
        order: 1
      },
      {
        id: 2,
        title: 'Obsługa wynajmu i najem okazjonalny',
        subtitle: 'Bezpieczny wynajem Twojego mieszkania sprawdzonym i zweryfikowanym najemcom.',
        icon: 'key',
        description: 'Chronię interesy właściciela poprzez weryfikację wypłacalności najemców, przygotowanie szczelnej umowy najmu okazjonalnego oraz protokołu zdawczo-odbiorczego z dokumentacją zdjęciową.',
        features: [
          'Selekcja i weryfikacja potencjalnych najemców',
          'Przygotowanie umowy najmu okazjonalnego z rygorem egzekucji u notariusza',
          'Szczegółowy protokół przekazania lokalu ze stanem liczników i zdjęciami',
          'Doradztwo w zakresie ubezpieczenia OC najemcy i właściciela'
        ],
        order: 2
      },
      {
        id: 3,
        title: 'Poszukiwanie nieruchomości na zlecenie',
        subtitle: 'Reprezentacja kupującego – znajdę dla Ciebie idealne mieszkanie, dom lub grunt.',
        icon: 'search',
        description: 'Nie trać dziesiątek godzin na przeglądanie nieaktualnych portali. Przeszukuję cały rynek (w tym oferty niepubliczne tzw. off-market), sprawdzam stan techniczny i prawny oraz negocjuję dla Ciebie niższą cenę zakupu.',
        features: [
          'Dostęp do ofert spod lady (off-market) zanim trafią na portale ogłoszeniowe',
          'Audyt stanu prawnego, księgi wieczystej, obciążeń i planów miejscowych (MPZP)',
          'Twarde negocjacje ceny zakupu (często oszczędność przewyższa wynagrodzenie agenta)',
          'Koordynacja współpracy z doradcą kredytowym, rzeczoznawcą i kancelarią notarialną'
        ],
        order: 3
      },
      {
        id: 4,
        title: 'Home Staging i przygotowanie wnętrz',
        subtitle: 'Wydobywamy pełen potencjał wizualny nieruchomości przed pierwszą wizytą klienta.',
        icon: 'sparkles',
        description: 'Pierwsze wrażenie decyduje o sprzedaży w ciągu pierwszych 30 sekund. Dzięki zmianie aranżacji, doborowi oświetlenia i dodatków nieruchomości sprzedają się średnio o 40% szybciej.',
        features: [
          'Konsultacja i szczegółowa lista zmian podnoszących wartość nieruchomości',
          'Depersonalizacja, odświeżenie wnętrza i aranżacja przestrzeni',
          'Wypożyczenie tekstyliów, dekoracji i oświetlenia na czas sesji i prezentacji',
          'Profesjonalna fotografia architektury oraz ujęcia z drona'
        ],
        order: 4
      },
      {
        id: 5,
        title: 'Sprzedaż działek i gruntów inwestycyjnych',
        subtitle: 'Analiza chłonności, MPZP, warunków zabudowy i uzbrojenia terenu.',
        icon: 'map',
        description: 'Sprzedaż gruntu wymaga wiedzy geodezyjnej i urbanistycznej. Przygotowuję kompletną teczkę inwestycyjną działki wraz z ujęciami z lotu ptaka i obrysem granic.',
        features: [
          'Analiza Miejscowego Planu Zagospodarowania Przestrzennego (MPZP) lub WZ',
          'Weryfikacja dostępu do drogi publicznej, mediów i klasyfikacji gruntów',
          'Zdjęcia i wideo z drona z naniesionym obrysem granic działki',
          'Dotarcie do inwestorów prywatnych oraz lokalnych deweloperów'
        ],
        order: 5
      },
      {
        id: 6,
        title: 'Wsparcie kredytowe i formalno-prawne',
        subtitle: 'Kompletna pomoc w uzyskaniu finansowania oraz skompletowaniu dokumentów do notariusza.',
        icon: 'shield',
        description: 'Współpracuję z niezależnymi ekspertami kredytowymi oraz sprawdzonymi kancelariami notarialnymi, dzięki czemu cała transakcja przebiega sprawnie i bez opóźnień.',
        features: [
          'Bezpłatne porównanie ofert kredytów hipotecznych z ponad 12 banków',
          'Pomoc w uzyskaniu zaświadczeń ze spółdzielni, urzędu skarbowego i gminy',
          'Negocjacja niższej taksy notarialnej dla moich klientów',
          'Asysta przy końcowym wydaniu nieruchomości i przepisaniu liczników'
        ],
        order: 6
      }
    ],
    properties: [
      {
        id: 1,
        title: 'Słoneczny apartament z tarasem i widokiem na park',
        slug: 'sloneczny-apartament-z-tarasem-i-widokiem-na-park',
        transactionType: 'sprzedaz',
        category: 'mieszkanie',
        status: 'dostepne',
        featured: true,
        price: 1190000,
        pricePerM2: 15256,
        area: 78,
        rooms: 3,
        floor: '4 / 5',
        buildYear: 2021,
        city: 'Warszawa',
        district: 'Mokotów, ul. Woronicza',
        address: 'ul. Jana Pawła Woronicza, Mokotów',
        images: [
          '/images/demo/prop-1.svg',
          '/images/demo/prop-3.svg',
          '/images/demo/hero-villa.svg'
        ],
        amenities: [
          'Taras 18 m²',
          'Miejsce w garażu podziemnym',
          'Klimatyzacja',
          'Komórka lokatorska',
          'Winda',
          'Osiedle strzeżone 24/7'
        ],
        description: `<p>Wyjątkowy, trójstronny apartament o powierzchni <strong>78 m²</strong> położony na 4. piętrze kameralnego budynku z 2021 roku na warszawskim Mokotowie.</p>
<p>Wnętrze zostało zaprojektowane przez architekta z wykorzystaniem naturalnego dębu, spieków kwarcowych oraz zabudowy stolarskiej wykonywanej na wymiar. Duże, panoramiczne okna zapewniają doskonałe doświetlenie przez cały dzień.</p>
<h3>Układ pomieszczeń:</h3>
<ul>
  <li>Przestronny salon z aneksem kuchennym i wyspą (32 m²) oraz wyjściem na słoneczny taras (18 m²),</li>
  <li>Główna sypialnia master z prywatną garderobą (17 m²),</li>
  <li>Drugi pokój idealny jako gabinet lub pokój dziecięcy (13 m²),</li>
  <li>Łazienka z wanną wolnostojącą i strefą prysznica walk-in (8 m²),</li>
  <li>Hol z pojemnymi szafami w zabudowie oraz pralnią (8 m²).</li>
</ul>
<p>Stan prawny: <strong>pełna własność z Księgą Wieczystą</strong> bez żadnych obciążeń – możliwość posiłkowania się kredytem hipotecznym.</p>`,
        createdAt: '2026-10-15T10:00:00.000Z'
      },
      {
        id: 2,
        title: 'Nowoczesny dom pod miastem z ogrodem i pompą ciepła',
        slug: 'nowoczesny-dom-pod-miastem-z-ogrodem-i-pompa-ciepla',
        transactionType: 'sprzedaz',
        category: 'dom',
        status: 'dostepne',
        featured: true,
        price: 1650000,
        pricePerM2: 9939,
        area: 166,
        rooms: 5,
        floor: 'Parter + poddasze',
        buildYear: 2023,
        city: 'Konstancin-Jeziorna',
        district: 'Strefa B, blisko Lasu Kabackiego',
        address: 'Konstancin-Jeziorna, okolice ul. Warszawskiej',
        images: [
          '/images/demo/prop-2.svg',
          '/images/demo/hero-villa.svg',
          '/images/demo/prop-1.svg'
        ],
        amenities: [
          'Działka 850 m²',
          'Pompa ciepła + fotowoltaika',
          'Rekuperacja',
          'Garaż dwustanowiskowy',
          'Ogrzewanie podłogowe',
          'System nawadniania ogrodu'
        ],
        description: `<p>Energooszczędny dom wolnostojący w stylistyce nowoczesnej stodoły o powierzchni użytkowej <strong>166 m²</strong>, posadowiony na pięknie zagospodarowanej działce o powierzchni <strong>850 m²</strong>.</p>
<p>Budynek wyposażony w pompę ciepła, instalację fotowoltaiczną 8 kWp oraz rekuperację, co przekłada się na minimalne koszty utrzymania przez cały rok.</p>
<h3>Atuty nieruchomości:</h3>
<ul>
  <li>Ponadnormatywne przeszklenia aluminiowe HS z wyjściem na drewniany taras z pergolą,</li>
  <li>Salon z antresolą o wysokości 5,8 m oraz kominkiem,</li>
  <li>4 ustawne sypialnie i 2 pełne łazienki,</li>
  <li>Garaż dwustanowiskowy w bryle budynku z ładowarką Wallbox do aut elektrycznych.</li>
</ul>`,
        createdAt: '2026-10-18T12:30:00.000Z'
      },
      {
        id: 3,
        title: 'Dwupoziomowy penthouse z prywatnym tarasem na dachu',
        slug: 'dwupoziomowy-penthouse-z-prywatnym-tarasem-na-dachu',
        transactionType: 'wynajem',
        category: 'mieszkanie',
        status: 'dostepne',
        featured: true,
        price: 9500,
        pricePerM2: 86,
        area: 110,
        rooms: 4,
        floor: '7 / 7',
        buildYear: 2022,
        city: 'Warszawa',
        district: 'Śródmieście / Powiśle',
        address: 'Powiśle, blisko Bulwarów Wiślanych',
        images: [
          '/images/demo/prop-3.svg',
          '/images/demo/prop-1.svg'
        ],
        amenities: [
          'Taras na dachu 45 m²',
          '2 miejsca postojowe',
          'Klimatyzacja w każdym pokoju',
          'Smart Home KNX',
          'Recepcja w budynku'
        ],
        description: `<p>Do wynajęcia reprezentacyjny, w pełni umeblowany penthouse o powierzchni <strong>110 m²</strong> na zielonym Powiślu. Mieszkanie oferuje panoramiczny widok na centrum miasta oraz prywatny taras wypoczynkowy na dachu.</p>
<p>Cena najmu: <strong>9 500 zł / mies.</strong> + czynsz administracyjny (1 450 zł). W cenie zawarte są dwa miejsca postojowe w garażu podziemnym.</p>`,
        createdAt: '2026-10-20T09:15:00.000Z'
      },
      {
        id: 4,
        title: 'Uzbrojona działka budowlana pod lasem (MPZP)',
        slug: 'uzbrojona-dzialka-budowlana-pod-lasem-mpzp',
        transactionType: 'sprzedaz',
        category: 'dzialka',
        status: 'dostepne',
        featured: false,
        price: 540000,
        pricePerM2: 372,
        area: 1450,
        rooms: 0,
        floor: '-',
        buildYear: 2026,
        city: 'Józefów',
        district: 'Michalin',
        address: 'Józefów, rej. ul. Granicznej',
        images: [
          '/images/demo/prop-4.svg'
        ],
        amenities: [
          'Aktualny MPZP (MN)',
          'Prąd, gaz, woda, kanalizacja w drodze',
          'Kształt: prostokąt 32x45 m',
          'Bezpośredni dostęp do drogi gminnej'
        ],
        description: `<p>Kształtna działka budowlana o powierzchni <strong>1 450 m²</strong> położona w cichej, willowej części Józefowa w otoczeniu starodrzewu sosnowego.</p>
<p>Teren objęty Miejscowym Planem Zagospodarowania Przestrzennego pod zabudowę mieszkaniową jednorodzinną (symbol MN). Wszystkie media miejskie znajdują się bezpośrednio w oświetlonej drodze przy granicy działki.</p>`,
        createdAt: '2026-10-22T14:00:00.000Z'
      },
      {
        id: 5,
        title: 'Narożny lokal użytkowy z dużymi witrynami przy głównej ulicy',
        slug: 'narozny-lokal-uzytkowy-z-duzymi-witrynami',
        transactionType: 'wynajem',
        category: 'lokal',
        status: 'zarezerwowane',
        featured: false,
        price: 7900,
        pricePerM2: 92,
        area: 86,
        rooms: 3,
        floor: 'Parter (witryna)',
        buildYear: 2020,
        city: 'Warszawa',
        district: 'Wola, ul. Kasprzaka',
        address: 'Wola, ciąg pieszy nowego osiedla',
        images: [
          '/images/demo/prop-5.svg'
        ],
        amenities: [
          'Narożne witryny z 2 stron',
          'Zgoda na sprzedaż alkoholu i gastronomię',
          'Wentylacja mechaniczna i klimatyzacja',
          'Wysokość lokalu 3,85 m'
        ],
        description: `<p>Doskonale wyeksponowany lokal usługowo-handlowy na parterze nowoczesnego apartamentowca w sercu dynamicznie rozwijającej się Woli (w bezpośrednim sąsiedztwie ponad 3 500 mieszkań).</p>
<p>Idealny pod kancelarię, gabinet medyczny/kosmetyczny, showroom lub kawiarnię.</p>`,
        createdAt: '2026-10-25T16:40:00.000Z'
      },
      {
        id: 6,
        title: 'Klimatyczne mieszkanie w odrestaurowanej kamienicy',
        slug: 'klimatyczne-mieszkanie-w-odrestaurowanej-kamienicy',
        transactionType: 'sprzedaz',
        category: 'mieszkanie',
        status: 'sprzedane',
        featured: false,
        price: 895000,
        pricePerM2: 16574,
        area: 54,
        rooms: 2,
        floor: '2 / 4',
        buildYear: 1936,
        city: 'Warszawa',
        district: 'Stary Żoliborz',
        address: 'Stary Żoliborz, blisko Placu Wilsona',
        images: [
          '/images/demo/prop-6.svg'
        ],
        amenities: [
          'Wysokość sufitów 3,20 m',
          'Oryginalny parkiet dębowy',
          'Balkon francuski',
          '3 minuty do stacji metra',
          'Duża piwnica 9 m²'
        ],
        description: `<p>Dwupokojowe mieszkanie z duszą w przedwojennej kamienicy po generalnej rewitalizacji na Starym Żoliborzu. Nieruchomość została sprzedana po pierwszym Dniu Otwartym.</p>`,
        createdAt: '2026-10-10T08:00:00.000Z'
      }
    ],
    posts: [
      {
        id: 1,
        title: 'Jak przygotować mieszkanie do sprzedaży, aby podnieść jego wartość o 10%?',
        slug: 'jak-przygotowac-mieszkanie-do-sprzedazy-home-staging',
        category: 'Poradnik sprzedającego',
        excerpt: 'Sprawdź, jakie proste zabiegi z zakresu home stagingu sprawiają, że kupujący zakochują się w mieszkaniu od pierwszego wejścia i są skłonni zapłacić pełną cenę ofertową.',
        coverImage: '/images/demo/prop-1.svg',
        published: true,
        createdAt: '2026-10-12T10:00:00.000Z',
        content: `<p>Wielu właścicieli mieszkań wychodzi z założenia, że „kupujący i tak urządzi sobie wszystko po swojemu”. W praktyce jednak <strong>ponad 85% osób kupujących nieruchomość nie potrafi zwizualizować sobie potencjału zagraconego lub ciemnego wnętrza</strong>.</p>
<h3>1. Depersonalizacja i odgracenie przestrzeni</h3>
<p>Pierwszym krokiem przed sesją zdjęciową jest schowanie osobistych pamiątek, nadmiaru ubrań na wieszakach, magnesów z lodówki czy kosmetyków w łazience. Kupujący podczas prezentacji powinien wyobrażać sobie w tym miejscu <em>swoje przyszłe życie</em>, a nie czuć się gościem w czyimś domu.</p>
<h3>2. Światło i jasna kolorystyka</h3>
<p>Jasne wnętrza wydają się większe i czystsze. Przed wystawieniem oferty warto odświeżyć ściany w neutralnych barwach (złamana biel, jasny beż), umyć okna oraz zadbać o ciepłe oświetlenie punktowe w każdym pomieszczeniu.</p>
<h3>3. Drobne naprawy techniczne</h3>
<p>Skrzypiąca klamka, luźne gniazdko czy przepalona żarówka dają kupującemu sygnał, że nieruchomość była zaniedbana – co natychmiast staje się pretekstem do zbijania ceny o kilkanaście lub kilkadziesiąt tysięcy złotych.</p>
<h3>4. Profesjonalna sesja fotograficzna</h3>
<p>Nawet najlepiej przygotowane mieszkanie przepadnie w gąszczu ogłoszeń, jeśli zdjęcia zostaną zrobione telefonem pod światło. Jako agent zapewniam w ramach współpracy profesjonalną sesję szerokokątną oraz rzut 2D/3D, dzięki którym ogłoszenie generuje nawet 3-krotnie więcej zapytań.</p>`
      },
      {
        id: 2,
        title: 'Umowa na wyłączność z agentem nieruchomości – dlaczego najbardziej opłaca się sprzedającemu?',
        slug: 'umowa-na-wylacznosc-z-agentem-nieruchomosci-korzysci',
        category: 'Rynek nieruchomości',
        excerpt: 'Czy zgłoszenie mieszkania do dziesięciu biur naraz przyspiesza sprzedaż? Wyjaśniam, dlaczego jedna dobrze prowadzona oferta osiąga wyższą cenę transakcyjną.',
        coverImage: '/images/demo/prop-2.svg',
        published: true,
        createdAt: '2026-10-20T14:20:00.000Z',
        content: `<p>Właściciele często sądzą, że podpisanie umów otwartych z pięcioma różnymi agencjami zwiększy ich szanse na sprzedaż. W rzeczywistości efekt jest dokładnie odwrotny: <strong>ta sama oferta pojawia się na portalu wielokrotnie, z różnymi cenami, nieaktualnymi opisami i przypadkowymi zdjęciami</strong>.</p>
<h3>Co daje Ci umowa na wyłączność?</h3>
<ul>
  <li><strong>Jeden odpowiedzialny opiekun oferty:</strong> wiesz dokładnie, kto odpowiada za wynik, odbiera telefony i raportuje postępy.</li>
  <li><strong>Pełen budżet marketingowy:</strong> mając gwarancję współpracy, inwestuję w Twoją nieruchomość własne środki – sesję zdjęciową, wideo z drona, home staging i wyróżnienia na portalach.</li>
  <li><strong>Współpraca z całym rynkiem (MLS):</strong> wyłączność nie zamyka oferty! Udostępniam ją wszystkim sprawdzonym pośrednikom w mieście, którzy przyprowadzają swoich klientów kupujących.</li>
  <li><strong>Spójna strategia cenowa:</strong> brak chaosu informacyjnego buduje prestiż nieruchomości w oczach kupujących i chroni cenę podczas negocjacji.</li>
</ul>`
      },
      {
        id: 3,
        title: 'Zakup mieszkania z rynku wtórnego – lista dokumentów do sprawdzenia przed wizytą u notariusza',
        slug: 'zakup-mieszkania-z-rynku-wtornego-lista-dokumentow',
        category: 'Bezpieczeństwo prawne',
        excerpt: 'Zanim podpiszesz umowę przedwstępną i wpłacisz zadatek, upewnij się, że stan prawny nieruchomości nie kryje niespodzianek.',
        coverImage: '/images/demo/blog-cover.svg',
        published: true,
        createdAt: '2026-10-28T09:00:00.000Z',
        content: `<p>Zakup nieruchomości to często największa decyzja finansowa w życiu. Aby transakcja była w 100% bezpieczna, konieczna jest szczegółowa weryfikacja dokumentów jeszcze przed przekazaniem zadatku.</p>
<h3>Kluczowe dokumenty do weryfikacji:</h3>
<ol>
  <li><strong>Numer Księgi Wieczystej (działy I–IV):</strong> sprawdzamy nie tylko obecne wpisy, ale również tzw. wzmianki o złożonych wnioskach, służebności osobiste oraz hipoteki.</li>
  <li><strong>Podstawa nabycia:</strong> akt notarialny zakupu, darowizny lub prawomocne postanowienie o stwierdzeniu nabycia spadku (wraz z zaświadczeniem z Urzędu Skarbowego o uregulowaniu podatku od spadków i darowizn).</li>
  <li><strong>Zaświadczenie o braku osób zameldowanych</strong> w lokalu.</li>
  <li><strong>Zaświadczenie ze spółdzielni lub wspólnoty mieszkaniowej</strong> o braku zaległości w opłatach eksploatacyjnych i funduszu remontowym.</li>
</ol>`
      }
    ],
    messages: [
      {
        id: 1,
        name: 'Michał Jabłoński',
        email: 'm.jablonski@example.com',
        phone: '+48 501 234 567',
        subject: 'Zapytanie o współpracę przy sprzedaży mieszkania',
        propertyTitle: '',
        message: 'Dzień dobry Panie Marku, planuję sprzedaż 3-pokojowego mieszkania na Ursynowie (64 m²). Chciałbym umówić się na bezpłatną konsultację i wycenę w przyszłym tygodniu.',
        read: false,
        createdAt: '2026-11-02T11:20:00.000Z'
      }
    ]
  };
}

/**
 * Inicjalizuje bazę danych (tworzy katalog i plik data/db.json, jeśli nie istnieje)
 */
function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = getInitialSeedData();
    saveDatabase(seed);
    dbCache = seed;
  } else {
    loadDatabase();
  }
}

function loadDatabase() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    dbCache = migrateDatabase(JSON.parse(raw));
  } catch (err) {
    console.error('[DB] Błąd odczytu bazy danych, inicjalizuję domyślną:', err.message);
    dbCache = getInitialSeedData();
    saveDatabase(dbCache);
  }
  return dbCache;
}

/**
 * Automatyczna migracja bazy danych do wersji wieloagentowej (Role: admin / agent)
 */
function migrateDatabase(db) {
  let changed = false;
  if (!Array.isArray(db.users)) {
    db.users = getInitialSeedData().users;
    changed = true;
  }

  // Uzupełnij brakujące pola profilowe i role istniejących użytkowników
  db.users.forEach((u, idx) => {
    if (!u.role) {
      u.role = idx === 0 ? 'admin' : 'agent';
      changed = true;
    }
    if (u.active === undefined) {
      u.active = true;
      changed = true;
    }
    if (!u.name || u.name === 'Właściciel strony') {
      u.name = db.settings?.agentName || 'Marek Kowalski';
      changed = true;
    }
    if (!u.title) {
      u.title = u.role === 'admin'
        ? 'Właściciel Biura · Licencjonowany Pośrednik'
        : 'Doradca ds. Nieruchomości';
      changed = true;
    }
    if (u.licenseNumber === undefined) {
      u.licenseNumber = u.role === 'admin' ? (db.settings?.licenseNumber || 'Licencja PFRN nr 28491') : '';
      changed = true;
    }
    if (u.phone === undefined) {
      u.phone = u.role === 'admin' ? (db.settings?.contact?.phone || '+48 600 700 800') : '';
      changed = true;
    }
    if (u.email === undefined) {
      u.email = u.role === 'admin' ? (db.settings?.contact?.email || 'kontakt@kowalskinieruchomosci.pl') : '';
      changed = true;
    }
    if (!u.avatar) {
      u.avatar = u.role === 'admin'
        ? (db.settings?.agentPhoto || '/images/demo/agent-portrait.svg')
        : '/images/demo/agent-female.svg';
      changed = true;
    }
    if (u.bio === undefined) {
      u.bio = 'Doświadczony doradca przeprowadzający klientów bezpiecznie przez proces sprzedaży i zakupu nieruchomości.';
      changed = true;
    }
  });

  // Jeśli w bazie był tylko 1 domyślny użytkownik i żadna oferta nie miała jeszcze authorId, dodaj przykładowego agenta
  const hadAuthorIds = (db.properties || []).some((p) => p.authorId !== undefined);
  if (db.users.length === 1 && !hadAuthorIds) {
    db.users.push({
      id: 2,
      username: 'agent',
      passwordHash: bcrypt.hashSync('Agent123!', 10),
      role: 'agent',
      active: true,
      name: 'Karolina Nowak',
      title: 'Starszy Doradca ds. Nieruchomości',
      licenseNumber: 'Licencja PFRN nr 31045',
      phone: '+48 600 700 805',
      email: 'k.nowak@kowalskinieruchomosci.pl',
      avatar: '/images/demo/agent-female.svg',
      bio: 'Specjalistka ds. sprzedaży i wynajmu apartamentów, lokali komercyjnych oraz profesjonalnego Home Stagingu.',
      createdAt: '2026-03-15T10:00:00.000Z',
      updatedAt: new Date().toISOString()
    });
    changed = true;
  }

  // Przypisz authorId do nieruchomości (oferty #3 i #5 do agenta #2 jeśli istnieje)
  (db.properties || []).forEach((p) => {
    if (!p.authorId) {
      const hasAgent2 = db.users.some((u) => Number(u.id) === 2);
      p.authorId = hasAgent2 && (Number(p.id) === 3 || Number(p.id) === 5) ? 2 : 1;
      changed = true;
    }
  });

  // Przypisz authorId do wpisów na blogu
  (db.posts || []).forEach((post) => {
    if (!post.authorId) {
      const hasAgent2 = db.users.some((u) => Number(u.id) === 2);
      post.authorId = hasAgent2 && Number(post.id) === 2 ? 2 : 1;
      changed = true;
    }
  });

  // Przypisz agentId do wiadomości
  (db.messages || []).forEach((msg) => {
    if (msg.agentId === undefined) {
      msg.agentId = 1;
      changed = true;
    }
  });

  if (db.settings && db.settings.testimonials !== undefined) {
    delete db.settings.testimonials;
    changed = true;
  }

  if (db.settings?.about && db.settings.about.certifications !== undefined) {
    delete db.settings.about.certifications;
    changed = true;
  }

  if (changed) {
    saveDatabase(db);
  }
  return db;
}

function saveDatabase(data) {
  dbCache = data;
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, DB_FILE);
}

function getDb() {
  if (!dbCache) {
    return loadDatabase();
  }
  return dbCache;
}

function nextId(collection) {
  if (!Array.isArray(collection) || collection.length === 0) return 1;
  return Math.max(...collection.map((item) => Number(item.id) || 0)) + 1;
}

function ensureUniqueSlug(collection, baseText, ignoreId = null) {
  let baseSlug = createSlug(baseText) || `element-${Date.now()}`;
  let slug = baseSlug;
  let counter = 2;
  while (collection.some((item) => item.slug === slug && Number(item.id) !== Number(ignoreId))) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
  return slug;
}

// ==================== UŻYTKOWNICY I AGENCI (AUTH & ZESPÓŁ) ====================
function getUsers({ activeOnly = false } = {}) {
  const db = getDb();
  let list = [...(db.users || [])];
  if (activeOnly) {
    list = list.filter((u) => u.active !== false);
  }
  return list;
}

function findUserByUsername(username) {
  const db = getDb();
  return db.users.find((u) => u.username.toLowerCase() === String(username || '').trim().toLowerCase());
}

function findUserById(id) {
  const db = getDb();
  return db.users.find((u) => Number(u.id) === Number(id));
}

function getAuthorForResource(resource) {
  const db = getDb();
  const authorId = resource && resource.authorId ? Number(resource.authorId) : 1;
  const found = db.users.find((u) => Number(u.id) === authorId);
  if (found) return found;
  return db.users[0] || {
    id: 1,
    name: db.settings?.agentName || 'Agent nieruchomości',
    title: db.settings?.agentRole || 'Pośrednik nieruchomości',
    licenseNumber: db.settings?.licenseNumber || '',
    phone: db.settings?.contact?.phone || '',
    email: db.settings?.contact?.email || '',
    avatar: db.settings?.agentPhoto || '/images/demo/agent-portrait.svg',
    bio: ''
  };
}

function createUser(data) {
  const db = getDb();
  const username = String(data.username || '').trim();
  if (!username) {
    throw new Error('Login użytkownika jest wymagany.');
  }
  if (findUserByUsername(username)) {
    throw new Error('Użytkownik o takim loginie już istnieje.');
  }

  const rawPass = String(data.password || '').trim() || 'Agent123!';
  const user = {
    id: nextId(db.users),
    username,
    passwordHash: bcrypt.hashSync(rawPass, 10),
    role: data.role === 'admin' ? 'admin' : 'agent',
    active: data.active !== undefined ? Boolean(data.active) : true,
    name: (data.name || username).trim(),
    title: (data.title || (data.role === 'admin' ? 'Właściciel · Pośrednik' : 'Doradca ds. Nieruchomości')).trim(),
    licenseNumber: (data.licenseNumber || '').trim(),
    phone: (data.phone || '').trim(),
    email: (data.email || '').trim(),
    avatar: data.avatar || '/images/demo/agent-female.svg',
    bio: (data.bio || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.push(user);
  saveDatabase(db);
  return user;
}

function updateUser(userId, data) {
  const db = getDb();
  const user = db.users.find((u) => Number(u.id) === Number(userId));
  if (!user) return null;

  if (data.username && data.username.trim()) {
    const cleanUsername = data.username.trim();
    const conflict = db.users.find(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() && Number(u.id) !== Number(userId)
    );
    if (conflict) {
      throw new Error('Wybrany login jest już zajęty przez innego agenta.');
    }
    user.username = cleanUsername;
  }

  if (data.newPassword && String(data.newPassword).trim()) {
    user.passwordHash = bcrypt.hashSync(String(data.newPassword).trim(), 10);
  }

  if (data.role === 'admin' || data.role === 'agent') {
    // Nie pozwól odebrać uprawnień jedynemu aktywnemu adminowi
    const activeAdmins = db.users.filter((u) => u.role === 'admin' && u.active !== false);
    if (user.role === 'admin' && data.role !== 'admin' && activeAdmins.length <= 1) {
      throw new Error('Nie można zmienić roli jedynemu administratorowi systemu.');
    }
    user.role = data.role;
  }

  if (data.active !== undefined) {
    const activeAdmins = db.users.filter((u) => u.role === 'admin' && u.active !== false);
    if (user.role === 'admin' && !data.active && activeAdmins.length <= 1) {
      throw new Error('Nie można zablokować konta jedynego aktywnego administratora.');
    }
    user.active = Boolean(data.active);
  }

  if (data.name !== undefined) user.name = data.name.trim();
  if (data.title !== undefined) user.title = data.title.trim();
  if (data.licenseNumber !== undefined) user.licenseNumber = data.licenseNumber.trim();
  if (data.phone !== undefined) user.phone = data.phone.trim();
  if (data.email !== undefined) user.email = data.email.trim();
  if (data.avatar) user.avatar = data.avatar;
  if (data.bio !== undefined) user.bio = data.bio.trim();

  user.updatedAt = new Date().toISOString();

  // Jeśli edytowany jest główny właściciel (id === 1), zsynchronizuj też podstawową wizytówkę w settings
  if (Number(user.id) === 1 && db.settings) {
    db.settings.agentName = user.name || db.settings.agentName;
    if (user.avatar) db.settings.agentPhoto = user.avatar;
  }

  saveDatabase(db);
  return user;
}

function updateUserCredentials(userId, { username, newPassword }) {
  return updateUser(userId, { username, newPassword });
}

function deleteUser(userId, fallbackUserId = 1) {
  const db = getDb();
  const target = findUserById(userId);
  if (!target) return null;

  const activeAdmins = db.users.filter((u) => u.role === 'admin' && u.active !== false);
  if (target.role === 'admin' && activeAdmins.length <= 1) {
    throw new Error('Nie można usunąć jedynego administratora.');
  }

  const safeFallbackId = Number(fallbackUserId) === Number(userId)
    ? (db.users.find((u) => Number(u.id) !== Number(userId))?.id || 1)
    : Number(fallbackUserId);

  // Przepisz oferty, artykuły i wiadomości usuwanego agenta na konto administratora
  (db.properties || []).forEach((p) => {
    if (Number(p.authorId) === Number(userId)) {
      p.authorId = safeFallbackId;
    }
  });
  (db.posts || []).forEach((post) => {
    if (Number(post.authorId) === Number(userId)) {
      post.authorId = safeFallbackId;
    }
  });
  (db.messages || []).forEach((msg) => {
    if (Number(msg.agentId) === Number(userId)) {
      msg.agentId = safeFallbackId;
    }
  });

  db.users = db.users.filter((u) => Number(u.id) !== Number(userId));
  saveDatabase(db);
  return target;
}

// ==================== USTAWIENIA STRONY / O MNIE / KONTAKT ====================
function getSettings() {
  return getDb().settings;
}

function updateSettings(newSettings) {
  const db = getDb();
  db.settings = {
    ...db.settings,
    ...newSettings
  };
  saveDatabase(db);
  return db.settings;
}

// ==================== USŁUGI (ZAKŁADKA OFERTA) ====================
function getServices() {
  const db = getDb();
  return [...(db.services || [])].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

function getServiceById(id) {
  return getDb().services.find((s) => Number(s.id) === Number(id));
}

function createService(data) {
  const db = getDb();
  const service = {
    id: nextId(db.services),
    title: data.title || 'Nowa usługa',
    subtitle: data.subtitle || '',
    icon: data.icon || 'home',
    description: data.description || '',
    features: Array.isArray(data.features) ? data.features : [],
    order: Number(data.order) || db.services.length + 1
  };
  db.services.push(service);
  saveDatabase(db);
  return service;
}

function updateService(id, data) {
  const db = getDb();
  const idx = db.services.findIndex((s) => Number(s.id) === Number(id));
  if (idx === -1) return null;
  db.services[idx] = {
    ...db.services[idx],
    title: data.title ?? db.services[idx].title,
    subtitle: data.subtitle ?? db.services[idx].subtitle,
    icon: data.icon ?? db.services[idx].icon,
    description: data.description ?? db.services[idx].description,
    features: Array.isArray(data.features) ? data.features : db.services[idx].features,
    order: data.order !== undefined ? Number(data.order) : db.services[idx].order
  };
  saveDatabase(db);
  return db.services[idx];
}

function deleteService(id) {
  const db = getDb();
  const before = db.services.length;
  db.services = db.services.filter((s) => Number(s.id) !== Number(id));
  if (db.services.length !== before) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// ==================== NIERUCHOMOŚCI ====================
function getProperties(filters = {}) {
  const db = getDb();
  let list = [...(db.properties || [])];

  if (filters.authorId && !isNaN(Number(filters.authorId))) {
    list = list.filter((p) => Number(p.authorId || 1) === Number(filters.authorId));
  }
  if (filters.transactionType) {
    list = list.filter((p) => p.transactionType === filters.transactionType);
  }
  if (filters.category) {
    list = list.filter((p) => p.category === filters.category);
  }
  if (filters.status) {
    list = list.filter((p) => p.status === filters.status);
  }
  if (filters.featuredOnly) {
    list = list.filter((p) => Boolean(p.featured));
  }
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter((p) =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.district && p.district.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q))
    );
  }
  if (filters.minPrice && !isNaN(Number(filters.minPrice))) {
    list = list.filter((p) => Number(p.price) >= Number(filters.minPrice));
  }
  if (filters.maxPrice && !isNaN(Number(filters.maxPrice))) {
    list = list.filter((p) => Number(p.price) <= Number(filters.maxPrice));
  }
  if (filters.minArea && !isNaN(Number(filters.minArea))) {
    list = list.filter((p) => Number(p.area) >= Number(filters.minArea));
  }
  if (filters.rooms && !isNaN(Number(filters.rooms))) {
    const r = Number(filters.rooms);
    if (r >= 4) {
      list = list.filter((p) => Number(p.rooms) >= 4);
    } else {
      list = list.filter((p) => Number(p.rooms) === r);
    }
  }

  // Sortowanie
  const sort = filters.sort || 'newest';
  if (sort === 'price_asc') {
    list.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === 'price_desc') {
    list.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sort === 'area_desc') {
    list.sort((a, b) => Number(b.area) - Number(a.area));
  } else {
    // Domyślnie: dostępne i wyróżnione wyżej, a następnie najnowsze
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  return list;
}

function getPropertyBySlug(slug) {
  return getDb().properties.find((p) => p.slug === slug);
}

function getPropertyById(id) {
  return getDb().properties.find((p) => Number(p.id) === Number(id));
}

function createProperty(data) {
  const db = getDb();
  const price = Number(data.price) || 0;
  const area = Number(data.area) || 0;
  const pricePerM2 = Number(data.pricePerM2) || (area > 0 ? Math.round(price / area) : 0);

  const property = {
    id: nextId(db.properties),
    authorId: Number(data.authorId) || 1,
    title: data.title || 'Nowa oferta nieruchomości',
    slug: ensureUniqueSlug(db.properties, data.title || 'nieruchomosc'),
    transactionType: data.transactionType || 'sprzedaz',
    category: data.category || 'mieszkanie',
    status: data.status || 'dostepne',
    featured: Boolean(data.featured),
    price,
    pricePerM2,
    area,
    rooms: Number(data.rooms) || 0,
    floor: data.floor || '-',
    buildYear: Number(data.buildYear) || new Date().getFullYear(),
    city: data.city || '',
    district: data.district || '',
    address: data.address || '',
    images: Array.isArray(data.images) && data.images.length > 0 ? data.images : ['/images/demo/prop-1.svg'],
    amenities: Array.isArray(data.amenities) ? data.amenities : [],
    description: data.description || '',
    createdAt: new Date().toISOString()
  };

  db.properties.unshift(property);
  saveDatabase(db);
  return property;
}

function updateProperty(id, data) {
  const db = getDb();
  const idx = db.properties.findIndex((p) => Number(p.id) === Number(id));
  if (idx === -1) return null;

  const current = db.properties[idx];
  const title = data.title || current.title;
  const price = data.price !== undefined ? Number(data.price) : current.price;
  const area = data.area !== undefined ? Number(data.area) : current.area;
  const pricePerM2 = data.pricePerM2 ? Number(data.pricePerM2) : (area > 0 ? Math.round(price / area) : 0);

  db.properties[idx] = {
    ...current,
    authorId: data.authorId !== undefined ? Number(data.authorId) : (current.authorId || 1),
    title,
    slug: title !== current.title ? ensureUniqueSlug(db.properties, title, current.id) : current.slug,
    transactionType: data.transactionType || current.transactionType,
    category: data.category || current.category,
    status: data.status || current.status,
    featured: Boolean(data.featured),
    price,
    pricePerM2,
    area,
    rooms: data.rooms !== undefined ? Number(data.rooms) : current.rooms,
    floor: data.floor !== undefined ? data.floor : current.floor,
    buildYear: data.buildYear !== undefined ? Number(data.buildYear) : current.buildYear,
    city: data.city !== undefined ? data.city : current.city,
    district: data.district !== undefined ? data.district : current.district,
    address: data.address !== undefined ? data.address : current.address,
    images: Array.isArray(data.images) && data.images.length > 0 ? data.images : current.images,
    amenities: Array.isArray(data.amenities) ? data.amenities : current.amenities,
    description: data.description !== undefined ? data.description : current.description,
    updatedAt: new Date().toISOString()
  };

  saveDatabase(db);
  return db.properties[idx];
}

function deleteProperty(id) {
  const db = getDb();
  const prop = getPropertyById(id);
  if (!prop) return null;
  db.properties = db.properties.filter((p) => Number(p.id) !== Number(id));
  saveDatabase(db);
  return prop;
}

// ==================== BLOG (POSTS) ====================
function getPosts({ publishedOnly = false, authorId = null } = {}) {
  const db = getDb();
  let list = [...(db.posts || [])];
  if (publishedOnly) {
    list = list.filter((p) => Boolean(p.published));
  }
  if (authorId && !isNaN(Number(authorId))) {
    list = list.filter((p) => Number(p.authorId || 1) === Number(authorId));
  }
  list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return list;
}

function getPostBySlug(slug) {
  return getDb().posts.find((p) => p.slug === slug);
}

function getPostById(id) {
  return getDb().posts.find((p) => Number(p.id) === Number(id));
}

function createPost(data) {
  const db = getDb();
  const post = {
    id: nextId(db.posts),
    authorId: Number(data.authorId) || 1,
    title: data.title || 'Nowy artykuł',
    slug: ensureUniqueSlug(db.posts, data.title || 'artykul'),
    category: data.category || 'Poradnik',
    excerpt: data.excerpt || '',
    coverImage: data.coverImage || '/images/demo/blog-cover.svg',
    content: data.content || '',
    published: Boolean(data.published),
    createdAt: new Date().toISOString()
  };
  db.posts.unshift(post);
  saveDatabase(db);
  return post;
}

function updatePost(id, data) {
  const db = getDb();
  const idx = db.posts.findIndex((p) => Number(p.id) === Number(id));
  if (idx === -1) return null;

  const current = db.posts[idx];
  const title = data.title || current.title;

  db.posts[idx] = {
    ...current,
    authorId: data.authorId !== undefined ? Number(data.authorId) : (current.authorId || 1),
    title,
    slug: title !== current.title ? ensureUniqueSlug(db.posts, title, current.id) : current.slug,
    category: data.category !== undefined ? data.category : current.category,
    excerpt: data.excerpt !== undefined ? data.excerpt : current.excerpt,
    coverImage: data.coverImage || current.coverImage,
    content: data.content !== undefined ? data.content : current.content,
    published: Boolean(data.published),
    updatedAt: new Date().toISOString()
  };

  saveDatabase(db);
  return db.posts[idx];
}

function deletePost(id) {
  const db = getDb();
  const post = getPostById(id);
  if (!post) return null;
  db.posts = db.posts.filter((p) => Number(p.id) !== Number(id));
  saveDatabase(db);
  return post;
}

// ==================== WIADOMOŚCI KONTAKTOWE ====================
function getMessages({ agentId = null } = {}) {
  const db = getDb();
  let list = [...(db.messages || [])];
  if (agentId && !isNaN(Number(agentId))) {
    list = list.filter((m) => Number(m.agentId || 1) === Number(agentId));
  }
  return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function getMessageById(id) {
  return getDb().messages.find((m) => Number(m.id) === Number(id));
}

function getUnreadMessagesCount(user = null) {
  const db = getDb();
  let list = (db.messages || []).filter((m) => !m.read);
  if (user && user.role !== 'admin') {
    list = list.filter((m) => Number(m.agentId || 1) === Number(user.id));
  }
  return list.length;
}

function createMessage(data) {
  const db = getDb();
  const msg = {
    id: nextId(db.messages),
    agentId: Number(data.agentId) || 1,
    propertyId: data.propertyId ? Number(data.propertyId) : null,
    name: data.name || 'Anonim',
    email: data.email || '',
    phone: data.phone || '',
    subject: data.subject || 'Zapytanie ze strony',
    propertyTitle: data.propertyTitle || '',
    message: data.message || '',
    read: false,
    createdAt: new Date().toISOString()
  };
  db.messages.unshift(msg);
  saveDatabase(db);
  return msg;
}

function markMessageRead(id, readStatus = true) {
  const db = getDb();
  const msg = db.messages.find((m) => Number(m.id) === Number(id));
  if (!msg) return null;
  msg.read = Boolean(readStatus);
  saveDatabase(db);
  return msg;
}

function deleteMessage(id) {
  const db = getDb();
  const before = db.messages.length;
  db.messages = db.messages.filter((m) => Number(m.id) !== Number(id));
  if (db.messages.length !== before) {
    saveDatabase(db);
    return true;
  }
  return false;
}

module.exports = {
  initDatabase,
  getUsers,
  findUserByUsername,
  findUserById,
  getAuthorForResource,
  createUser,
  updateUser,
  updateUserCredentials,
  deleteUser,
  getSettings,
  updateSettings,
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getProperties,
  getPropertyBySlug,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getMessages,
  getMessageById,
  getUnreadMessagesCount,
  createMessage,
  markMessageRead,
  deleteMessage
};
