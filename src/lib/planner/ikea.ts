import type { ItemModel } from "@/lib/planner/plan";

/*
 * A catalogue of common IKEA furniture, to add a piece without looking up its
 * measures. Outer dimensions in whole centimetres: width along the wall, depth
 * front to back, height. Beds are the frame, not the mattress.
 *
 * The figures were written down from memory. A sample of 30 was checked against
 * ikea.se in November 2026: 28 were right, and the two that were not (BESTÅ's
 * depth, IVAR's width) are corrected here, along with their siblings. The rest
 * are unchecked, and IKEA revises and retires products (MALM is on its way out),
 * so the planner says the figures are approximate. A piece added from here is an ordinary piece: every measure can
 * be corrected afterwards.
 */

export type IkeaCategory = "Sängar" | "Förvaring" | "Garderober" | "Bord och skrivbord" | "Stolar" | "Soffor och fåtöljer";
export const IKEA_CATEGORIES: IkeaCategory[] = ["Sängar", "Förvaring", "Garderober", "Bord och skrivbord", "Stolar", "Soffor och fåtöljer"];

export type IkeaProduct = { name: string; category: IkeaCategory; w: number; d: number; h: number; model: ItemModel };

const list = (category: IkeaCategory, model: ItemModel, rows: [string, number, number, number][]): IkeaProduct[] =>
  rows.map(([name, w, d, h]) => ({ name, category, w, d, h, model }));

export const IKEA: IkeaProduct[] = [
  // Height is where the mattress top ends up, which is what matters in the 3D view, not the headboard.
  ...list("Sängar", "block", [
    ["MALM säng 90", 105, 209, 45], ["MALM säng 120", 135, 209, 45], ["MALM säng 140", 156, 209, 45],
    ["MALM säng 160", 176, 209, 45], ["MALM säng 180", 196, 209, 45],
    ["NEIDEN säng 90", 94, 205, 45], ["SLATTUM säng 140", 144, 206, 45], ["SLATTUM säng 160", 164, 206, 45],
    ["BRIMNES säng 140", 146, 206, 47], ["BRIMNES säng 160", 166, 206, 47],
    ["HEMNES säng 160", 174, 211, 45], ["HEMNES dagbädd", 89, 209, 86],
    ["TARVA säng 160", 168, 209, 45], ["SONGESAND säng 160", 173, 207, 45],
    ["UTÅKER säng 80", 83, 205, 46], ["Kontinentalsäng 160", 160, 210, 60], ["Kontinentalsäng 180", 180, 210, 60],
  ]),
  ...list("Förvaring", "block", [
    ["KALLAX 1×4", 42, 39, 147], ["KALLAX 2×2", 77, 39, 77], ["KALLAX 2×4 stående", 77, 39, 147],
    ["KALLAX 2×4 liggande", 147, 39, 77], ["KALLAX 4×4", 147, 39, 147],
    ["BILLY bokhylla 80", 80, 28, 202], ["BILLY bokhylla 40", 40, 28, 202], ["BILLY bokhylla låg", 80, 28, 106],
    ["HEMNES bokhylla", 90, 37, 197], ["IVAR hylla 30 djup", 89, 30, 179], ["IVAR hylla 50 djup", 89, 50, 179],
    ["HEJNE hylla", 78, 31, 171], ["VITTSJÖ hylla smal", 51, 36, 175], ["VITTSJÖ hylla bred", 100, 36, 175],
    ["MALM byrå 2 lådor", 40, 48, 55], ["MALM byrå 3 lådor", 80, 48, 78], ["MALM byrå 4 lådor", 80, 48, 100],
    ["MALM byrå 6 lådor hög", 80, 48, 123], ["MALM byrå 6 lådor bred", 160, 48, 78],
    ["HEMNES byrå 3 lådor", 108, 50, 96], ["HEMNES byrå 8 lådor", 160, 50, 96],
    ["KULLEN byrå 3 lådor", 70, 40, 72], ["KULLEN byrå 5 lådor", 70, 40, 112], ["KULLEN byrå 6 lådor", 140, 40, 72],
    ["RAST byrå", 62, 30, 70], ["ALEX lådhurts", 36, 58, 70], ["ALEX lådhurts bred", 67, 48, 66],
    ["HELMER lådhurts", 28, 43, 69], ["TROFAST hög", 46, 30, 94], ["TROFAST låg bred", 99, 44, 56], ["TROFAST hög bred", 99, 44, 94],
    ["BESTÅ tv-bänk 120", 120, 40, 38], ["BESTÅ tv-bänk 180", 180, 40, 38], ["BESTÅ skåp 60", 60, 40, 64],
    ["LACK tv-bänk 90", 90, 26, 45], ["LACK tv-bänk 120", 120, 35, 36], ["LACK tv-bänk 160", 160, 35, 36],
    ["EKET skåp", 35, 35, 35], ["RÅSKOG rullvagn", 35, 45, 78],
    ["HEMNES skoskåp", 89, 30, 127], ["BISSA skoskåp", 49, 28, 93], ["TJUSIG skohylla", 79, 32, 37],
    ["HEMNES nattduksbord", 46, 35, 70], ["KNARREVIK nattduksbord", 37, 28, 45],
  ]),
  ...list("Garderober", "block", [
    ["PAX 50 hög", 50, 58, 236], ["PAX 75 hög", 75, 58, 236], ["PAX 100 hög", 100, 58, 236],
    ["PAX 50 låg", 50, 58, 201], ["PAX 100 låg", 100, 58, 201], ["PAX 100 grund", 100, 35, 236],
    ["PAX 150 skjutdörrar", 150, 66, 236], ["PAX 200 skjutdörrar", 200, 66, 236],
    ["BRIMNES garderob 2 dörrar", 78, 50, 190], ["BRIMNES garderob 3 dörrar", 117, 50, 190],
    ["KLEPPSTAD garderob 2 dörrar", 79, 55, 176], ["KLEPPSTAD garderob 3 dörrar", 117, 55, 176],
    ["MULIG klädställning", 99, 46, 151],
  ]),
  ...list("Bord och skrivbord", "table", [
    ["LACK sidobord", 55, 55, 45], ["LACK soffbord", 90, 55, 45], ["LACK soffbord stort", 118, 78, 45],
    ["LAGKAPTEN skrivbord 120", 120, 60, 73], ["LAGKAPTEN skrivbord 140", 140, 60, 73],
    ["LAGKAPTEN skrivbord 160", 160, 80, 73], ["LAGKAPTEN skrivbord 200", 200, 60, 73],
    ["LINNMON skrivbord 100", 100, 60, 73], ["LINNMON skrivbord 150", 150, 75, 73],
    ["MICKE skrivbord 73", 73, 50, 75], ["MICKE skrivbord 105", 105, 50, 75], ["MICKE skrivbord 142", 142, 50, 75],
    ["MALM skrivbord", 140, 65, 73], ["ALEX skrivbord 100", 100, 48, 76], ["ALEX skrivbord 132", 132, 58, 76],
    ["BEKANT skrivbord 120", 120, 80, 75], ["BEKANT skrivbord 160", 160, 80, 75],
    ["TROTTEN skrivbord 120", 120, 70, 75], ["TROTTEN skrivbord 160", 160, 80, 75],
    ["IDÅSEN skrivbord 120", 120, 70, 75], ["IDÅSEN skrivbord 160", 160, 80, 75],
    ["MELLTORP bord 75", 75, 75, 74], ["MELLTORP bord 125", 125, 75, 74],
    ["NORDEN klaffbord hopfällt", 26, 80, 74], ["NORDEN klaffbord en klaff", 89, 80, 74], ["NORDEN klaffbord utfällt", 152, 80, 74],
    ["INGO bord", 120, 75, 73], ["EKEDALEN bord 120", 120, 80, 75], ["EKEDALEN bord utdraget", 180, 80, 75],
    ["LISABO bord", 140, 78, 74],
  ]),
  // Round tables and stools: the cylinder model, with the diameter as both width and depth.
  ...list("Bord och skrivbord", "cylinder", [["DOCKSTA bord runt", 103, 103, 75], ["GLADOM brickbord", 45, 45, 53]]),
  ...list("Stolar", "chair", [
    ["ADDE stol", 39, 47, 77], ["TEODORES stol", 46, 54, 80], ["STEFAN stol", 42, 49, 90],
    ["INGOLF stol", 43, 52, 91], ["ODGER stol", 45, 51, 81], ["BERGMUND stol", 52, 59, 96],
  ]),
  ...list("Stolar", "office-chair", [
    ["MARKUS kontorsstol", 62, 60, 135], ["FLINTAN kontorsstol", 74, 69, 114], ["LÅNGFJÄLL kontorsstol", 68, 68, 104],
    ["JÄRVFJÄLLET kontorsstol", 68, 68, 140], ["MILLBERGET kontorsstol", 70, 70, 127], ["RENBERGET kontorsstol", 59, 65, 108],
  ]),
  ...list("Stolar", "cylinder", [["FROSTA pall", 35, 35, 45], ["MARIUS pall", 32, 32, 45]]),
  ...list("Soffor och fåtöljer", "block", [
    ["KLIPPAN 2-sitssoffa", 180, 88, 66], ["GLOSTAD 2-sitssoffa", 185, 78, 66],
    ["EKTORP 2-sitssoffa", 179, 88, 88], ["EKTORP 3-sitssoffa", 218, 88, 88],
    ["KIVIK 3-sitssoffa", 228, 95, 83], ["VIMLE 3-sitssoffa", 241, 98, 83],
    ["LANDSKRONA 3-sitssoffa", 204, 89, 78], ["SÖDERHAMN 3-sitssoffa", 198, 99, 83],
    ["FRIHETEN hörnbäddsoffa", 230, 151, 66], ["FRIHETEN 3-sits bäddsoffa", 225, 105, 83], ["LYCKSELE bäddsoffa", 142, 100, 87],
    ["POÄNG fåtölj", 68, 82, 100], ["STRANDMON öronlappsfåtölj", 82, 96, 101], ["PELLO fåtölj", 67, 85, 96], ["EKERÖ fåtölj", 70, 73, 75],
  ]),
];
