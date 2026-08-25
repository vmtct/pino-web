import type { CoreSession } from "../../lib/open-studio-funnel";

const TIMEZONE = "Asia/Ho_Chi_Minh";
const DEMO_PREFIX = "demo-open-studio-";
const ASSET_BASE = "https://assets.pinohouse.art/site/OpenStudio";

const image = (name: string) => `${ASSET_BASE}/${name}`;

const partsInPinoTimezone = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { year: read("year"), month: read("month"), day: read("day") };
};

const localIso = (base: Date, dayOffset: number, hour: number, minute: number) => {
  const { year, month, day } = partsInPinoTimezone(base);
  return new Date(Date.UTC(year, month - 1, day + dayOffset, hour - 7, minute)).toISOString();
};

type DemoDefinition = {
  slug: string;
  title: string;
  description: string;
  publicDescription: string;
  skillSummary: string;
  pathCode: string;
  pathName: string;
  dayOffset: number;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  ageMin: number;
  ageMax: number;
  seats: number;
  thumbnail: string;
  full?: boolean;
};

const DEFINITIONS: DemoDefinition[] = [
  {
    slug: "little-piner-play",
    title: "Little Piner Play",
    description: "Một giờ chơi có chủ đích để trẻ quan sát, thử và tự tìm cách giải quyết bằng đôi tay.",
    publicDescription: "Con tham gia các thử thách nhỏ với khối gỗ, chuyển động và tương tác nhóm trong một không gian nhẹ nhàng.",
    skillSummary: "Tập trung, phối hợp tay mắt, thử-sai và giao tiếp tự nhiên.",
    pathCode: "LP",
    pathName: "Little Piner",
    dayOffset: 1,
    startHour: 9,
    startMinute: 30,
    durationMinutes: 45,
    ageMin: 3,
    ageMax: 5,
    seats: 6,
    thumbnail: image("children-building-wooden-blocks.png"),
  },
  {
    slug: "tiny-composers",
    title: "Tiny Composers",
    description: "Chạm vào phím đàn, nghe nhịp và biến một ý tưởng nhỏ thành giai điệu đầu tiên.",
    publicDescription: "Một buổi piano mở, nơi trẻ nghe, bắt chước, thử nhịp và chơi những câu giai điệu ngắn mà không cần kinh nghiệm trước.",
    skillSummary: "Nhịp điệu, lắng nghe, kiểm soát ngón tay và sự tự tin khi thử đàn.",
    pathCode: "PH",
    pathName: "PianoHouse",
    dayOffset: 1,
    startHour: 10,
    startMinute: 30,
    durationMinutes: 60,
    ageMin: 5,
    ageMax: 8,
    seats: 4,
    thumbnail: image("child-playing-piano.png"),
  },
  {
    slug: "story-in-watercolor",
    title: "Story in Watercolor",
    description: "Khám phá màu nước qua một câu chuyện nhỏ, từ pha màu đến tạo nên bức tranh của riêng con.",
    publicDescription: "Trẻ thử độ loãng, lớp màu và nét cọ rồi ghép các quan sát thành một tranh nhỏ mang dấu ấn cá nhân.",
    skillSummary: "Màu sắc, quan sát, kiểm soát cọ và kể chuyện bằng hình ảnh.",
    pathCode: "AC",
    pathName: "Artchitect",
    dayOffset: 2,
    startHour: 13,
    startMinute: 0,
    durationMinutes: 60,
    ageMin: 5,
    ageMax: 8,
    seats: 3,
    thumbnail: image("watercolor-palette-and-botanical-painting.png"),
  },
  {
    slug: "clay-wonders",
    title: "Clay Wonders",
    description: "Nặn, ép, nối và tạo một vật thể nhỏ từ đất bằng cách quan sát hình khối trong đời sống.",
    publicDescription: "Trẻ làm quen với khối, bề mặt và lực tay qua một sản phẩm đất đơn giản có thể mang về.",
    skillSummary: "Cảm giác vật liệu, hình khối, lực tay và tư duy không gian.",
    pathCode: "AC",
    pathName: "Artchitect",
    dayOffset: 3,
    startHour: 15,
    startMinute: 30,
    durationMinutes: 60,
    ageMin: 6,
    ageMax: 9,
    seats: 4,
    thumbnail: image("child-making-clay-cup.png"),
  },
  {
    slug: "music-and-movement",
    title: "Music & Movement",
    description: "Một buổi chuyển động theo nhạc để trẻ cảm nhận nhịp bằng cả cơ thể trước khi chạm vào nhạc cụ.",
    publicDescription: "Trẻ phản hồi với tốc độ, nhịp và khoảng dừng thông qua trò chơi chuyển động theo nhóm.",
    skillSummary: "Cảm nhịp, phối hợp cơ thể, lắng nghe và phản xạ nhóm.",
    pathCode: "PH",
    pathName: "PianoHouse",
    dayOffset: 4,
    startHour: 16,
    startMinute: 45,
    durationMinutes: 45,
    ageMin: 4,
    ageMax: 7,
    seats: 0,
    full: true,
    thumbnail: image("children-dance-class.png"),
  },
  {
    slug: "architecture-explorers",
    title: "Architecture Explorers",
    description: "Quan sát một không gian, phác thảo ý tưởng rồi biến nó thành mô hình nhỏ bằng vật liệu đơn giản.",
    publicDescription: "Trẻ đi từ quan sát đến bản phác rồi dựng một mô hình kiến trúc mini, tập suy nghĩ bằng hình khối và tỷ lệ.",
    skillSummary: "Quan sát, phác thảo, bố cục không gian và tư duy mô hình.",
    pathCode: "AC",
    pathName: "Artchitect",
    dayOffset: 5,
    startHour: 18,
    startMinute: 0,
    durationMinutes: 75,
    ageMin: 7,
    ageMax: 10,
    seats: 2,
    thumbnail: image("architectural-model-and-sketchbook.png"),
  },
];

export const isFallbackSession = (session: CoreSession | null | undefined) => Boolean(session?.id.startsWith(DEMO_PREFIX));

export function buildOpenStudioFallbackSessions(now = new Date()): CoreSession[] {
  return DEFINITIONS.map((definition) => {
    const startsAt = localIso(now, definition.dayOffset, definition.startHour, definition.startMinute);
    const endsAt = new Date(new Date(startsAt).getTime() + definition.durationMinutes * 60_000).toISOString();
    const bookingClosesAt = new Date(new Date(startsAt).getTime() - 2 * 60 * 60_000).toISOString();

    return {
      id: `${DEMO_PREFIX}${definition.slug}`,
      path: {
        id: `demo-path-${definition.pathCode.toLowerCase()}`,
        code: definition.pathCode,
        displayName: definition.pathName,
      },
      startsAt,
      endsAt,
      bookingClosesAt,
      timezone: TIMEZONE,
      availability: {
        remainingSeats: definition.seats,
        isFull: definition.full === true || definition.seats <= 0,
      },
      access: { kind: "open-studio", trialPremium: false },
      syllabus: {
        id: `demo-syllabus-${definition.slug}`,
        title: definition.title,
        shortDescription: definition.description,
        publicDescription: definition.publicDescription,
        skillSummary: definition.skillSummary,
        ageMin: definition.ageMin,
        ageMax: definition.ageMax,
        thumbnailUrl: definition.thumbnail,
        coverUrl: definition.thumbnail,
      },
    } satisfies CoreSession;
  }).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
