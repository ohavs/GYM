'use client';

/**
 * A small, opinionated food list.
 *
 * Not a nutrition database — those are large, licensed, and beside the point
 * here. This is the shortlist a coach or a trainee reaches for again and
 * again, with a portion a person can picture and a calorie figure that is
 * close enough to plan with. Anything missing is typed by hand, and can be
 * added to the list from the spot where it was typed.
 */
export type FoodCategory =
  | 'protein'
  | 'carb'
  | 'produce'
  | 'dairy'
  | 'fat'
  | 'snack'
  | 'drink';

export type Food = {
  id: string;
  name: string;
  /** The portion the calories describe, in words. */
  amount: string;
  kcal: number;
  protein?: number;
  category: FoodCategory;
  /** Added by this user rather than shipped with the app. */
  custom?: boolean;
};

export const CATEGORY_LABEL: Record<FoodCategory, string> = {
  protein: 'חלבונים',
  carb: 'פחמימות',
  produce: 'ירקות ופירות',
  dairy: 'חלב וביצים',
  fat: 'שומנים',
  snack: 'נשנושים',
  drink: 'משקאות',
};

export const CATEGORY_ORDER: FoodCategory[] = [
  'protein',
  'carb',
  'produce',
  'dairy',
  'fat',
  'snack',
  'drink',
];

const f = (
  id: string,
  name: string,
  amount: string,
  kcal: number,
  category: FoodCategory,
  protein?: number,
): Food => ({ id, name, amount, kcal, category, protein });

/** Portions are the ones people actually say out loud, not round grams. */
export const FOODS: Food[] = [
  // חלבונים
  f('chicken-breast', 'חזה עוף', '150 גרם', 250, 'protein', 46),
  f('chicken-thigh', 'שוקיים עוף', '150 גרם', 310, 'protein', 38),
  f('turkey', 'הודו', '150 גרם', 240, 'protein', 44),
  f('beef', 'בשר בקר טחון', '150 גרם', 340, 'protein', 38),
  f('steak', 'סטייק אנטריקוט', '200 גרם', 480, 'protein', 46),
  f('salmon', 'סלמון', '150 גרם', 310, 'protein', 34),
  f('tuna-can', 'טונה בשימורים במים', 'קופסה', 110, 'protein', 25),
  f('white-fish', 'דג לבן', '150 גרם', 170, 'protein', 33),
  f('tofu', 'טופו', '150 גרם', 120, 'protein', 13),
  f('chickpeas', 'חומוס גרגרים מבושל', 'כוס', 270, 'protein', 15),
  f('lentils', 'עדשים מבושלות', 'כוס', 230, 'protein', 18),
  f('whey', 'אבקת חלבון', 'סקופ', 120, 'protein', 24),
  f('schnitzel', 'שניצל עוף מטוגן', '150 גרם', 400, 'protein', 30),

  // פחמימות
  f('rice-white', 'אורז לבן מבושל', 'כוס', 205, 'carb', 4),
  f('rice-brown', 'אורז מלא מבושל', 'כוס', 215, 'carb', 5),
  f('pasta', 'פסטה מבושלת', 'כוס', 220, 'carb', 8),
  f('bread-whole', 'לחם מלא', 'פרוסה', 80, 'carb', 4),
  f('bread-white', 'לחם לבן', 'פרוסה', 75, 'carb', 3),
  f('pita', 'פיתה', 'יחידה', 180, 'carb', 6),
  f('potato', 'תפוח אדמה אפוי', 'בינוני', 160, 'carb', 4),
  f('sweet-potato', 'בטטה אפויה', 'בינונית', 180, 'carb', 4),
  f('oats', 'שיבולת שועל', '½ כוס יבש', 150, 'carb', 5),
  f('quinoa', 'קינואה מבושלת', 'כוס', 220, 'carb', 8),
  f('couscous', 'קוסקוס מבושל', 'כוס', 175, 'carb', 6),
  f('tortilla', 'טורטייה', 'יחידה', 150, 'carb', 4),
  f('granola', 'גרנולה', '½ כוס', 220, 'carb', 5),

  // ירקות ופירות
  f('salad', 'סלט ירקות', 'קערה', 60, 'produce', 2),
  f('cucumber', 'מלפפון', 'יחידה', 25, 'produce'),
  f('tomato', 'עגבנייה', 'יחידה', 25, 'produce'),
  f('broccoli', 'ברוקולי מאודה', 'כוס', 55, 'produce', 4),
  f('green-beans', 'שעועית ירוקה', 'כוס', 45, 'produce', 2),
  f('banana', 'בננה', 'יחידה', 105, 'produce', 1),
  f('apple', 'תפוח', 'יחידה', 95, 'produce'),
  f('orange', 'תפוז', 'יחידה', 70, 'produce', 1),
  f('grapes', 'ענבים', 'כוס', 105, 'produce', 1),
  f('watermelon', 'אבטיח', 'פרוסה', 85, 'produce', 2),
  f('dates', 'תמרים', '2 יחידות', 130, 'produce', 1),
  f('avocado', 'אבוקדו', 'חצי', 160, 'produce', 2),

  // חלב וביצים
  f('egg', 'ביצה', 'יחידה', 75, 'dairy', 6),
  f('egg-white', 'חלבון ביצה', 'יחידה', 17, 'dairy', 4),
  f('omelette', 'חביתה משתי ביצים', 'מנה', 180, 'dairy', 13),
  f('cottage', 'קוטג׳ 5%', 'גביע 250 גרם', 250, 'dairy', 28),
  f('yogurt', 'יוגורט 3%', 'גביע', 130, 'dairy', 7),
  f('greek-yogurt', 'יוגורט יווני 0%', 'גביע 150 גרם', 90, 'dairy', 15),
  f('milk', 'חלב 3%', 'כוס', 150, 'dairy', 8),
  f('milk-light', 'חלב 1%', 'כוס', 100, 'dairy', 8),
  f('cheese-yellow', 'גבינה צהובה', 'פרוסה', 80, 'dairy', 6),
  f('cheese-white', 'גבינה לבנה 5%', '3 כפות', 90, 'dairy', 9),
  f('labneh', 'לבנה', '2 כפות', 90, 'dairy', 4),

  // שומנים
  f('olive-oil', 'שמן זית', 'כף', 120, 'fat'),
  f('tahini', 'טחינה גולמית', 'כף', 90, 'fat', 3),
  f('peanut-butter', 'חמאת בוטנים', 'כף', 95, 'fat', 4),
  f('almonds', 'שקדים', 'חופן', 165, 'fat', 6),
  f('walnuts', 'אגוזי מלך', 'חופן', 185, 'fat', 4),
  f('butter', 'חמאה', 'כף', 100, 'fat'),
  f('mayo', 'מיונז', 'כף', 95, 'fat'),

  // נשנושים
  f('protein-bar', 'חטיף חלבון', 'יחידה', 200, 'snack', 20),
  f('rice-cake', 'פריכית אורז', 'יחידה', 35, 'snack', 1),
  f('dark-chocolate', 'שוקולד מריר', '2 קוביות', 110, 'snack', 1),
  f('bamba', 'במבה', 'שקית קטנה', 130, 'snack', 3),
  f('popcorn', 'פופקורן', 'קערה', 120, 'snack', 3),
  f('halva', 'חלבה', 'פרוסה', 180, 'snack', 4),
  f('cookie', 'עוגייה', 'יחידה', 90, 'snack', 1),

  // משקאות
  f('water', 'מים', 'כוס', 0, 'drink'),
  f('coffee-black', 'קפה שחור', 'כוס', 5, 'drink'),
  f('coffee-milk', 'קפה עם חלב', 'כוס', 60, 'drink', 3),
  f('juice', 'מיץ תפוזים', 'כוס', 110, 'drink', 2),
  f('cola', 'קולה', 'פחית', 140, 'drink'),
  f('cola-zero', 'קולה זירו', 'פחית', 0, 'drink'),
  f('beer', 'בירה', 'בקבוק', 150, 'drink', 1),
];

/** Everything the app ships with, plus whatever this person added. */
export function allFoods(custom: Food[]): Food[] {
  return [...custom, ...FOODS];
}

/** Loose Hebrew match: any word of the query appearing in the name. */
export function searchFoods(foods: Food[], query: string): Food[] {
  const q = query.trim();
  if (!q) return foods;
  const words = q.split(/\s+/).filter(Boolean);
  return foods.filter((food) => {
    const haystack = `${food.name} ${food.amount} ${CATEGORY_LABEL[food.category]}`;
    return words.every((word) => haystack.includes(word));
  });
}

export function groupFoods(foods: Food[]) {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    items: foods.filter((food) => food.category === category),
  })).filter((group) => group.items.length > 0);
}

/** The line that goes into a meal: "חזה עוף · 150 גרם". */
export function foodLabel(food: Food) {
  return food.amount ? `${food.name} · ${food.amount}` : food.name;
}

/** True when this text is not already in the list, so it can be offered. */
export function isNewFood(foods: Food[], text: string) {
  const name = text.trim();
  if (name.length < 2) return false;
  return !foods.some((food) => foodLabel(food) === name || food.name === name);
}
