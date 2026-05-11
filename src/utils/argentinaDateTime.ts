const ARGENTINA_UTC_OFFSET = '-03:00';
const ARGENTINA_OFFSET_IN_MS = 3 * 60 * 60 * 1000;

const pad = (value: number, size = 2) => String(value).padStart(size, '0');

const buildArgentinaLocalDateAsUtcInstant = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
) => new Date(Date.UTC(year, month - 1, day, hour + 3, minute, second, millisecond));

const dateTimeWithoutZonePattern =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2})(?::(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?)?$/;

const hasExplicitTimeZone = (value: string) => /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);

const toArgentinaLocalView = (value: Date) => new Date(value.getTime() - ARGENTINA_OFFSET_IN_MS);

export const getCurrentArgentinaDate = () => new Date();

export const parseArgentinaDateTime = (value: unknown) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error('Fecha invalida');
  }

  const trimmedValue = value.trim();
  const localDateMatch = trimmedValue.match(dateTimeWithoutZonePattern);

  if (localDateMatch && !hasExplicitTimeZone(trimmedValue)) {
    const [, year, month, day, hour = '00', minute = '00', second = '00', millisecond = '0'] = localDateMatch;

    return buildArgentinaLocalDateAsUtcInstant(
      Number(year),
      Number(month),
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(millisecond.padEnd(3, '0'))
    );
  }

  const parsedDate = new Date(trimmedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Fecha invalida');
  }

  return parsedDate;
};

export const formatArgentinaDateTime = (value: Date | null | undefined) => {
  if (!value) {
    return value ?? null;
  }

  const argentinaDate = toArgentinaLocalView(value);

  // Se devuelve sin zona horaria para evitar que el cliente vuelva a reinterpretar
  // el valor y lo corra otra vez al renderizarlo.
  return `${argentinaDate.getUTCFullYear()}-${pad(argentinaDate.getUTCMonth() + 1)}-${pad(argentinaDate.getUTCDate())} ${pad(argentinaDate.getUTCHours())}:${pad(argentinaDate.getUTCMinutes())}:${pad(argentinaDate.getUTCSeconds())}`;
};

export const getArgentinaHour = (value: Date) => toArgentinaLocalView(value).getUTCHours();

export const getArgentinaMonthRange = (referenceDate = new Date()) => {
  const argentinaDate = toArgentinaLocalView(referenceDate);

  return {
    startDate: buildArgentinaLocalDateAsUtcInstant(
      argentinaDate.getUTCFullYear(),
      argentinaDate.getUTCMonth() + 1,
      1
    ),
    endDate: referenceDate
  };
};

export const getArgentinaDayBounds = (value: unknown) => {
  const parsedDate = parseArgentinaDateTime(value);
  const argentinaDate = toArgentinaLocalView(parsedDate);
  const year = argentinaDate.getUTCFullYear();
  const month = argentinaDate.getUTCMonth() + 1;
  const day = argentinaDate.getUTCDate();

  return {
    startDate: buildArgentinaLocalDateAsUtcInstant(year, month, day, 0, 0, 0, 0),
    endDate: buildArgentinaLocalDateAsUtcInstant(year, month, day, 23, 59, 59, 999)
  };
};
