export const daysOfWeek = [
  { id: 'segunda', label: 'Segunda-feira', color: 'bg-blue-500' },
  { id: 'terca', label: 'Terca-feira', color: 'bg-emerald-500' },
  { id: 'quarta', label: 'Quarta-feira', color: 'bg-amber-500' },
  { id: 'quinta', label: 'Quinta-feira', color: 'bg-purple-500' },
  { id: 'sexta', label: 'Sexta-feira', color: 'bg-rose-500' },
  { id: 'sabado', label: 'Sábado', color: 'bg-indigo-500' },
  { id: 'domingo', label: 'Domingo', color: 'bg-pink-500' }
];

export const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const getMonday = (date = new Date()) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff);
  return base;
};

export const getWeekKey = (date = new Date()) => toDateKey(getMonday(date));

export const parseWeekKey = (weekKey) => {
  const [year, month, day] = weekKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const formatDateShort = (dateStringOrDate) => {
  const d = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate + 'T12:00:00') : dateStringOrDate;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const formatWeekRange = (weekKey) => {
  const start = parseWeekKey(weekKey);
  const end = addDays(start, 6);
  return `${formatDateShort(start)} ate ${formatDateShort(end)}`;
};

export const getTodayDayId = () => {
  const jsDay = new Date().getDay();
  const idx = jsDay === 0 ? 6 : jsDay - 1;
  return ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'][idx];
};

export const getWeekKeyAndDayId = (dateString) => {
  if (!dateString) return { weekKey: getWeekKey(), dayId: 'segunda' };
  const [year, month, day] = dateString.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  const base = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const dayOfWeek = base.getDay();

  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(base);
  monday.setDate(monday.getDate() + diff);

  const weekKey = toDateKey(monday);
  const dayIds = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const dayId = dayIds[dayOfWeek];

  return { weekKey, dayId };
};

export const getNextDayOfWeek = (weekKey, dayId) => {
  const [year, month, day] = weekKey.split('-').map(Number);
  const monday = new Date(year, month - 1, day);
  const dayMap = { segunda: 0, terca: 1, quarta: 2, quinta: 3, sexta: 4, sabado: 5, domingo: 6 };
  const diff = dayMap[dayId] || 0;
  monday.setDate(monday.getDate() + diff);
  return toDateKey(monday);
};

// Nome curto do mês (jan, fev, ...) e nome completo.
export const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Nomes dos dias começando na segunda (padrão do cronograma).
export const DAY_NAMES_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Segunda-feira da semana que contém `date`.
export const mondayOf = (date) => {
  const dt = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const wd = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - wd);
  return dt;
};

// Retorna as segundas-feiras de todas as semanas que tocam o mês (y, m 0-based).
export const weeksForMonth = (y, m) => {
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const out = [];
  let cur = mondayOf(first);
  while (cur <= last) {
    out.push(new Date(cur));
    cur = new Date(cur);
    cur.setDate(cur.getDate() + 7);
  }
  return out;
};

export const buildMonthGrid = (anchorDate) => {
  const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const startWeekday = first.getDay();
  const startOffset = startWeekday === 0 ? -6 : 1 - startWeekday;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() + startOffset);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  return cells;
};
