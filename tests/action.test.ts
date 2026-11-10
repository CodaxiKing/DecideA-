import { formatClock, remainingSeconds, timerFromStep } from '../src/features/food/cookingTimer';
import { dinnerPool, drawWeek, redrawDay } from '../src/features/food/mealPlan';
import { recipes } from '../src/features/food/recipes';
import { buildShoppingList, parseQuantity, shoppingListText, sumQuantities } from '../src/features/food/shopping';

const byId = (id: string) => recipes.find((r) => r.id === id)!;

describe('quantidades', () => {
  it('entende inteiros, frações e mistos', () => {
    expect(parseQuantity('400 g')).toEqual({ amount: 400, unit: 'g' });
    expect(parseQuantity('2 1/2 xícaras')).toEqual({ amount: 2.5, unit: 'xícara' });
    expect(parseQuantity('1/2 xícara')).toEqual({ amount: 0.5, unit: 'xícara' });
    expect(parseQuantity('a gosto')).toBeNull();
  });

  it('soma a mesma unidade e junta as diferentes', () => {
    expect(sumQuantities(['400 g', '300 g'])).toBe('700 g');
    expect(sumQuantities(['1/2 xícara', '2 xícaras'])).toBe('2,5 xícaras');
    expect(sumQuantities(['3 unidades', '2 colheres de sopa'])).toBe('3 unidades + 2 colheres de sopa');
    expect(sumQuantities(['a gosto', 'a gosto'])).toBe('a gosto');
  });
});

describe('lista de compras', () => {
  it('separa o que falta do que já tem (despensa conta como tem)', () => {
    const list = buildShoppingList([byId('macarrao-brocolis-alho')], ['macarrão', 'alho', 'Brócolis']);
    const missing = list.filter((i) => !i.have).map((i) => i.name);
    expect(missing).toEqual(['Azeite de oliva', 'Parmesão ralado']);
    expect(list.find((i) => i.name === 'Sal')?.have).toBe(true);
  });

  it('soma o mesmo ingrediente de receitas diferentes', () => {
    const list = buildShoppingList([byId('macarrao-brocolis-alho'), byId('macarrao-alho-oleo')]);
    expect(list.find((i) => i.key === 'macarrao')?.quantity).toBe('650 g');
    expect(list.find((i) => i.key === 'macarrao')?.recipes).toHaveLength(2);
  });

  it('texto para o WhatsApp só com o que falta', () => {
    const text = shoppingListText('Jantar', buildShoppingList([byId('omelete-brocolis')], ['ovos']));
    expect(text).toContain('Brócolis cozido picado');
    expect(text).not.toContain('Ovos');
  });
});

describe('cardápio da semana', () => {
  it('sete jantares sem repetir', () => {
    const pool = dinnerPool(recipes);
    const week = drawWeek(pool);
    expect(week).toHaveLength(7);
    expect(new Set(week).size).toBe(7);
    expect(week.every((id) => byId(id).meals.includes('jantar'))).toBe(true);
  });

  it('catálogo pequeno repete o mínimo e nunca dois dias seguidos iguais', () => {
    const pool = dinnerPool(recipes).slice(0, 3);
    const week = drawWeek(pool);
    expect(week).toHaveLength(7);
    for (let i = 1; i < 7; i++) expect(week[i]).not.toBe(week[i - 1]);
  });

  it('trocar um dia não repete prato da semana', () => {
    const pool = dinnerPool(recipes);
    const week = drawWeek(pool);
    const next = redrawDay(week, 2, pool);
    expect(next[2]).not.toBe(week[2]);
    expect(new Set(next).size).toBe(7);
  });
});

describe('Modo cozinha', () => {
  it('acha o tempo no texto do passo', () => {
    expect(timerFromStep('doure o alho no azeite por cerca de 2 minutos')).toBe(120);
    expect(timerFromStep('Leve à geladeira por pelo menos 3 horas')).toBe(10800);
    expect(timerFromStep('Asse a 200 °C por 30 minutos.')).toBe(1800);
    expect(timerFromStep('Misture tudo.')).toBeNull();
  });

  it('o timer continua certo depois de segundo plano (conta pelo horário de término)', () => {
    const start = 1_000_000;
    const endsAt = start + 120_000;
    expect(remainingSeconds(endsAt, start)).toBe(120);
    expect(remainingSeconds(endsAt, start + 90_000)).toBe(30); // voltou do segundo plano 90 s depois
    expect(remainingSeconds(endsAt, start + 200_000)).toBe(0);
    expect(formatClock(125)).toBe('02:05');
    expect(formatClock(3725)).toBe('1:02:05');
  });
});
