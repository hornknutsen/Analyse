'use strict';

// ====================================================================
// 1. STORAGE
// ====================================================================

const STORAGE_KEY = 'finansiell-analyse-v1';
const SECTORS = ['Teknologi','Energi','Materialer','Industri','Forbruksvarer','Helse','Finans','Eiendom','Forsyning','Kommunikasjon','Annet'];
const CURRENCIES = ['NOK','USD','EUR','GBP','SEK','DKK'];

// ====================================================================
// OSLO BØRS — SELSKAPSREGISTER (oppdatert mars 2026, ~280 selskaper)
// Kilde: stockanalysis.com/list/oslo-bors + euronext.com
// Fjernet fra børs: Kahoot (jan 2024), Adevinta (jun 2024),
//   Norway Royal Salmon (nov 2022), NTS ASA (jan 2023),
//   Avance Gas (aug 2025), Crayon Group (jul 2025)
// Navneendringer: Schibsted -> Vend Marketplaces (mai 2025),
//   Sparebanken Vest -> Sparebanken Norge (mai 2025)
// ====================================================================
const OSLO_BORS_DB = [
  // --- Energi (olje, gass, fornybar) ---
  { name: 'Equinor ASA',                        ticker: 'EQNR',    sector: 'Energi' },
  { name: 'Aker BP ASA',                         ticker: 'AKRBP',   sector: 'Energi' },
  { name: 'Vår Energi ASA',                      ticker: 'VAR',     sector: 'Energi' },
  { name: 'DNO ASA',                             ticker: 'DNO',     sector: 'Energi' },
  { name: 'Panoro Energy ASA',                   ticker: 'PEN',     sector: 'Energi' },
  { name: 'OKEA ASA',                            ticker: 'OKEA',    sector: 'Energi' },
  { name: 'Petroleum Geo-Services ASA',          ticker: 'PGS',     sector: 'Energi' },
  { name: 'TGS ASA',                             ticker: 'TGS',     sector: 'Energi' },
  { name: 'Bonheur ASA',                         ticker: 'BONHR',   sector: 'Energi' },
  { name: 'BW Energy Limited',                   ticker: 'BWE',     sector: 'Energi' },
  { name: 'BW Offshore Limited',                 ticker: 'BWO',     sector: 'Energi' },
  { name: 'BlueNord ASA',                        ticker: 'BNOR',    sector: 'Energi' },
  { name: 'Paratus Energy Services Ltd.',        ticker: 'PLSV',    sector: 'Energi' },
  { name: 'PetroNor E&P ASA',                    ticker: 'PNOR',    sector: 'Energi' },
  { name: 'Questerre Energy Corporation',        ticker: 'QEC',     sector: 'Energi' },
  { name: 'Interoil Exploration and Production ASA', ticker: 'IOX', sector: 'Energi' },
  { name: 'North Energy ASA',                    ticker: 'NORTH',   sector: 'Energi' },
  { name: 'Petrolia SE',                         ticker: 'PSE',     sector: 'Energi' },
  { name: 'Zenith Energy Ltd.',                  ticker: 'ZENA',    sector: 'Energi' },
  { name: 'Electromagnetic Geoservices ASA',     ticker: 'EMGS',    sector: 'Energi' },
  // Offshore drilling & services
  { name: 'Subsea 7 S.A.',                       ticker: 'SUBC',    sector: 'Energi' },
  { name: 'Aker Solutions ASA',                  ticker: 'AKSO',    sector: 'Energi' },
  { name: 'Odfjell Drilling Ltd.',               ticker: 'ODL',     sector: 'Energi' },
  { name: 'Borr Drilling Limited',               ticker: 'BORR',    sector: 'Energi' },
  { name: 'Seadrill Ltd.',                       ticker: 'SDRL',    sector: 'Energi' },
  { name: 'DOF Group ASA',                       ticker: 'DOFG',    sector: 'Energi' },
  { name: 'Solstad Maritime ASA',                ticker: 'SOMA',    sector: 'Energi' },
  { name: 'Solstad Offshore ASA',                ticker: 'SOFF',    sector: 'Industri' },
  { name: 'Reach Subsea ASA',                    ticker: 'REACH',   sector: 'Energi' },
  { name: 'Shelf Drilling, Ltd.',                ticker: 'SHLF',    sector: 'Energi' },
  { name: 'Archer Limited',                      ticker: 'ARCH',    sector: 'Energi' },
  { name: 'Akastor ASA',                         ticker: 'AKAST',   sector: 'Energi' },
  { name: 'Odfjell Technology Ltd.',             ticker: 'OTL',     sector: 'Energi' },
  { name: 'Golden Energy Offshore Services ASA', ticker: 'GEOS',    sector: 'Energi' },
  { name: 'Northern Ocean Ltd.',                 ticker: 'NOL',     sector: 'Industri' },
  { name: 'Vantage Drilling International Ltd.', ticker: 'VDI',     sector: 'Energi' },
  { name: 'Dolphin Drilling AS',                 ticker: 'DDRIL',   sector: 'Energi' },
  { name: 'Deep Value Driller AS',               ticker: 'DVD',     sector: 'Energi' },
  { name: 'NorAm Drilling AS',                   ticker: 'NORAM',   sector: 'Energi' },
  { name: 'Sea1 Offshore Inc.',                  ticker: 'SEA1',    sector: 'Industri' },
  { name: 'Ventura Offshore Holding Ltd.',       ticker: 'VTURA',   sector: 'Energi' },
  // Fornybar energi
  { name: 'Nel ASA',                             ticker: 'NEL',     sector: 'Forsyning' },
  { name: 'Scatec ASA',                          ticker: 'SCATC',   sector: 'Forsyning' },
  { name: 'Cloudberry Clean Energy ASA',         ticker: 'CLOUD',   sector: 'Forsyning' },
  { name: 'Otovo ASA',                           ticker: 'OTOVO',   sector: 'Forsyning' },
  { name: 'Agilyx ASA',                          ticker: 'AGLX',    sector: 'Forsyning' },
  { name: 'Arendals Fossekompani ASA',           ticker: 'AFK',     sector: 'Forsyning' },
  { name: 'Integrated Wind Solutions ASA',       ticker: 'IWS',     sector: 'Forsyning' },
  { name: 'MPC Energy Solutions N.V.',           ticker: 'MPCES',   sector: 'Forsyning' },
  { name: 'Aker Horizons ASA',                   ticker: 'AKH',     sector: 'Forsyning' },
  { name: 'Capsol Technologies ASA',             ticker: 'CAPSL',   sector: 'Forsyning' },
  { name: 'Cavendish Hydrogen ASA',              ticker: 'CAVEN',   sector: 'Forsyning' },
  { name: 'HydrogenPro ASA',                     ticker: 'HYPRO',   sector: 'Forsyning' },
  { name: 'Hynion AS',                           ticker: 'HYN',     sector: 'Forsyning' },
  { name: 'Ocean Sun AS',                        ticker: 'OSUN',    sector: 'Forsyning' },
  { name: 'Ocean GeoLoop AS',                    ticker: 'OCEAN',   sector: 'Forsyning' },
  { name: 'EAM Solar ASA',                       ticker: 'EAM',     sector: 'Forsyning' },
  { name: 'Envipco Holding N.V.',                ticker: 'ENVIP',   sector: 'Forsyning' },
  { name: 'Cambi ASA',                           ticker: 'CAMBI',   sector: 'Forsyning' },
  { name: 'Scana ASA',                           ticker: 'SCANA',   sector: 'Forsyning' },
  { name: 'Zaptec ASA',                          ticker: 'ZAP',     sector: 'Forsyning' },
  { name: 'Pyrum Innovations AG',                ticker: 'PYRUM',   sector: 'Forsyning' },
  { name: 'ReFuels N.V.',                        ticker: 'REFL',    sector: 'Forsyning' },
  { name: 'Desert Control AS',                   ticker: 'DSRT',    sector: 'Forsyning' },
  { name: 'Skandia GreenPower AS',               ticker: 'SKAND',   sector: 'Forsyning' },
  { name: 'Bergen Carbon Solutions AS',          ticker: 'BCS',     sector: 'Forsyning' },
  { name: 'M Vest Water AS',                     ticker: 'MVW',     sector: 'Forsyning' },
  { name: 'Zelluna ASA',                         ticker: 'ZLNA',    sector: 'Forsyning' },
  { name: 'Energeia AS',                         ticker: 'ENERG',   sector: 'Forsyning' },
  { name: 'SED Energy Holdings Plc',             ticker: 'ENH',     sector: 'Forsyning' },
  // LNG / Gasstankere
  { name: 'Flex LNG Ltd.',                       ticker: 'FLNG',    sector: 'Energi' },
  { name: 'BW LPG Limited',                      ticker: 'BWLPG',   sector: 'Industri' },
  { name: 'Awilco LNG ASA',                      ticker: 'ALNG',    sector: 'Energi' },
  // --- Industri (shipping, konglomerat, industri) ---
  // Shipping
  { name: 'Frontline plc',                       ticker: 'FRO',     sector: 'Industri' },
  { name: 'Golden Ocean Group Limited',          ticker: 'GOGL',    sector: 'Industri' },
  { name: 'Hafnia Limited',                      ticker: 'HAFNI',   sector: 'Industri' },
  { name: 'Höegh Autoliners ASA',                ticker: 'HAUTO',   sector: 'Industri' },
  { name: 'Wallenius Wilhelmsen ASA',            ticker: 'WAWI',    sector: 'Industri' },
  { name: 'Wilh. Wilhelmsen Holding ASA A',      ticker: 'WWI',     sector: 'Industri' },
  { name: 'Wilh. Wilhelmsen Holding ASA B',      ticker: 'WWIB',    sector: 'Industri' },
  { name: 'Stolt-Nielsen Limited',               ticker: 'SNI',     sector: 'Industri' },
  { name: 'Klaveness Combination Carriers ASA',  ticker: 'KCC',     sector: 'Industri' },
  { name: 'DHT Holdings Inc.',                   ticker: 'DHT',     sector: 'Industri' },
  { name: 'Okeanis Eco Tankers Corp.',           ticker: 'OET',     sector: 'Industri' },
  { name: 'MPC Container Ships ASA',             ticker: 'MPCC',    sector: 'Industri' },
  { name: 'Odfjell SE A',                        ticker: 'ODF',     sector: 'Industri' },
  { name: 'Odfjell SE B',                        ticker: 'ODFB',    sector: 'Industri' },
  { name: '2020 Bulkers Ltd.',                   ticker: '2020',    sector: 'Industri' },
  { name: 'Jinhui Shipping and Transportation Limited', ticker: 'JIN', sector: 'Industri' },
  { name: 'Himalaya Shipping Ltd.',              ticker: 'HSHP',    sector: 'Industri' },
  { name: 'Stainless Tankers ASA',               ticker: 'STST',    sector: 'Industri' },
  { name: 'Western Bulk Chartering AS',          ticker: 'WEST',    sector: 'Industri' },
  { name: 'ADS Maritime Holding Plc',            ticker: 'ADS',     sector: 'Industri' },
  { name: 'Cmb.Tech NV',                         ticker: 'CMBTO',   sector: 'Industri' },
  { name: 'Constellation Oil Services Holding S.A.', ticker: 'COSH', sector: 'Energi' },
  { name: 'Havila Shipping ASA',                 ticker: 'HAVI',    sector: 'Industri' },
  { name: 'Havila Kystruten AS',                 ticker: 'HKY',     sector: 'Industri' },
  { name: 'S.D. Standard ETC Plc',              ticker: 'SDSD',    sector: 'Industri' },
  // Forsvar & konglomerat
  { name: 'Kongsberg Gruppen ASA',               ticker: 'KOG',     sector: 'Industri' },
  { name: 'Aker ASA',                            ticker: 'AKER',    sector: 'Industri' },
  { name: 'Tomra Systems ASA',                   ticker: 'TOM',     sector: 'Industri' },
  { name: 'AF Gruppen ASA',                      ticker: 'AFG',     sector: 'Industri' },
  { name: 'Veidekke ASA',                        ticker: 'VEI',     sector: 'Industri' },
  { name: 'Norconsult ASA',                      ticker: 'NORCO',   sector: 'Industri' },
  { name: 'Multiconsult ASA',                    ticker: 'MULTI',   sector: 'Industri' },
  { name: 'ABL Group ASA',                       ticker: 'ABL',     sector: 'Industri' },
  { name: 'Hexagon Composites ASA',              ticker: 'HEX',     sector: 'Industri' },
  { name: 'Hexagon Purus ASA',                   ticker: 'HPUR',    sector: 'Industri' },
  { name: 'Kitron ASA',                          ticker: 'KIT',     sector: 'Industri' },
  { name: 'Cadeler A/S',                         ticker: 'CADLR',   sector: 'Industri' },
  { name: 'Endúr ASA',                           ticker: 'ENDUR',   sector: 'Industri' },
  { name: 'Elmera Group ASA',                    ticker: 'ELMRA',   sector: 'Industri' },
  { name: 'NRC Group ASA',                       ticker: 'NRC',     sector: 'Industri' },
  { name: 'Nekkar ASA',                          ticker: 'NKR',     sector: 'Industri' },
  { name: 'HAV Group ASA',                       ticker: 'HAV',     sector: 'Industri' },
  { name: 'Eqva ASA',                            ticker: 'EQVA',    sector: 'Industri' },
  { name: 'Moreld ASA',                          ticker: 'MORLD',   sector: 'Industri' },
  { name: 'Goodtech ASA',                        ticker: 'GOD',     sector: 'Industri' },
  { name: 'Eidesvik Offshore ASA',               ticker: 'EIOF',    sector: 'Industri' },
  { name: 'Borgestad ASA',                       ticker: 'BOR',     sector: 'Industri' },
  { name: 'Byggma ASA',                          ticker: 'BMA',     sector: 'Industri' },
  { name: 'Prosafe SE',                          ticker: 'PRS',     sector: 'Industri' },
  { name: 'Vow ASA',                             ticker: 'VOW',     sector: 'Industri' },
  { name: 'Fjord Defence Group ASA',             ticker: 'DFENS',   sector: 'Industri' },
  { name: 'Kongsberg Automotive ASA',            ticker: 'KOA',     sector: 'Industri' },
  { name: 'Inin Group AS',                       ticker: 'ININ',    sector: 'Industri' },
  { name: 'Kaldvik AS',                          ticker: 'KLDVK',   sector: 'Industri' },
  // --- Materialer ---
  { name: 'Yara International ASA',              ticker: 'YAR',     sector: 'Materialer' },
  { name: 'Norsk Hydro ASA',                     ticker: 'NHY',     sector: 'Materialer' },
  { name: 'Elkem ASA',                           ticker: 'ELK',     sector: 'Materialer' },
  { name: 'Borregaard ASA',                      ticker: 'BRG',     sector: 'Materialer' },
  { name: 'REC Silicon ASA',                     ticker: 'RECSI',   sector: 'Materialer' },
  { name: 'Elopak ASA',                          ticker: 'ELO',     sector: 'Materialer' },
  { name: 'BEWI ASA',                            ticker: 'BEWI',    sector: 'Materialer' },
  { name: 'Rana Gruber ASA',                     ticker: 'RANA',    sector: 'Materialer' },
  { name: 'Norske Skog ASA',                     ticker: 'NSKOG',   sector: 'Materialer' },
  { name: 'Tekna Holding ASA',                   ticker: 'TEKNA',   sector: 'Materialer' },
  { name: 'Nordic Mining ASA',                   ticker: 'NOM',     sector: 'Materialer' },
  { name: 'Måsøval AS',                          ticker: 'MAS',     sector: 'Materialer' },
  { name: 'Green Minerals AS',                   ticker: 'GEM',     sector: 'Materialer' },
  { name: 'Norsk Titanium AS',                   ticker: 'NTI',     sector: 'Materialer' },
  { name: 'Akobo Minerals AB (publ)',            ticker: 'AKOBO',   sector: 'Materialer' },
  // --- Teknologi ---
  { name: 'Nordic Semiconductor ASA',            ticker: 'NOD',     sector: 'Teknologi' },
  { name: 'Atea ASA',                            ticker: 'ATEA',    sector: 'Teknologi' },
  { name: 'Bouvet ASA',                          ticker: 'BOUV',    sector: 'Teknologi' },
  { name: 'Itera ASA',                           ticker: 'ITERA',   sector: 'Teknologi' },
  { name: 'Pexip Holding ASA',                   ticker: 'PEXIP',   sector: 'Teknologi' },
  { name: 'AutoStore Holdings Ltd.',             ticker: 'AUTO',    sector: 'Teknologi' },
  { name: 'Zalaris ASA',                         ticker: 'ZAL',     sector: 'Teknologi' },
  { name: 'IDEX Biometrics ASA',                 ticker: 'IDEX',    sector: 'Teknologi' },
  { name: 'SoftwareOne Holding AG',              ticker: 'SWON',    sector: 'Teknologi' },
  { name: 'TietoEVRY Oyj',                       ticker: 'TIETO',   sector: 'Teknologi' },
  { name: 'Norbit ASA',                          ticker: 'NORBT',   sector: 'Teknologi' },
  { name: 'Sentia ASA',                          ticker: 'SNTIA',   sector: 'Teknologi' },
  { name: 'Napatech A/S',                        ticker: 'NAPA',    sector: 'Teknologi' },
  { name: 'SmartCraft ASA',                      ticker: 'SMCRT',   sector: 'Teknologi' },
  { name: 'Smartoptics Group ASA',               ticker: 'SMOP',    sector: 'Teknologi' },
  { name: 'Appear ASA',                          ticker: 'APR',     sector: 'Teknologi' },
  { name: 'Xplora Technologies AS',              ticker: 'XPLRA',   sector: 'Teknologi' },
  { name: 'Nordhealth AS',                       ticker: 'NORDH',   sector: 'Teknologi' },
  { name: 'Webstep ASA',                         ticker: 'WSTEP',   sector: 'Teknologi' },
  { name: 'Techstep ASA',                        ticker: 'TECH',    sector: 'Teknologi' },
  { name: 'StrongPoint ASA',                     ticker: 'STRO',    sector: 'Teknologi' },
  { name: 'Elliptic Laboratories ASA',           ticker: 'ELABS',   sector: 'Teknologi' },
  { name: 'poLight ASA',                         ticker: 'PLT',     sector: 'Teknologi' },
  { name: 'Otello Corporation ASA',              ticker: 'OTEC',    sector: 'Teknologi' },
  { name: 'Omda AS',                             ticker: 'OMDA',    sector: 'Teknologi' },
  { name: 'Soiltech ASA',                        ticker: 'STECH',   sector: 'Teknologi' },
  { name: 'Ensurge Micropower ASA',              ticker: 'ENSU',    sector: 'Teknologi' },
  { name: 'Circio Holding ASA',                  ticker: 'CRNA',    sector: 'Teknologi' },
  { name: 'Arribatec Group ASA',                 ticker: 'ARR',     sector: 'Teknologi' },
  { name: 'Lokotech Group AS',                   ticker: 'LOKO',    sector: 'Teknologi' },
  { name: 'Nordic Technology Group AS',          ticker: 'NTG',     sector: 'Teknologi' },
  { name: 'Pryme N.V.',                          ticker: 'PRYME',   sector: 'Teknologi' },
  { name: 'INIFY Laboratories AB',               ticker: 'INIFY',   sector: 'Teknologi' },
  { name: 'ContextVision AB (publ)',             ticker: 'CONTX',   sector: 'Teknologi' },
  { name: 'Huddlestock Fintech AS',              ticker: 'HUDL',    sector: 'Teknologi' },
  { name: 'Ayfie International AS',              ticker: 'AIX',     sector: 'Teknologi' },
  { name: 'Norwegian Block Exchange AS',         ticker: 'NBX',     sector: 'Teknologi' },
  { name: 'Huddly AS',                           ticker: 'HDLY',    sector: 'Teknologi' },
  { name: 'Cyviz AS',                            ticker: 'CYVIZ',   sector: 'Teknologi' },
  { name: 'River Tech p.l.c.',                   ticker: 'RIVER',   sector: 'Teknologi' },
  { name: 'NOS Nova AS',                         ticker: 'NOSN',    sector: 'Teknologi' },
  { name: 'Ace Digital AS',                      ticker: 'ACED',    sector: 'Teknologi' },
  { name: 'Indect AS',                           ticker: 'INDCT',   sector: 'Teknologi' },
  { name: 'NEXT Biometrics Group ASA',           ticker: 'NEXT',    sector: 'Teknologi' },
  { name: 'SoftOx Solutions AS',                 ticker: 'SOFTX',   sector: 'Teknologi' },
  { name: '5th Planet Games A/S',               ticker: '5PG',     sector: 'Teknologi' },
  { name: 'Vend Marketplaces ASA A',             ticker: 'VENDA',   sector: 'Kommunikasjon' },
  { name: 'Vend Marketplaces ASA B',             ticker: 'VENDB',   sector: 'Kommunikasjon' },
  { name: 'StandardCoin AS',                     ticker: 'SCOIN',   sector: 'Teknologi' },
  { name: 'CodeLab Capital AS',                  ticker: 'CODE',    sector: 'Teknologi' },
  // --- Kommunikasjon / Media ---
  { name: 'Telenor ASA',                         ticker: 'TEL',     sector: 'Kommunikasjon' },
  { name: 'LINK Mobility Group Holding ASA',     ticker: 'LINK',    sector: 'Kommunikasjon' },
  { name: 'Polaris Media ASA',                   ticker: 'POL',     sector: 'Kommunikasjon' },
  { name: 'Gyldendal ASA',                       ticker: 'GYL',     sector: 'Kommunikasjon' },
  { name: 'Spir Group ASA',                      ticker: 'SPIR',    sector: 'Kommunikasjon' },
  // --- Forbruksvarer (sjømat, dagligvare, handel) ---
  { name: 'Mowi ASA',                            ticker: 'MOWI',    sector: 'Forbruksvarer' },
  { name: 'SalMar ASA',                          ticker: 'SALM',    sector: 'Forbruksvarer' },
  { name: 'Lerøy Seafood Group ASA',             ticker: 'LSG',     sector: 'Forbruksvarer' },
  { name: 'Grieg Seafood ASA',                   ticker: 'GSF',     sector: 'Forbruksvarer' },
  { name: 'Austevoll Seafood ASA',               ticker: 'AUSS',    sector: 'Forbruksvarer' },
  { name: 'P/F Bakkafrost',                      ticker: 'BAKKA',   sector: 'Forbruksvarer' },
  { name: 'Aker BioMarine ASA',                  ticker: 'AKBM',    sector: 'Forbruksvarer' },
  { name: 'Salmon Evolution ASA',                ticker: 'SALME',   sector: 'Forbruksvarer' },
  { name: 'Andfjord Salmon Group AS',            ticker: 'ANDF',    sector: 'Forbruksvarer' },
  { name: 'Arctic Fish Holding AS',              ticker: 'AFISH',   sector: 'Forbruksvarer' },
  { name: 'Nordic Halibut AS',                   ticker: 'NOHAL',   sector: 'Forbruksvarer' },
  { name: 'Nordic Aqua Partners A/S',            ticker: 'NOAP',    sector: 'Forbruksvarer' },
  { name: 'Gigante Salmon AS',                   ticker: 'GIGA',    sector: 'Forbruksvarer' },
  { name: 'Icelandic Salmon AS',                 ticker: 'ISLAX',   sector: 'Forbruksvarer' },
  { name: 'Norcod AS',                           ticker: 'NCOD',    sector: 'Forbruksvarer' },
  { name: 'Barramundi Group Ltd.',               ticker: 'BARRA',   sector: 'Forbruksvarer' },
  { name: 'Proximar Seafood AS',                 ticker: 'PROXI',   sector: 'Forbruksvarer' },
  { name: 'Atlantic Sapphire ASA',               ticker: 'ASA',     sector: 'Forbruksvarer' },
  { name: 'The Kingfish Company N.V.',           ticker: 'KING',    sector: 'Forbruksvarer' },
  { name: 'Aqua Bio Technology ASA',             ticker: 'ABTEC',   sector: 'Forbruksvarer' },
  { name: 'AKVA group ASA',                      ticker: 'AKVA',    sector: 'Forbruksvarer' },
  { name: 'Orkla ASA',                           ticker: 'ORK',     sector: 'Forbruksvarer' },
  { name: 'Europris ASA',                        ticker: 'EPR',     sector: 'Forbruksvarer' },
  { name: 'Kid ASA',                             ticker: 'KID',     sector: 'Forbruksvarer' },
  { name: 'Sats ASA',                            ticker: 'SATS',    sector: 'Forbruksvarer' },
  { name: 'Komplett ASA',                        ticker: 'KOMPL',   sector: 'Forbruksvarer' },
  { name: 'Lumi Gruppen AS',                     ticker: 'LUMI',    sector: 'Forbruksvarer' },
  { name: 'Dellia Group ASA',                    ticker: 'DELIA',   sector: 'Forbruksvarer' },
  { name: 'Elektroimportøren AS',                ticker: 'ELIMP',   sector: 'Forbruksvarer' },
  { name: 'Matvareexpressen AS',                 ticker: 'MVE',     sector: 'Forbruksvarer' },
  { name: 'Hunter Group ASA',                    ticker: 'HUNT',    sector: 'Forbruksvarer' },
  // --- Helse ---
  { name: 'Photocure ASA',                       ticker: 'PHO',     sector: 'Helse' },
  { name: 'Vistin Pharma ASA',                   ticker: 'VISTN',   sector: 'Helse' },
  { name: 'Nykode Therapeutics AS',              ticker: 'NYKD',    sector: 'Helse' },
  { name: 'Medistim ASA',                        ticker: 'MEDI',    sector: 'Helse' },
  { name: 'ArcticZymes Technologies ASA',        ticker: 'AZT',     sector: 'Helse' },
  { name: 'Saga Pure ASA',                       ticker: 'SAGA',    sector: 'Helse' },
  { name: 'Thor Medical ASA',                    ticker: 'TRMED',   sector: 'Helse' },
  { name: 'Navamedic ASA',                       ticker: 'NAVA',    sector: 'Helse' },
  { name: 'Lytix Biopharma AS',                  ticker: 'LYTIX',   sector: 'Helse' },
  { name: 'Gentian Diagnostics ASA',             ticker: 'GENT',    sector: 'Helse' },
  { name: 'Hofseth BioCare ASA',                 ticker: 'HBC',     sector: 'Helse' },
  { name: 'Observe Medical ASA',                 ticker: 'OBSRV',   sector: 'Helse' },
  { name: 'EXACT Therapeutics AS',               ticker: 'EXTX',    sector: 'Helse' },
  { name: 'Arctic Bioscience AS',                ticker: 'ABS',     sector: 'Helse' },
  { name: 'Lifecare ASA',                        ticker: 'LIFE',    sector: 'Helse' },
  { name: 'PCI Biotech Holding ASA',             ticker: 'PCIB',    sector: 'Helse' },
  // --- Finans ---
  { name: 'DNB Bank ASA',                        ticker: 'DNB',     sector: 'Finans' },
  { name: 'Storebrand ASA',                      ticker: 'STB',     sector: 'Finans' },
  { name: 'Gjensidige Forsikring ASA',           ticker: 'GJF',     sector: 'Finans' },
  { name: 'SpareBank 1 Sør-Norge ASA',           ticker: 'SB1NO',   sector: 'Finans' },
  { name: 'SpareBank 1 SMN',                     ticker: 'MING',    sector: 'Finans' },
  { name: 'SpareBank 1 Østlandet',               ticker: 'SPOL',    sector: 'Finans' },
  { name: 'SpareBank 1 Nord-Norge',              ticker: 'NONG',    sector: 'Finans' },
  { name: 'SpareBank 1 Ringerike Hadeland',      ticker: 'RING',    sector: 'Finans' },
  { name: 'SpareBank 1 Østfold Akershus',        ticker: 'SOAG',    sector: 'Finans' },
  { name: 'SpareBank 1 Nordmøre',                ticker: 'SNOR',    sector: 'Finans' },
  { name: 'SpareBank 1 Helgeland',               ticker: 'HELG',    sector: 'Finans' },
  { name: 'Sparebanken Norge',                   ticker: 'SVEG',    sector: 'Finans' },
  { name: 'Sparebanken Møre',                    ticker: 'MORG',    sector: 'Finans' },
  { name: 'Sparebank 68° Nord',                  ticker: 'SB68',    sector: 'Finans' },
  { name: 'Protector Forsikring ASA',            ticker: 'PROT',    sector: 'Finans' },
  { name: 'Pareto Bank ASA',                     ticker: 'PARB',    sector: 'Finans' },
  { name: 'Instabank ASA',                       ticker: 'INSTA',   sector: 'Finans' },
  { name: 'B2 Impact ASA',                       ticker: 'B2I',     sector: 'Finans' },
  { name: 'Axactor ASA',                         ticker: 'ACR',     sector: 'Finans' },
  { name: 'ABG Sundal Collier Holding ASA',      ticker: 'ABG',     sector: 'Finans' },
  { name: 'Rogaland Sparebank',                  ticker: 'ROGS',    sector: 'Finans' },
  { name: 'Skue Sparebank',                      ticker: 'SKUE',    sector: 'Finans' },
  { name: 'Aurskog Sparebank',                   ticker: 'AURG',    sector: 'Finans' },
  { name: 'Jæren Sparebank',                     ticker: 'JAREN',   sector: 'Finans' },
  { name: 'Sparebanken Øst',                     ticker: 'SPOG',    sector: 'Finans' },
  { name: 'Romerike Sparebank',                  ticker: 'ROMER',   sector: 'Finans' },
  { name: 'Voss Veksel- og Landmandsbank ASA',   ticker: 'VVL',     sector: 'Finans' },
  { name: 'Haugesund Sparebank',                 ticker: 'HGSB',    sector: 'Finans' },
  { name: 'Bien Sparebank ASA',                  ticker: 'BIEN',    sector: 'Finans' },
  { name: 'Melhus Sparebank',                    ticker: 'MELG',    sector: 'Finans' },
  { name: 'Trøndelag Sparebank',                 ticker: 'TRSB',    sector: 'Finans' },
  { name: 'Grong Sparebank',                     ticker: 'GRONG',   sector: 'Finans' },
  { name: 'Aasen Sparebank',                     ticker: 'AASB',    sector: 'Finans' },
  { name: 'Kraft Bank ASA',                      ticker: 'KRAB',    sector: 'Finans' },
  { name: 'Nidaros Sparebank',                   ticker: 'NISB',    sector: 'Finans' },
  { name: 'Høland og Setskog Sparebank',         ticker: 'HSPG',    sector: 'Finans' },
  { name: 'Flekkefjord Sparebank',               ticker: 'FFSB',    sector: 'Finans' },
  { name: 'Tinde Sparebank',                     ticker: 'TINDE',   sector: 'Finans' },
  { name: 'Sogn Sparebank',                      ticker: 'SOGN',    sector: 'Finans' },
  { name: 'Nordic Financials ASA',               ticker: 'NOFIN',   sector: 'Finans' },
  // --- Eiendom ---
  { name: 'Entra ASA',                           ticker: 'ENTRA',   sector: 'Eiendom' },
  { name: 'Selvaag Bolig ASA',                   ticker: 'SBO',     sector: 'Eiendom' },
  { name: 'Public Property Invest ASA',          ticker: 'PUBLI',   sector: 'Eiendom' },
  { name: 'KMC Properties ASA',                  ticker: 'KMCP',    sector: 'Eiendom' },
  { name: 'Magnora ASA',                         ticker: 'MGN',     sector: 'Eiendom' },
  { name: 'Hermana Holding ASA',                 ticker: 'HERMA',   sector: 'Eiendom' },
  { name: 'Baltic Sea Properties AS',            ticker: 'BALT',    sector: 'Eiendom' },
  { name: 'Black Sea Property AS',               ticker: 'BSP',     sector: 'Eiendom' },
  { name: 'RomReal Limited',                     ticker: 'ROM',     sector: 'Eiendom' },
];

function getCompanies() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveCompanies(cs) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cs)); }

function migrateCompany(company) {
  if (!company || !company.dcf) return company;
  const dcf = company.dcf;

  // historical — add missing P&L fields
  const h = dcf.historical;
  if (!h.cogs)      h.cogs      = ['','',''];
  if (!h.sga)       h.sga       = ['','',''];
  if (!h.rd)        h.rd        = ['','',''];
  if (!h.otherOpex) h.otherOpex = ['','',''];

  // assumptions — add missing P&L drivers
  const a = dcf.assumptions;
  if (!a.cogsPercent)      a.cogsPercent      = ['60','60','59','58','57','56','55','55','55','55'];
  if (!a.sgaPercent)       a.sgaPercent       = ['10','10','10','10','10','10','10','10','10','10'];
  if (!a.rdPercent)        a.rdPercent        = ['3','3','3','3','3','3','3','3','3','3'];
  if (!a.otherOpexPercent) a.otherOpexPercent = ['2','2','2','2','2','2','2','2','2','2'];

  // wacc — add new fields
  const w = dcf.wacc;
  if (w.sizePremium    === undefined) w.sizePremium    = '0';
  if (w.alphaRisk      === undefined) w.alphaRisk      = '0';
  if (w.equityMarketCap === undefined) w.equityMarketCap = '0';
  if (w.totalDebt      === undefined) w.totalDebt      = '0';

  // bridge — split netDebt into totalDebt + cash
  const b = dcf.bridge;
  if (b.totalDebt === undefined) b.totalDebt = b.netDebt || '0';
  if (b.cash      === undefined) b.cash      = '0';

  return company;
}

function getCompany(id) {
  const company = getCompanies().find(c => c.id === id);
  return company ? migrateCompany(company) : undefined;
}

// Folder storage
const FOLDERS_KEY = 'finansiell-analyse-folders-v1';
function getFolders() {
  try { return JSON.parse(localStorage.getItem(FOLDERS_KEY)) || []; } catch { return []; }
}
function saveFolders(fs) { localStorage.setItem(FOLDERS_KEY, JSON.stringify(fs)); }
function createFolder(name) {
  const folders = getFolders();
  const f = { id: crypto.randomUUID(), name, createdAt: Date.now() };
  folders.push(f);
  saveFolders(folders);
  state.expandedFolders.add(f.id);
  return f;
}
function deleteFolder(id) {
  saveFolders(getFolders().filter(f => f.id !== id));
  // Move companies in this folder to "no folder"
  const cs = getCompanies().map(c => c.folderId === id ? { ...c, folderId: null } : c);
  saveCompanies(cs);
  state.expandedFolders.delete(id);
}
function saveCompany(company) {
  const cs = getCompanies();
  const i = cs.findIndex(c => c.id === company.id);
  if (i !== -1) { cs[i] = { ...company, updatedAt: Date.now() }; saveCompanies(cs); }
}
function deleteCompany(id) { saveCompanies(getCompanies().filter(c => c.id !== id)); }

function defaultDCF() {
  const y = new Date().getFullYear();
  return {
    projectionYears: 5,
    historical: {
      years:      [y-3, y-2, y-1],
      revenue:    ['','',''],
      cogs:       ['','',''],
      sga:        ['','',''],
      rd:         ['','',''],
      otherOpex:  ['','',''],
      da:         ['','',''],
      capex:      ['','',''],
      nwcChange:  ['','','']
    },
    assumptions: {
      taxRate:           '25',
      revenueGrowth:     ['10','10','9','8','7','6','5','5','5','5'],
      cogsPercent:       ['60','60','59','58','57','56','55','55','55','55'],
      sgaPercent:        ['10','10','10','10','10','10','10','10','10','10'],
      rdPercent:         ['3','3','3','3','3','3','3','3','3','3'],
      otherOpexPercent:  ['2','2','2','2','2','2','2','2','2','2'],
      daPercent:         ['5','5','5','5','5','5','5','5','5','5'],
      capexPercent:      ['7','7','7','6','6','6','6','6','6','6'],
      nwcChangePercent:  ['2','2','2','2','2','2','2','2','2','2']
    },
    wacc: {
      riskFreeRate: '4.0', erp: '5.5', beta: '1.00',
      sizePremium: '0', alphaRisk: '0',
      costOfDebt: '5.0', taxRate: '25.0',
      equityMarketCap: '0', totalDebt: '0',
      debtWeight: '20', equityWeight: '80'
    },
    terminalValue: { method: 'gordon', terminalGrowthRate: '2.5', exitMultiple: '10' },
    bridge: { totalDebt: '0', cash: '0', minorities: '0', otherAdjustments: '0', sharesOutstanding: '1000', currentPrice: '0' }
  };
}

function defaultMultiples() {
  return {
    subject: { revenue:'', ebitda:'', ebit:'', netIncome:'', eps:'', netDebt:'', sharesOutstanding:'', currentPrice:'' },
    peers: []
  };
}

function createCompany(data) {
  const company = {
    id: crypto.randomUUID(), name: data.name, ticker: data.ticker.toUpperCase(),
    sector: data.sector || '', currency: data.currency || 'NOK',
    folderId: data.folderId || null,
    createdAt: Date.now(), updatedAt: Date.now(),
    dcf: defaultDCF(), multiples: defaultMultiples()
  };
  const cs = getCompanies(); cs.push(company); saveCompanies(cs);
  return company;
}

// ====================================================================
// 2. DCF CALCULATIONS
// ====================================================================

function calcWACC(w) {
  const rf  = pf(w.riskFreeRate) / 100, erp = pf(w.erp) / 100, beta = pf(w.beta) || 1;
  const sp  = pf(w.sizePremium) / 100, ar = pf(w.alphaRisk) / 100;
  const kd  = pf(w.costOfDebt) / 100, t  = pf(w.taxRate) / 100;
  const emc = pf(w.equityMarketCap), td = pf(w.totalDebt);
  let we, wd;
  if (emc > 0 || td > 0) {
    const total = emc + td;
    we = total > 0 ? emc / total : 0.8;
    wd = total > 0 ? td  / total : 0.2;
  } else {
    wd = pf(w.debtWeight) / 100;
    we = pf(w.equityWeight) / 100;
  }
  const ke   = rf + beta * erp + sp + ar;
  const kdAt = kd * (1 - t);
  return { ke, kdAt, wacc: ke * we + kdAt * wd, we, wd };
}

function calcProjectionRows(dcf, waccOvr) {
  const { assumptions: a, historical: h, projectionYears } = dcf;
  const n    = parseInt(projectionYears) || 5;
  const tax  = pf(a.taxRate) / 100;
  const wacc = waccOvr !== undefined ? waccOvr : calcWACC(dcf.wacc).wacc;
  const base = pf(h.revenue[2]) || 0;
  let prev   = base;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const g     = pf(a.revenueGrowth[i]) / 100;
    const cogsP = pf(a.cogsPercent[i]) / 100;
    const sgaP  = pf(a.sgaPercent[i]) / 100;
    const rdP   = pf(a.rdPercent[i]) / 100;
    const othP  = pf(a.otherOpexPercent[i]) / 100;
    const daP   = pf(a.daPercent[i]) / 100;
    const capP  = pf(a.capexPercent[i]) / 100;
    const nwcP  = pf(a.nwcChangePercent[i]) / 100;
    const rev    = prev * (1 + g);
    const cogs   = rev * cogsP;
    const grossP = rev - cogs;
    const sga    = rev * sgaP;
    const rd     = rev * rdP;
    const oth    = rev * othP;
    const ebitda = grossP - sga - rd - oth;
    const da     = rev * daP;
    const ebit   = ebitda - da;
    const nopat  = ebit * (1 - tax);
    const capex  = rev * capP;
    const nwc    = rev * nwcP;
    const fcf    = nopat + da - capex - nwc;
    const df     = 1 / Math.pow(1 + wacc, i + 1);
    rows.push({ year: i+1, rev, cogs, grossP, sga, rd, oth, ebitda, da, ebit, nopat, capex, nwc, fcf, df, pvFcf: fcf*df });
    prev = rev;
  }
  return rows;
}

function calcDCF(company, waccOvr, tgrOvr) {
  const dcf = company.dcf;
  const wacc = waccOvr !== undefined ? waccOvr : calcWACC(dcf.wacc).wacc;
  const rows = calcProjectionRows(dcf, wacc);
  const n = rows.length;
  const last = rows[n - 1];
  const tgr = tgrOvr !== undefined ? tgrOvr : pf(dcf.terminalValue.terminalGrowthRate) / 100;

  let tv = 0;
  if (dcf.terminalValue.method === 'gordon') {
    tv = (wacc > tgr && last) ? last.fcf * (1 + tgr) / (wacc - tgr) : 0;
  } else {
    tv = last ? last.ebitda * (pf(dcf.terminalValue.exitMultiple) || 0) : 0;
  }
  const pvTV = n > 0 ? tv / Math.pow(1 + wacc, n) : 0;
  const sumPv = rows.reduce((s, r) => s + r.pvFcf, 0);
  const ev = sumPv + pvTV;
  const b = dcf.bridge;
  const totalDebt = b.totalDebt !== undefined ? pf(b.totalDebt) : pf(b.netDebt);
  const cash = pf(b.cash) || 0;
  const min = pf(b.minorities), oth = pf(b.otherAdjustments);
  const sh = pf(b.sharesOutstanding) || 1;
  const eq = ev - totalDebt + cash - min + oth;
  return { rows, tv, pvTV, sumPv, ev, eq, price: eq / sh };
}

function calcSensitivity(company) {
  const { wacc } = calcWACC(company.dcf.wacc);
  const tgr = pf(company.dcf.terminalValue.terminalGrowthRate) / 100;
  const wRange = [-0.015, -0.01, -0.005, 0, 0.005, 0.01, 0.015].map(d => wacc + d);
  const gRange = [-0.015, -0.01, -0.005, 0, 0.005, 0.01, 0.015].map(d => tgr + d);
  return wRange.map(w => gRange.map(g => ({ w, g, price: calcDCF(company, w, g).price })));
}

// ====================================================================
// 3. MULTIPLES CALCULATIONS
// ====================================================================

function peerMultiples(peer) {
  const ev = pf(peer.ev), rev = pf(peer.revenue), ebitda = pf(peer.ebitda);
  const ebit = pf(peer.ebit), ni = pf(peer.netIncome), mc = pf(peer.marketCap);
  return {
    evRev:    rev > 0   ? ev / rev    : null,
    evEbitda: ebitda > 0 ? ev / ebitda : null,
    evEbit:   ebit > 0  ? ev / ebit   : null,
    pe:       ni > 0 && mc > 0 ? mc / ni : null
  };
}

function pctile(arr, p) {
  if (!arr.length) return null;
  const s = [...arr].sort((a,b) => a-b);
  const idx = (p/100) * (s.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? s[lo] : s[lo] + (idx-lo) * (s[hi]-s[lo]);
}

function multipleStats(peers) {
  const mults = peers.map(peerMultiples);
  const out = {};
  for (const key of ['evRev','evEbitda','evEbit','pe']) {
    const vals = mults.map(m => m[key]).filter(v => v !== null && isFinite(v) && v > 0);
    out[key] = vals.length ? {
      p25: pctile(vals,25), median: pctile(vals,50),
      mean: vals.reduce((a,b)=>a+b,0)/vals.length, p75: pctile(vals,75), n: vals.length
    } : null;
  }
  return out;
}

function impliedVals(stats, subj) {
  const rev = pf(subj.revenue), ebitda = pf(subj.ebitda), ebit = pf(subj.ebit);
  const eps = pf(subj.eps), nd = pf(subj.netDebt), sh = pf(subj.sharesOutstanding) || 1;
  const toP = ev => (ev - nd) / sh;
  const res = [];
  if (stats.evRev    && rev > 0)    res.push({ name:'EV/Revenue', low: toP(stats.evRev.p25*rev),    mid: toP(stats.evRev.median*rev),    high: toP(stats.evRev.p75*rev) });
  if (stats.evEbitda && ebitda > 0) res.push({ name:'EV/EBITDA',  low: toP(stats.evEbitda.p25*ebitda), mid: toP(stats.evEbitda.median*ebitda), high: toP(stats.evEbitda.p75*ebitda) });
  if (stats.evEbit   && ebit > 0)   res.push({ name:'EV/EBIT',    low: toP(stats.evEbit.p25*ebit),   mid: toP(stats.evEbit.median*ebit),   high: toP(stats.evEbit.p75*ebit) });
  if (stats.pe       && eps > 0)    res.push({ name:'P/E',        low: stats.pe.p25*eps,             mid: stats.pe.median*eps,             high: stats.pe.p75*eps });
  return res;
}

// ====================================================================
// 4. FORMATTERS
// ====================================================================

function pf(v) { return parseFloat(v) || 0; }

function fN(v, d=1) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e12) return (v/1e12).toFixed(d) + 'T';
  if (a >= 1e9)  return (v/1e9).toFixed(d) + 'B';
  if (a >= 1e6)  return (v/1e6).toFixed(d) + 'M';
  if (a >= 1e3)  return (v/1e3).toFixed(d) + 'K';
  return v.toFixed(d);
}
function fP(v, d=1) { return !isFinite(v) ? '—' : (v*100).toFixed(d)+'%'; }
function fX(v, d=1) { return (v===null||!isFinite(v)) ? '—' : v.toFixed(d)+'x'; }
function fPr(v, d=2) { return (v===null||!isFinite(v)) ? '—' : v.toFixed(d); }
function fPct(v, d=1) { return !isFinite(v) ? '—' : (v*100).toFixed(d)+'%'; }

// ====================================================================
// 5. APP STATE
// ====================================================================

const state = { currentId: null, currentTab: 'dcf', expandedFolders: new Set() };

// ====================================================================
// 6. RENDER: SIDEBAR
// ====================================================================

function renderSidebar() {
  const cs = getCompanies();
  const folders = getFolders();
  const list = document.getElementById('company-list');

  function companyItem(c) {
    return `<div class="company-nav-item ${c.id === state.currentId ? 'active' : ''}"
        data-action="open-company" data-id="${c.id}">
      <span class="company-nav-ticker">${esc(c.ticker)}</span>
      <span class="company-nav-name">${esc(c.name)}</span>
    </div>`;
  }

  let html = '';

  // Folders
  folders.forEach(f => {
    const members = cs.filter(c => c.folderId === f.id);
    const open = state.expandedFolders.has(f.id);
    html += `
      <div class="folder-group">
        <div class="folder-header" data-action="toggle-folder" data-id="${f.id}">
          <span class="folder-icon">📁</span>
          <span class="folder-name">${esc(f.name)}</span>
          <span class="folder-count">${members.length}</span>
          <button class="btn-delete-folder" data-action="delete-folder" data-id="${f.id}" title="Slett mappe">✕</button>
          <span class="folder-arrow ${open ? 'open' : ''}">▶</span>
        </div>
        <div class="folder-companies" style="display:${open ? 'block' : 'none'}">
          ${members.length ? members.map(companyItem).join('') : '<div class="folder-empty">Tom mappe</div>'}
        </div>
      </div>`;
  });

  // Unfiled companies
  const unfiled = cs.filter(c => !c.folderId);
  if (unfiled.length) {
    html += `<div class="unfiled-label">UTEN MAPPE</div>`;
    html += unfiled.map(companyItem).join('');
  }

  if (!cs.length && !folders.length) {
    html = `<div style="padding:8px 16px;font-size:11px;color:#475569">Ingen selskaper ennå</div>`;
  }

  list.innerHTML = html;
}

// ====================================================================
// 7. RENDER: DASHBOARD
// ====================================================================

function renderDashboard() {
  const cs = getCompanies();
  const folders = getFolders();
  state.currentId = null;
  renderSidebar();
  const main = document.getElementById('main-content');

  if (!cs.length && !folders.length) {
    main.innerHTML = `
      <div class="empty-state">
        <h3>Ingen selskaper ennå</h3>
        <p>Klikk «+ Legg til selskap» for å legge til ditt første selskap, eller opprett en mappe i sidepanelet.</p>
      </div>`;
    return;
  }

  function cardGrid(companies) {
    return `<div class="company-grid">${companies.map(c => `
      <div class="company-card" data-action="open-company" data-id="${c.id}">
        <div class="company-card-header">
          <span class="company-card-ticker">${esc(c.ticker)}</span>
          <button class="btn-delete-company" data-action="delete-company" data-id="${c.id}" title="Slett">✕</button>
        </div>
        <div class="company-card-name">${esc(c.name)}</div>
        <div class="company-card-meta">${esc(c.sector)} · ${esc(c.currency)}</div>
      </div>`).join('')}
    </div>`;
  }

  let html = `<div class="dashboard-header">
    <h2>Portefølje</h2>
    <p>${cs.length} selskap${cs.length !== 1 ? 'er' : ''} · ${folders.length} mappe${folders.length !== 1 ? 'r' : ''}</p>
  </div>`;

  // Render each folder section
  folders.forEach(f => {
    const members = cs.filter(c => c.folderId === f.id);
    html += `
      <div class="dashboard-folder">
        <div class="dashboard-folder-header">
          <span class="dashboard-folder-icon">📁</span>
          <span class="dashboard-folder-name">${esc(f.name)}</span>
          <span class="dashboard-folder-count">${members.length} selskap${members.length !== 1 ? 'er' : ''}</span>
          <button class="btn-delete-folder-dash" data-action="delete-folder" data-id="${f.id}" title="Slett mappe">Slett mappe</button>
        </div>
        ${members.length ? cardGrid(members) : '<p class="folder-empty-dash">Ingen selskaper i denne mappen ennå.</p>'}
      </div>`;
  });

  // Unfiled
  const unfiled = cs.filter(c => !c.folderId);
  if (unfiled.length) {
    html += `
      <div class="dashboard-folder">
        <div class="dashboard-folder-header">
          <span class="dashboard-folder-name" style="color:var(--text-muted)">Uten mappe</span>
        </div>
        ${cardGrid(unfiled)}
      </div>`;
  }

  main.innerHTML = html;
}

// ====================================================================
// 8. RENDER: COMPANY (tabs)
// ====================================================================

function renderCompany(id) {
  const company = getCompany(id);
  if (!company) { renderDashboard(); return; }
  state.currentId = id;
  renderSidebar();
  const folders = getFolders();
  const main = document.getElementById('main-content');
  const folderSelect = folders.length ? `
    <div class="folder-select-wrap">
      <label class="folder-select-label">📁 Mappe</label>
      <select class="folder-select-input" data-action="set-company-folder" data-id="${company.id}">
        <option value="">Ingen mappe</option>
        ${folders.map(f => `<option value="${f.id}" ${company.folderId === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}
      </select>
    </div>` : '';
  main.innerHTML = `
    <div class="company-header">
      <span class="company-ticker-badge">${esc(company.ticker)}</span>
      <div class="company-header-info">
        <h2>${esc(company.name)}</h2>
        <div class="meta">${esc(company.sector)} · ${esc(company.currency)}</div>
      </div>
      ${folderSelect}
      <button class="btn-danger-sm" data-action="delete-company" data-id="${company.id}">Slett selskap</button>
    </div>
    <div class="tabs">
      <button class="tab-btn ${state.currentTab==='dcf'?'active':''}" data-action="switch-tab" data-tab="dcf">DCF-analyse</button>
      <button class="tab-btn ${state.currentTab==='multiples'?'active':''}" data-action="switch-tab" data-tab="multiples">Multippelanalyse</button>
    </div>
    <div id="tab-content"></div>`;
  renderTab(company);
}

function renderTab(company) {
  const el = document.getElementById('tab-content');
  if (!el) return;
  el.innerHTML = state.currentTab === 'dcf' ? renderDCF(company) : renderMultiples(company);
}

// ====================================================================
// 9. RENDER: DCF
// ====================================================================

function renderDCF(company) {
  const dcf = company.dcf;
  const { ke, kdAt, wacc, we, wd } = calcWACC(dcf.wacc);
  const res = calcDCF(company);
  const n = parseInt(dcf.projectionYears) || 5;
  const rows = res.rows;
  const currPrice = pf(dcf.bridge.currentPrice);
  const upside = currPrice > 0 ? (res.price - currPrice) / currPrice : null;

  return `
    ${renderWACC(dcf, ke, kdAt, wacc, we, wd)}
    ${renderProjections(dcf, rows, n)}
    ${renderTerminalValue(dcf, res)}
    ${renderBridge(dcf, res, currPrice, upside)}
    ${renderSensitivity(company, wacc)}`;
}

function renderWACC(dcf, ke, kdAt, wacc, we, wd) {
  const w = dcf.wacc;
  return `
  <div class="section-card">
    <div class="section-header">
      <span class="section-title">WACC-kalkulator</span>
    </div>
    <div class="section-body">
      <div class="wacc-columns">
        <div class="wacc-col">
          <div class="wacc-col-title">Egenkapitalkostnad (CAPM)</div>
          ${wField('Risikofri rente (%)', 'dcf.wacc.riskFreeRate', w.riskFreeRate)}
          ${wField('Egenkapitalpremie / ERP (%)', 'dcf.wacc.erp', w.erp)}
          ${wField('Beta', 'dcf.wacc.beta', w.beta)}
          ${wField('Størrelsesprermie (%)', 'dcf.wacc.sizePremium', w.sizePremium)}
          ${wField('Selskapsspesifikk risiko (%)', 'dcf.wacc.alphaRisk', w.alphaRisk)}
          <div class="wacc-computed-row">
            <span class="wacc-result-label">Ke (beregnet)</span>
            <span class="wacc-result-value" id="out-ke">${fP(ke)}</span>
          </div>
        </div>
        <div class="wacc-col">
          <div class="wacc-col-title">Gjeldskostnad</div>
          ${wField('Lånekostnad pre-skatt (%)', 'dcf.wacc.costOfDebt', w.costOfDebt)}
          ${wField('Skattesats (%)', 'dcf.wacc.taxRate', w.taxRate)}
          <div class="wacc-computed-row">
            <span class="wacc-result-label">Kd etter skatt (beregnet)</span>
            <span class="wacc-result-value" id="out-kdat">${fP(kdAt)}</span>
          </div>
        </div>
        <div class="wacc-col">
          <div class="wacc-col-title">Kapitalstruktur</div>
          ${wField('Markedsverdi EK (M)', 'dcf.wacc.equityMarketCap', w.equityMarketCap)}
          ${wField('Total gjeld (M)', 'dcf.wacc.totalDebt', w.totalDebt)}
          <div class="wacc-computed-row">
            <span class="wacc-result-label">We (beregnet)</span>
            <span class="wacc-result-value" id="out-we">${fP(we)}</span>
          </div>
          <div class="wacc-computed-row">
            <span class="wacc-result-label">Wd (beregnet)</span>
            <span class="wacc-result-value" id="out-wd">${fP(wd)}</span>
          </div>
        </div>
      </div>
      <div class="wacc-result-row">
        <div class="wacc-result-item" style="flex:1">
          <span class="wacc-result-label">WACC</span>
          <span class="wacc-result-value main" id="out-wacc">${fP(wacc)}</span>
        </div>
      </div>
    </div>
  </div>`;
}

function wField(label, path, val) {
  return `<div class="field-group">
    <label class="field-label">${label}</label>
    <input class="field-input" type="number" step="any" data-path="${path}" value="${val}">
  </div>`;
}

function renderProjections(dcf, rows, n) {
  const h = dcf.historical;
  const a = dcf.assumptions;

  // historical derived values
  const histRevs  = h.revenue.map(pf);
  const histCogs  = (h.cogs      || ['','','']).map(pf);
  const histSga   = (h.sga       || ['','','']).map(pf);
  const histRd    = (h.rd        || ['','','']).map(pf);
  const histOth   = (h.otherOpex || ['','','']).map(pf);
  const histDa    = h.da.map(pf);
  const histCapex = h.capex.map(pf);
  const histNwc   = h.nwcChange.map(pf);

  const histGrossP = histRevs.map((r,i) => r - histCogs[i]);
  const histEbitda = histGrossP.map((gp,i) => gp - histSga[i] - histRd[i] - histOth[i]);
  const histEbit   = histEbitda.map((eb,i) => eb - histDa[i]);

  const histGrowth = [
    '—',
    histRevs[0] > 0 ? fP((histRevs[1]-histRevs[0])/histRevs[0]) : '—',
    histRevs[1] > 0 ? fP((histRevs[2]-histRevs[1])/histRevs[1]) : '—'
  ];
  const hPct = (val, rev) => rev > 0 ? fP(val/rev) : '—';

  const hCols    = h.years.map((y,i) => ({ y, i }));
  const pCols    = rows;
  const colCount = 1 + hCols.length + n;

  const head = `<thead><tr>
    <th>Linje</th>
    ${hCols.map(({y}) => `<th class="col-hist">${y}A</th>`).join('')}
    ${pCols.map(r => `<th class="col-proj">År ${r.year}</th>`).join('')}
  </tr></thead>`;

  const hIn  = (field, idx) => `<td class="col-hist"><input class="tbl-input" type="number" step="any" data-path="dcf.historical.${field}.${idx}" value="${(dcf.historical[field]||['','',''])[idx]}"></td>`;
  const pIn  = (field, idx) => `<td class="col-proj"><input class="tbl-input" type="number" step="any" data-path="dcf.assumptions.${field}.${idx}" value="${a[field][idx]}"></td>`;
  const cOut = (id, val)    => `<td id="${id}">${val}</td>`;
  const sep  = ()           => `<tr class="row-separator"><td colspan="${colCount}"></td></tr>`;

  const body = `<tbody>
    <tr class="row-input"><td><b>Omsetningsvekst (%)</b></td>
      ${hCols.map(({i}) => `<td class="col-hist">${histGrowth[i]}</td>`).join('')}
      ${pCols.map((_,i) => pIn('revenueGrowth', i)).join('')}
    </tr>
    <tr class="row-computed"><td><b>Omsetning</b></td>
      ${hCols.map(({i}) => hIn('revenue', i)).join('')}
      ${rows.map(r => cOut(`out-rev-${r.year}`, fN(r.rev))).join('')}
    </tr>
    ${sep()}
    <tr class="row-input"><td class="row-label-indent">COGS som % omsetning</td>
      ${hCols.map(({i}) => `<td class="col-hist">${hPct(histCogs[i], histRevs[i])}</td>`).join('')}
      ${pCols.map((_,i) => pIn('cogsPercent', i)).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">COGS</td>
      ${hCols.map(({i}) => hIn('cogs', i)).join('')}
      ${rows.map(r => cOut(`out-cogs-${r.year}`, fN(r.cogs))).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent"><b>Bruttofortjeneste</b></td>
      ${hCols.map(({i}) => `<td class="col-hist">${fN(histGrossP[i])}</td>`).join('')}
      ${rows.map(r => cOut(`out-grossP-${r.year}`, fN(r.grossP))).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">Bruttomargin (%)</td>
      ${hCols.map(({i}) => `<td class="col-hist">${hPct(histGrossP[i], histRevs[i])}</td>`).join('')}
      ${rows.map(r => cOut(`out-grossM-${r.year}`, r.rev > 0 ? fP(r.grossP/r.rev) : '—')).join('')}
    </tr>
    ${sep()}
    <tr class="row-input"><td class="row-label-indent">SGA som % omsetning</td>
      ${hCols.map(({i}) => `<td class="col-hist">${hPct(histSga[i], histRevs[i])}</td>`).join('')}
      ${pCols.map((_,i) => pIn('sgaPercent', i)).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">SGA</td>
      ${hCols.map(({i}) => hIn('sga', i)).join('')}
      ${rows.map(r => cOut(`out-sga-${r.year}`, fN(r.sga))).join('')}
    </tr>
    <tr class="row-input"><td class="row-label-indent">R&amp;D som % omsetning</td>
      ${hCols.map(({i}) => `<td class="col-hist">${hPct(histRd[i], histRevs[i])}</td>`).join('')}
      ${pCols.map((_,i) => pIn('rdPercent', i)).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">R&amp;D</td>
      ${hCols.map(({i}) => hIn('rd', i)).join('')}
      ${rows.map(r => cOut(`out-rd-${r.year}`, fN(r.rd))).join('')}
    </tr>
    <tr class="row-input"><td class="row-label-indent">Andre driftskostnader som % omsetning</td>
      ${hCols.map(({i}) => `<td class="col-hist">${hPct(histOth[i], histRevs[i])}</td>`).join('')}
      ${pCols.map((_,i) => pIn('otherOpexPercent', i)).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">Andre driftskostnader</td>
      ${hCols.map(({i}) => hIn('otherOpex', i)).join('')}
      ${rows.map(r => cOut(`out-oth-${r.year}`, fN(r.oth))).join('')}
    </tr>
    ${sep()}
    <tr class="row-computed"><td><b>EBITDA</b></td>
      ${hCols.map(({i}) => `<td class="col-hist">${fN(histEbitda[i])}</td>`).join('')}
      ${rows.map(r => cOut(`out-ebitda-${r.year}`, fN(r.ebitda))).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">EBITDA-margin (%)</td>
      ${hCols.map(({i}) => `<td class="col-hist">${hPct(histEbitda[i], histRevs[i])}</td>`).join('')}
      ${rows.map(r => cOut(`out-ebitdam-${r.year}`, r.rev > 0 ? fP(r.ebitda/r.rev) : '—')).join('')}
    </tr>
    ${sep()}
    <tr class="row-input"><td class="row-label-indent">D&amp;A som % omsetning</td>
      ${hCols.map(({i}) => `<td class="col-hist">${hPct(histDa[i], histRevs[i])}</td>`).join('')}
      ${pCols.map((_,i) => pIn('daPercent', i)).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">+ D&amp;A</td>
      ${hCols.map(({i}) => hIn('da', i)).join('')}
      ${rows.map(r => cOut(`out-da-${r.year}`, fN(r.da))).join('')}
    </tr>
    <tr class="row-computed"><td><b>EBIT</b></td>
      ${hCols.map(({i}) => `<td class="col-hist">${fN(histEbit[i])}</td>`).join('')}
      ${rows.map(r => cOut(`out-ebit-${r.year}`, fN(r.ebit))).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">EBIT-margin (%)</td>
      ${hCols.map(({i}) => `<td class="col-hist">${hPct(histEbit[i], histRevs[i])}</td>`).join('')}
      ${rows.map(r => cOut(`out-ebitm-${r.year}`, r.rev > 0 ? fP(r.ebit/r.rev) : '—')).join('')}
    </tr>
    ${sep()}
    <tr class="row-input"><td class="row-label-indent">CapEx som % omsetning</td>
      ${hCols.map(({i}) => `<td class="col-hist">${hPct(histCapex[i], histRevs[i])}</td>`).join('')}
      ${pCols.map((_,i) => pIn('capexPercent', i)).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">– CapEx</td>
      ${hCols.map(({i}) => hIn('capex', i)).join('')}
      ${rows.map(r => cOut(`out-capex-${r.year}`, fN(r.capex))).join('')}
    </tr>
    <tr class="row-input"><td class="row-label-indent">ΔNWC som % omsetning</td>
      ${hCols.map(({i}) => `<td class="col-hist">${hPct(histNwc[i], histRevs[i])}</td>`).join('')}
      ${pCols.map((_,i) => pIn('nwcChangePercent', i)).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">– ΔNWC</td>
      ${hCols.map(({i}) => hIn('nwcChange', i)).join('')}
      ${rows.map(r => cOut(`out-nwc-${r.year}`, fN(r.nwc))).join('')}
    </tr>
    ${sep()}
    <tr class="row-input"><td class="row-label-indent">Skattesats (%)</td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      <td colspan="${n}"><input class="tbl-input" type="number" step="any" data-path="dcf.assumptions.taxRate" value="${a.taxRate}" style="width:60px"> (gjelder alle år)</td>
    </tr>
    <tr class="row-computed"><td><b>NOPAT</b></td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      ${rows.map(r => cOut(`out-nopat-${r.year}`, fN(r.nopat))).join('')}
    </tr>
    <tr class="row-total"><td><b>Fri kontantstrøm (UFCF)</b></td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      ${rows.map(r => cOut(`out-fcf-${r.year}`, fN(r.fcf))).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">Diskonteringsfaktor</td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      ${rows.map(r => cOut(`out-df-${r.year}`, r.df.toFixed(4))).join('')}
    </tr>
    <tr class="row-computed"><td class="row-label-indent">PV av FCF</td>
      ${hCols.map(() => `<td class="col-hist">—</td>`).join('')}
      ${rows.map(r => cOut(`out-pvfcf-${r.year}`, fN(r.pvFcf))).join('')}
    </tr>
  </tbody>`;

  return `
  <div class="section-card">
    <div class="section-header">
      <span class="section-title">Projeksjoner</span>
      <div class="proj-year-toggle">
        <button class="proj-year-btn ${parseInt(dcf.projectionYears)===5?'active':''}" data-action="set-proj-years" data-years="5">5 år</button>
        <button class="proj-year-btn ${parseInt(dcf.projectionYears)===10?'active':''}" data-action="set-proj-years" data-years="10">10 år</button>
      </div>
    </div>
    <div class="section-body section-body-pad0">
      <div class="table-wrap">
        <table>${head}${body}</table>
      </div>
    </div>
  </div>`;
}

function renderTerminalValue(dcf, res) {
  const tv = dcf.terminalValue;
  const isGordon = tv.method === 'gordon';
  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Terminalverdi</span></div>
    <div class="section-body">
      <div class="tv-grid">
        <div>
          <div class="field-group" style="margin-bottom:12px">
            <label class="field-label">Metode</label>
            <select class="field-input" data-path="dcf.terminalValue.method" style="width:220px">
              <option value="gordon" ${isGordon?'selected':''}>Gordon Growth Model</option>
              <option value="exit" ${!isGordon?'selected':''}>EV/EBITDA Exit Multiple</option>
            </select>
          </div>
          <div class="tv-inputs">
            ${isGordon
              ? wField('Terminalvekstrate (%)', 'dcf.terminalValue.terminalGrowthRate', tv.terminalGrowthRate)
              : wField('Exit EV/EBITDA Multippel', 'dcf.terminalValue.exitMultiple', tv.exitMultiple)}
          </div>
        </div>
        <div class="tv-results">
          <div class="tv-result-row">
            <span class="tv-result-label">Sum PV FCF (projeksjonsperiode)</span>
            <span class="tv-result-value" id="out-sumpv">${fN(res.sumPv)}</span>
          </div>
          <div class="tv-result-row">
            <span class="tv-result-label">Terminalverdi (TV)</span>
            <span class="tv-result-value" id="out-tv">${fN(res.tv)}</span>
          </div>
          <div class="tv-result-row">
            <span class="tv-result-label">PV av terminalverdi</span>
            <span class="tv-result-value" id="out-pvtv">${fN(res.pvTV)}</span>
          </div>
          <div class="tv-result-row" style="font-weight:700;border-top:1px solid #bfdbfe;margin-top:4px;padding-top:8px">
            <span class="tv-result-label">Enterprise Value</span>
            <span class="tv-result-value" id="out-ev2">${fN(res.ev)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderBridge(dcf, res, currPrice, upside) {
  const b = dcf.bridge;
  const upsideHtml = upside !== null
    ? `<span class="${upside >= 0 ? 'upside' : 'downside'}">${upside >= 0 ? '+' : ''}${fP(upside)} vs. kurs</span>`
    : '';
  const totalDebtVal = b.totalDebt !== undefined ? b.totalDebt : (b.netDebt || '0');
  const cashVal = b.cash || '0';
  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Verdsettelsesbro — EV → Aksjeverd</span></div>
    <div class="section-body">
      <div class="bridge-grid">
        <div>
          <table class="bridge-table">
            <tr><td class="bridge-label"><span class="bridge-sign"> </span>Enterprise Value</td>
                <td><span id="out-ev">${fN(res.ev)}</span></td></tr>
            <tr><td class="bridge-label"><span class="bridge-sign">–</span>Total gjeld</td>
                <td><input class="tbl-input" type="number" step="any" data-path="dcf.bridge.totalDebt" value="${totalDebtVal}" style="width:80px;text-align:right"></td></tr>
            <tr><td class="bridge-label"><span class="bridge-sign">+</span>Kontanter</td>
                <td><input class="tbl-input" type="number" step="any" data-path="dcf.bridge.cash" value="${cashVal}" style="width:80px;text-align:right"></td></tr>
            <tr><td class="bridge-label"><span class="bridge-sign">–</span>Minoritetsinteresser</td>
                <td><input class="tbl-input" type="number" step="any" data-path="dcf.bridge.minorities" value="${b.minorities}" style="width:80px;text-align:right"></td></tr>
            <tr><td class="bridge-label"><span class="bridge-sign">+/–</span>Andre justeringer</td>
                <td><input class="tbl-input" type="number" step="any" data-path="dcf.bridge.otherAdjustments" value="${b.otherAdjustments}" style="width:80px;text-align:right"></td></tr>
            <tr class="bridge-total"><td>= Egenkapitalverdi</td>
                <td><span id="out-eq">${fN(res.eq)}</span></td></tr>
          </table>
        </div>
        <div>
          <table class="bridge-table">
            <tr><td class="bridge-label">÷ Antall aksjer (mill.)</td>
                <td><input class="tbl-input" type="number" step="any" data-path="dcf.bridge.sharesOutstanding" value="${b.sharesOutstanding}" style="width:80px;text-align:right"></td></tr>
            <tr class="bridge-price">
                <td>= Implisert aksjekurs</td>
                <td><span id="out-price">${fPr(res.price)}</span></td></tr>
            <tr><td class="bridge-label">Gjeldende kurs</td>
                <td><input class="tbl-input" type="number" step="any" data-path="dcf.bridge.currentPrice" value="${b.currentPrice}" style="width:80px;text-align:right"></td></tr>
            <tr><td class="bridge-label">Oppside / nedside</td>
                <td id="out-upside">${upsideHtml || '—'}</td></tr>
          </table>
        </div>
      </div>
    </div>
  </div>`;
}

function renderSensitivity(company, centralWacc) {
  const matrix = calcSensitivity(company);
  const currPrice = pf(company.dcf.bridge.currentPrice);
  const tgr = pf(company.dcf.terminalValue.terminalGrowthRate) / 100;

  function cellClass(price, w, g) {
    if (Math.abs(w - centralWacc) < 0.001 && Math.abs(g - tgr) < 0.001) return 'sens-neutral';
    if (currPrice <= 0) return '';
    const up = (price - currPrice) / currPrice;
    if (up >  0.25) return 'sens-upside-3';
    if (up >  0.10) return 'sens-upside-2';
    if (up >  0)    return 'sens-upside-1';
    if (up > -0.10) return 'sens-down-1';
    if (up > -0.25) return 'sens-down-2';
    return 'sens-down-3';
  }

  const gValues = matrix[0].map(c => c.g);
  const thead = `<thead><tr>
    <th>WACC \\ TGR</th>
    ${gValues.map(g => `<th>${fP(g)}</th>`).join('')}
  </tr></thead>`;

  const tbody = `<tbody>${matrix.map(row => `<tr>
    <td>${fP(row[0].w)}</td>
    ${row.map(cell => `<td class="${cellClass(cell.price, cell.w, cell.g)}">${fPr(cell.price)}</td>`).join('')}
  </tr>`).join('')}</tbody>`;

  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Sensitivitetsanalyse — WACC vs. Terminalvekstrate</span></div>
    <div class="section-body">
      <div class="sensitivity-wrap">
        <table class="sensitivity-table">${thead}${tbody}</table>
      </div>
      <div class="sens-legend">
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#065f46"></span>&gt;25% oppside</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#10b981"></span>10–25% oppside</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#d1fae5"></span>0–10% oppside</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#fef9c3;border:1px solid #fbbf24"></span>Sentralcase</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#fee2e2"></span>0–10% nedside</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#ef4444"></span>10–25% nedside</span>
        <span class="sens-legend-item"><span class="sens-legend-dot" style="background:#7f1d1d"></span>&gt;25% nedside</span>
      </div>
      <p class="hint" style="margin-top:8px">Tall viser implisert aksjekurs. Farge angir oppside/nedside vs. gjeldende kurs.</p>
    </div>
  </div>`;
}

// ====================================================================
// 10. RENDER: MULTIPLES
// ====================================================================

function renderMultiples(company) {
  const m = company.multiples;
  const stats = multipleStats(m.peers);
  const implied = impliedVals(stats, m.subject);
  const currPrice = pf(m.subject.currentPrice);

  return `
    ${renderSubjectMetrics(m.subject)}
    ${renderPeerTable(m.peers)}
    ${renderMultipleStats(stats)}
    ${renderImpliedValuation(implied, currPrice)}`;
}

function renderSubjectMetrics(s) {
  const fields = [
    ['Omsetning (LTM)', 'multiples.subject.revenue', s.revenue],
    ['EBITDA', 'multiples.subject.ebitda', s.ebitda],
    ['EBIT', 'multiples.subject.ebit', s.ebit],
    ['Nettoresultat', 'multiples.subject.netIncome', s.netIncome],
    ['EPS', 'multiples.subject.eps', s.eps],
    ['Netto gjeld', 'multiples.subject.netDebt', s.netDebt],
    ['Antall aksjer (mill.)', 'multiples.subject.sharesOutstanding', s.sharesOutstanding],
    ['Gjeldende kurs', 'multiples.subject.currentPrice', s.currentPrice],
  ];
  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Nøkkeltall — Analyseobjekt</span></div>
    <div class="section-body">
      <div class="multiples-grid">
        ${fields.map(([lbl,path,val]) => `
          <div class="field-group">
            <label class="field-label">${lbl}</label>
            <input class="field-input" type="number" step="any" data-path="${path}" value="${val}">
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function renderPeerTable(peers) {
  const mults = peers.map(peerMultiples);
  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Sammenlignbare selskaper</span></div>
    <div class="section-body section-body-pad0">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Selskap</th>
            <th>EV</th><th>Omsetning</th><th>EBITDA</th><th>EBIT</th>
            <th>Nettoresultat</th><th>Market Cap</th>
            <th>EV/Rev</th><th>EV/EBITDA</th><th>EV/EBIT</th><th>P/E</th>
            <th></th>
          </tr></thead>
          <tbody id="peer-tbody">
            ${peers.map((p,i) => renderPeerRow(p, i, mults[i])).join('')}
          </tbody>
        </table>
      </div>
      <button class="btn-add-peer" data-action="add-peer">+ Legg til sammenlignbart selskap</button>
    </div>
  </div>`;
}

function renderPeerRow(p, i, m) {
  const pIn = (field, val) => `<td><input class="tbl-input" type="number" step="any" data-path="multiples.peers.${i}.${field}" value="${val}" style="width:75px"></td>`;
  return `<tr>
    <td><input class="tbl-input" type="text" data-path="multiples.peers.${i}.name" value="${esc(p.name)}" style="width:110px;text-align:left"></td>
    ${pIn('ev', p.ev)}${pIn('revenue', p.revenue)}${pIn('ebitda', p.ebitda)}
    ${pIn('ebit', p.ebit)}${pIn('netIncome', p.netIncome)}${pIn('marketCap', p.marketCap)}
    <td id="pm-evrev-${i}" class="row-computed">${fX(m.evRev)}</td>
    <td id="pm-eveb-${i}" class="row-computed">${fX(m.evEbitda)}</td>
    <td id="pm-eveit-${i}" class="row-computed">${fX(m.evEbit)}</td>
    <td id="pm-pe-${i}" class="row-computed">${fX(m.pe)}</td>
    <td><button class="btn-remove-peer" data-action="remove-peer" data-index="${i}">✕</button></td>
  </tr>`;
}

function renderMultipleStats(stats) {
  const keys = ['evRev','evEbitda','evEbit','pe'];
  const labels = { evRev:'EV/Revenue', evEbitda:'EV/EBITDA', evEbit:'EV/EBIT', pe:'P/E' };
  const rows = ['25. persentil','Median','Gjennomsnitt','75. persentil'];
  const vals = key => stats[key] ? [stats[key].p25, stats[key].median, stats[key].mean, stats[key].p75] : [null,null,null,null];

  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Multippelstatistikk</span></div>
    <div class="section-body section-body-pad0">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Statistikk</th>
            ${keys.map(k => `<th>${labels[k]}</th>`).join('')}
          </tr></thead>
          <tbody id="stats-tbody">
            ${rows.map((r,ri) => `<tr class="row-computed">
              <td><b>${r}</b></td>
              ${keys.map(k => `<td id="stat-${k}-${ri}">${fX(vals(k)[ri])}</td>`).join('')}
            </tr>`).join('')}
            <tr class="row-computed" style="font-size:11px;color:var(--text-muted)">
              <td>Antall selskaper</td>
              ${keys.map(k => `<td>${stats[k] ? stats[k].n : 0}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function renderImpliedValuation(implied, currPrice) {
  if (!implied.length) {
    return `<div class="section-card"><div class="section-header"><span class="section-title">Implisert verdsettelse</span></div>
      <div class="section-body"><p style="color:var(--text-muted)">Legg til sammenlignbare selskaper og fyll inn nøkkeltall for å se implisert verdsettelse.</p></div></div>`;
  }

  const allMids = implied.map(r => r.mid).filter(v => isFinite(v));
  const globalMin = Math.min(...implied.map(r => r.low).filter(isFinite), currPrice || Infinity);
  const globalMax = Math.max(...implied.map(r => r.high).filter(isFinite), currPrice || -Infinity);
  const range = globalMax - globalMin || 1;

  const bars = implied.map(row => {
    const left = ((row.low - globalMin) / range * 100).toFixed(1);
    const width = (((row.high - row.low) / range) * 100).toFixed(1);
    return `<div class="football-row">
      <div class="football-name">${row.name}</div>
      <div class="football-bar-wrap">
        <div class="football-bar" style="margin-left:${left}%;width:${width}%"></div>
      </div>
      <div class="football-prices">
        <span class="football-low">${fPr(row.low)}</span>
        <span class="football-mid">${fPr(row.mid)}</span>
        <span class="football-high">${fPr(row.high)}</span>
      </div>
    </div>`;
  }).join('');

  const currLine = currPrice > 0
    ? `<div class="current-price-line">Gjeldende aksjekurs: <span class="current-price-badge">${fPr(currPrice)}</span></div>`
    : '';

  return `
  <div class="section-card">
    <div class="section-header"><span class="section-title">Implisert verdsettelse — Football Field</span></div>
    <div class="section-body section-body-pad0">
      <div class="football-field">
        <div style="padding:12px 16px 4px;display:flex;gap:24px;font-size:11px;color:var(--text-muted);border-bottom:1px solid var(--border)">
          <span style="width:100px"></span><span style="flex:1"></span>
          <div class="football-prices"><span class="football-low">25. pctl</span><span class="football-mid">Median</span><span class="football-high">75. pctl</span></div>
        </div>
        ${bars}
        ${currLine}
      </div>
    </div>
  </div>
  <div class="section-card">
    <div class="section-header"><span class="section-title">Verdsettelsessammendrag</span></div>
    <div class="section-body section-body-pad0">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Metodikk</th><th>Lav (25. pctl)</th><th>Mid (Median)</th><th>Høy (75. pctl)</th>
            ${currPrice > 0 ? '<th>Oppside (mid)</th>' : ''}
          </tr></thead>
          <tbody>
            ${implied.map(row => {
              const up = currPrice > 0 ? (row.mid - currPrice) / currPrice : null;
              return `<tr>
                <td><b>${row.name}</b></td>
                <td>${fPr(row.low)}</td>
                <td><b>${fPr(row.mid)}</b></td>
                <td>${fPr(row.high)}</td>
                ${currPrice > 0 ? `<td class="${up >= 0 ? 'upside' : 'downside'}">${up >= 0 ? '+' : ''}${fP(up)}</td>` : ''}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ====================================================================
// 11. MODAL
// ====================================================================

function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('modal-content').innerHTML = '';
}

function showAddFolderModal() {
  showModal(`
    <div class="modal-header">
      <h3>Opprett mappe</h3>
      <button class="btn-close-modal" data-action="close-modal">✕</button>
    </div>
    <div class="modal-body">
      <div class="field-group">
        <label class="field-label">Mappenavn *</label>
        <input class="field-input" id="new-folder-name" placeholder="f.eks. Energi, Langsiktig, Watchlist...">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-action="close-modal">Avbryt</button>
      <button class="btn btn-primary" data-action="confirm-add-folder">Opprett</button>
    </div>`);
  setTimeout(() => document.getElementById('new-folder-name')?.focus(), 50);
}

function showAddCompanyModal() {
  showModal(`
    <div class="modal-header">
      <h3>Legg til selskap</h3>
      <button class="btn-close-modal" data-action="close-modal">✕</button>
    </div>
    <div class="modal-body">
      <div class="field-group" style="position:relative">
        <label class="field-label">Selskapsnavn * <span style="font-weight:400;color:#94a3b8">(søk blant Oslo Børs-selskaper)</span></label>
        <input class="field-input" id="new-name" placeholder="Begynn å skrive..." autocomplete="off">
        <div id="ac-dropdown" class="ac-dropdown" style="display:none"></div>
      </div>
      <div class="field-group">
        <label class="field-label">Ticker *</label>
        <input class="field-input" id="new-ticker" placeholder="f.eks. EQNR">
      </div>
      <div class="field-group">
        <label class="field-label">Sektor</label>
        <select class="field-input" id="new-sector">
          ${SECTORS.map(s => `<option>${s}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">Valuta</label>
        <select class="field-input" id="new-currency">
          ${CURRENCIES.map(c => `<option>${c}</option>`).join('')}
        </select>
      </div>
      ${getFolders().length ? `
      <div class="field-group">
        <label class="field-label">Legg i mappe</label>
        <select class="field-input" id="new-folder">
          <option value="">Ingen mappe</option>
          ${getFolders().map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}
        </select>
      </div>` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-action="close-modal">Avbryt</button>
      <button class="btn btn-primary" data-action="confirm-add-company">Legg til</button>
    </div>`);

  // Wire up autocomplete after modal is in DOM
  initAutocomplete();
}

function initAutocomplete() {
  const nameInput  = document.getElementById('new-name');
  const tickerInput = document.getElementById('new-ticker');
  const sectorSel  = document.getElementById('new-sector');
  const dropdown   = document.getElementById('ac-dropdown');
  if (!nameInput || !dropdown) return;

  let activeIdx = -1;

  function showDropdown(items) {
    if (!items.length) { dropdown.style.display = 'none'; return; }
    activeIdx = -1;
    dropdown.innerHTML = items.map((c, i) => `
      <div class="ac-item" data-index="${i}" data-name="${esc(c.name)}" data-ticker="${esc(c.ticker)}" data-sector="${esc(c.sector)}">
        <span class="ac-ticker">${esc(c.ticker)}</span>
        <span class="ac-name">${esc(c.name)}</span>
        <span class="ac-sector">${esc(c.sector)}</span>
      </div>`).join('');
    dropdown.style.display = 'block';
  }

  function hideDropdown() {
    dropdown.style.display = 'none';
    activeIdx = -1;
  }

  function selectItem(el) {
    nameInput.value   = el.dataset.name;
    tickerInput.value = el.dataset.ticker;
    const sec = el.dataset.sector;
    if (sectorSel) {
      const opt = [...sectorSel.options].find(o => o.value === sec);
      if (opt) sectorSel.value = sec;
    }
    hideDropdown();
  }

  nameInput.addEventListener('input', () => {
    const q = nameInput.value.trim().toLowerCase();
    if (q.length < 1) { hideDropdown(); return; }
    const matches = OSLO_BORS_DB.filter(c =>
      c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q)
    ).slice(0, 10);
    showDropdown(matches);
  });

  nameInput.addEventListener('keydown', e => {
    const items = dropdown.querySelectorAll('.ac-item');
    if (!items.length || dropdown.style.display === 'none') return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('ac-item-active', i === activeIdx));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      items.forEach((el, i) => el.classList.toggle('ac-item-active', i === activeIdx));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectItem(items[activeIdx]);
    } else if (e.key === 'Escape') {
      hideDropdown();
    }
  });

  dropdown.addEventListener('mousedown', e => {
    const item = e.target.closest('.ac-item');
    if (item) { e.preventDefault(); selectItem(item); }
  });

  document.addEventListener('mousedown', e => {
    if (!nameInput.contains(e.target) && !dropdown.contains(e.target)) hideDropdown();
  }, { once: false });
}

function initPeerAutocomplete() {
  // Create floating dropdown once
  let dropdown = document.getElementById('peer-ac-dropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'peer-ac-dropdown';
    dropdown.className = 'ac-dropdown peer-ac-dropdown';
    dropdown.style.display = 'none';
    document.body.appendChild(dropdown);
  }

  let activeInput = null;
  let activeIdx   = -1;

  function positionDropdown(input) {
    const r = input.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top      = (r.bottom + 4) + 'px';
    dropdown.style.left     = r.left + 'px';
    dropdown.style.width    = Math.max(r.width, 220) + 'px';
    dropdown.style.right    = 'auto';
  }

  function showDropdown(items, input) {
    if (!items.length) { dropdown.style.display = 'none'; return; }
    activeIdx = -1;
    positionDropdown(input);
    dropdown.innerHTML = items.map((c, i) => `
      <div class="ac-item" data-index="${i}" data-name="${esc(c.name)}" data-ticker="${esc(c.ticker)}">
        <span class="ac-ticker">${esc(c.ticker)}</span>
        <span class="ac-name">${esc(c.name)}</span>
      </div>`).join('');
    dropdown.style.display = 'block';
  }

  function hideDropdown() {
    dropdown.style.display = 'none';
    activeIdx   = -1;
    activeInput = null;
  }

  function selectItem(el) {
    if (!activeInput) return;
    activeInput.value = el.dataset.name;
    activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    hideDropdown();
  }

  // Input event — filter and show matches
  document.addEventListener('input', e => {
    const inp = e.target;
    if (!inp.matches('input[data-path^="multiples.peers."][data-path$=".name"]')) return;
    activeInput = inp;
    const q = inp.value.trim().toLowerCase();
    if (q.length < 1) { dropdown.style.display = 'none'; return; }
    const matches = OSLO_BORS_DB.filter(c =>
      c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q)
    ).slice(0, 10);
    showDropdown(matches, inp);
  }, true);

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (dropdown.style.display === 'none') return;
    const items = dropdown.querySelectorAll('.ac-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('ac-item-active', i === activeIdx));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      items.forEach((el, i) => el.classList.toggle('ac-item-active', i === activeIdx));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectItem(items[activeIdx]);
    } else if (e.key === 'Escape') {
      hideDropdown();
    }
  }, true);

  // Click to select
  dropdown.addEventListener('mousedown', e => {
    const item = e.target.closest('.ac-item');
    if (item) { e.preventDefault(); selectItem(item); }
  });

  // Hide when clicking outside
  document.addEventListener('mousedown', e => {
    if (dropdown.style.display === 'none') return;
    if (!dropdown.contains(e.target) && e.target !== activeInput) hideDropdown();
  });
}

// Init peer autocomplete once on page load (uses event delegation — works for dynamically rendered rows)
document.addEventListener('DOMContentLoaded', initPeerAutocomplete);

// ====================================================================
// 12. UPDATE HELPERS (partial DOM update without full re-render)
// ====================================================================

function refreshDCFOutputs(company) {
  const { ke, kdAt, wacc, we, wd } = calcWACC(company.dcf.wacc);
  const res = calcDCF(company);
  const { rows } = res;
  const currPrice = pf(company.dcf.bridge.currentPrice);

  set('out-ke', fP(ke));
  set('out-kdat', fP(kdAt));
  set('out-wacc', fP(wacc));
  set('out-we', fP(we));
  set('out-wd', fP(wd));

  rows.forEach(r => {
    set(`out-rev-${r.year}`, fN(r.rev));
    set(`out-cogs-${r.year}`, fN(r.cogs));
    set(`out-grossP-${r.year}`, fN(r.grossP));
    set(`out-grossM-${r.year}`, r.rev > 0 ? fP(r.grossP/r.rev) : '—');
    set(`out-sga-${r.year}`, fN(r.sga));
    set(`out-rd-${r.year}`, fN(r.rd));
    set(`out-oth-${r.year}`, fN(r.oth));
    set(`out-ebitda-${r.year}`, fN(r.ebitda));
    set(`out-ebitdam-${r.year}`, r.rev > 0 ? fP(r.ebitda/r.rev) : '—');
    set(`out-da-${r.year}`, fN(r.da));
    set(`out-ebit-${r.year}`, fN(r.ebit));
    set(`out-ebitm-${r.year}`, r.rev > 0 ? fP(r.ebit/r.rev) : '—');
    set(`out-capex-${r.year}`, fN(r.capex));
    set(`out-nwc-${r.year}`, fN(r.nwc));
    set(`out-nopat-${r.year}`, fN(r.nopat));
    set(`out-fcf-${r.year}`, fN(r.fcf));
    set(`out-df-${r.year}`, r.df.toFixed(4));
    set(`out-pvfcf-${r.year}`, fN(r.pvFcf));
  });

  set('out-sumpv', fN(res.sumPv));
  set('out-tv', fN(res.tv));
  set('out-pvtv', fN(res.pvTV));
  set('out-ev', fN(res.ev));
  set('out-ev2', fN(res.ev));
  set('out-eq', fN(res.eq));
  set('out-price', fPr(res.price));

  const upside = currPrice > 0 ? (res.price - currPrice) / currPrice : null;
  const uEl = document.getElementById('out-upside');
  if (uEl && upside !== null) {
    uEl.innerHTML = `<span class="${upside >= 0 ? 'upside' : 'downside'}">${upside >= 0 ? '+' : ''}${fP(upside)} vs. kurs</span>`;
  }

  // Refresh sensitivity
  const sensWrap = document.querySelector('.sensitivity-wrap');
  if (sensWrap) {
    const matrix = calcSensitivity(company);
    const tgr = pf(company.dcf.terminalValue.terminalGrowthRate) / 100;
    function cellClass(price, w, g) {
      if (Math.abs(w - wacc) < 0.001 && Math.abs(g - tgr) < 0.001) return 'sens-neutral';
      if (currPrice <= 0) return '';
      const up = (price - currPrice) / currPrice;
      if (up > 0.25) return 'sens-upside-3';
      if (up > 0.10) return 'sens-upside-2';
      if (up > 0)    return 'sens-upside-1';
      if (up > -0.10) return 'sens-down-1';
      if (up > -0.25) return 'sens-down-2';
      return 'sens-down-3';
    }
    const gValues = matrix[0].map(c => c.g);
    const thead = `<thead><tr><th>WACC \\ TGR</th>${gValues.map(g=>`<th>${fP(g)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${matrix.map(row=>`<tr><td>${fP(row[0].w)}</td>${row.map(cell=>`<td class="${cellClass(cell.price,cell.w,cell.g)}">${fPr(cell.price)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    sensWrap.innerHTML = `<table class="sensitivity-table">${thead}${tbody}</table>`;
  }
}

function refreshMultiplesOutputs(company) {
  const m = company.multiples;
  const stats = multipleStats(m.peers);

  m.peers.forEach((p, i) => {
    const mu = peerMultiples(p);
    set(`pm-evrev-${i}`, fX(mu.evRev));
    set(`pm-eveb-${i}`, fX(mu.evEbitda));
    set(`pm-eveit-${i}`, fX(mu.evEbit));
    set(`pm-pe-${i}`, fX(mu.pe));
  });

  const keys = ['evRev','evEbitda','evEbit','pe'];
  const vals = key => stats[key] ? [stats[key].p25, stats[key].median, stats[key].mean, stats[key].p75] : [null,null,null,null];
  keys.forEach(key => {
    vals(key).forEach((v, ri) => set(`stat-${key}-${ri}`, fX(v)));
  });
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ====================================================================
// 13. DEEP SET UTILITY
// ====================================================================

function setNestedVal(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    // Handle array index
    const next = parts[i+1];
    const isNextIndex = /^\d+$/.test(next);
    if (cur[p] === undefined) cur[p] = isNextIndex ? [] : {};
    cur = cur[p];
  }
  const last = parts[parts.length - 1];
  cur[last] = value;
}

// ====================================================================
// 14. EVENT HANDLING
// ====================================================================

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'open-company') {
    e.stopPropagation();
    state.currentTab = 'dcf';
    renderCompany(btn.dataset.id);
  }
  else if (action === 'delete-company') {
    e.stopPropagation();
    const id = btn.dataset.id;
    const c = getCompany(id);
    if (!c) return;
    if (!confirm(`Slett "${c.name}"? Denne handlingen kan ikke angres.`)) return;
    deleteCompany(id);
    if (state.currentId === id) state.currentId = null;
    renderDashboard();
  }
  else if (action === 'add-company-btn' || btn.id === 'add-company-btn') {
    showAddCompanyModal();
  }
  else if (action === 'close-modal') {
    closeModal();
  }
  else if (action === 'confirm-add-company') {
    const name     = document.getElementById('new-name').value.trim();
    const ticker   = document.getElementById('new-ticker').value.trim();
    const sector   = document.getElementById('new-sector').value;
    const currency = document.getElementById('new-currency').value;
    const folderId = document.getElementById('new-folder')?.value || null;
    if (!name || !ticker) { alert('Navn og ticker er påkrevd.'); return; }
    const company = createCompany({ name, ticker, sector, currency, folderId });
    closeModal();
    state.currentTab = 'dcf';
    renderCompany(company.id);
  }
  else if (action === 'switch-tab') {
    state.currentTab = btn.dataset.tab;
    if (state.currentId) renderCompany(state.currentId);
  }
  else if (action === 'set-proj-years') {
    if (!state.currentId) return;
    const company = getCompany(state.currentId);
    company.dcf.projectionYears = parseInt(btn.dataset.years);
    saveCompany(company);
    renderCompany(state.currentId);
  }
  else if (action === 'add-peer') {
    if (!state.currentId) return;
    const company = getCompany(state.currentId);
    company.multiples.peers.push({ id: crypto.randomUUID(), name:'', ev:'', revenue:'', ebitda:'', ebit:'', netIncome:'', marketCap:'' });
    saveCompany(company);
    // Re-render multiples tab
    const el = document.getElementById('tab-content');
    if (el) { state.currentTab = 'multiples'; el.innerHTML = renderMultiples(company); }
  }
  else if (action === 'remove-peer') {
    if (!state.currentId) return;
    const company = getCompany(state.currentId);
    company.multiples.peers.splice(parseInt(btn.dataset.index), 1);
    saveCompany(company);
    const el = document.getElementById('tab-content');
    if (el) { state.currentTab = 'multiples'; el.innerHTML = renderMultiples(company); }
  }
  else if (action === 'add-folder') {
    showAddFolderModal();
  }
  else if (action === 'confirm-add-folder') {
    const name = document.getElementById('new-folder-name')?.value.trim();
    if (!name) { alert('Mappenavn er påkrevd.'); return; }
    createFolder(name);
    closeModal();
    renderDashboard();
  }
  else if (action === 'delete-folder') {
    e.stopPropagation();
    const id = btn.dataset.id;
    const f = getFolders().find(x => x.id === id);
    if (!f) return;
    const members = getCompanies().filter(c => c.folderId === id).length;
    const msg = members > 0
      ? `Slett mappen "${f.name}"? ${members} selskap${members !== 1 ? 'er' : ''} flyttes til "Uten mappe".`
      : `Slett mappen "${f.name}"?`;
    if (!confirm(msg)) return;
    deleteFolder(id);
    if (state.currentId) renderCompany(state.currentId);
    else renderDashboard();
  }
  else if (action === 'toggle-folder') {
    e.stopPropagation();
    const id = btn.dataset.id;
    if (state.expandedFolders.has(id)) state.expandedFolders.delete(id);
    else state.expandedFolders.add(id);
    renderSidebar();
  }
});

// Add-company button click (direct ID handler as backup)
document.getElementById('add-company-btn').addEventListener('click', () => showAddCompanyModal());

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// Input changes — update state + refresh outputs
document.addEventListener('input', e => {
  const el = e.target;
  const path = el.dataset.path;
  if (!path || !state.currentId) return;

  const company = getCompany(state.currentId);
  if (!company) return;

  setNestedVal(company, path, el.value);
  saveCompany(company);

  if (path.startsWith('dcf.')) {
    refreshDCFOutputs(company);
  } else if (path.startsWith('multiples.')) {
    refreshMultiplesOutputs(company);
  }
});

// Change events — terminal value method + folder selector
document.addEventListener('change', e => {
  const el = e.target;

  // Folder assignment from company header
  if (el.dataset.action === 'set-company-folder') {
    const id = el.dataset.id;
    const cs = getCompanies();
    const idx = cs.findIndex(c => c.id === id);
    if (idx !== -1) {
      cs[idx].folderId = el.value || null;
      cs[idx].updatedAt = Date.now();
      saveCompanies(cs);
      renderSidebar();
    }
    return;
  }

  const path = el.dataset.path;
  if (!path || !state.currentId) return;
  if (path !== 'dcf.terminalValue.method') return;

  const company = getCompany(state.currentId);
  if (!company) return;
  company.dcf.terminalValue.method = el.value;
  saveCompany(company);
  renderCompany(state.currentId);
});

// ====================================================================
// 15. UTILITY
// ====================================================================

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ====================================================================
// 16. INIT
// ====================================================================

renderDashboard();
