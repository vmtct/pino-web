import type { CoreSession, PublicLocale } from "../../lib/open-studio-funnel";

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

type LocalizedText = { vi: string; en: string };
type DemoDefinition = {
  slug: string;
  title: string;
  description: LocalizedText;
  publicDescription: LocalizedText;
  skillSummary: LocalizedText;
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
    description: { vi: "Một giờ chơi có chủ đích để trẻ quan sát, thử và tự tìm cách giải quyết bằng đôi tay.", en: "A purposeful hour of play where children observe, try and solve small challenges with their hands." },
    publicDescription: { vi: "Con tham gia các thử thách nhỏ với khối gỗ, chuyển động và tương tác nhóm trong một không gian nhẹ nhàng.", en: "Children explore small challenges with wooden blocks, movement and group interaction in a gentle setting." },
    skillSummary: { vi: "Tập trung, phối hợp tay mắt, thử-sai và giao tiếp tự nhiên.", en: "Focus, hand-eye coordination, trial and error, and natural communication." },
    pathCode: "LP", pathName: "Little Piner", dayOffset: 1, startHour: 9, startMinute: 30, durationMinutes: 45, ageMin: 3, ageMax: 5, seats: 6,
    thumbnail: image("children-building-wooden-blocks.png"),
  },
  {
    slug: "tiny-composers",
    title: "Tiny Composers",
    description: { vi: "Chạm vào phím đàn, nghe nhịp và biến một ý tưởng nhỏ thành giai điệu đầu tiên.", en: "Touch the keys, feel the rhythm and turn a small idea into a first melody." },
    publicDescription: { vi: "Một buổi piano mở, nơi trẻ nghe, bắt chước, thử nhịp và chơi những câu giai điệu ngắn mà không cần kinh nghiệm trước.", en: "An open piano session where children listen, imitate, try rhythms and play short melodic phrases with no prior experience required." },
    skillSummary: { vi: "Nhịp điệu, lắng nghe, kiểm soát ngón tay và sự tự tin khi thử đàn.", en: "Rhythm, listening, finger control and confidence at the piano." },
    pathCode: "PH", pathName: "PianoHouse", dayOffset: 1, startHour: 10, startMinute: 30, durationMinutes: 60, ageMin: 5, ageMax: 8, seats: 4,
    thumbnail: image("child-playing-piano.png"),
  },
  {
    slug: "story-in-watercolor",
    title: "Story in Watercolor",
    description: { vi: "Khám phá màu nước qua một câu chuyện nhỏ, từ pha màu đến tạo nên bức tranh của riêng con.", en: "Explore watercolor through a small story, from mixing color to making a painting of their own." },
    publicDescription: { vi: "Trẻ thử độ loãng, lớp màu và nét cọ rồi ghép các quan sát thành một tranh nhỏ mang dấu ấn cá nhân.", en: "Children experiment with washes, layers and brush marks, then turn observations into a personal small painting." },
    skillSummary: { vi: "Màu sắc, quan sát, kiểm soát cọ và kể chuyện bằng hình ảnh.", en: "Color, observation, brush control and visual storytelling." },
    pathCode: "AC", pathName: "Artchitect", dayOffset: 2, startHour: 13, startMinute: 0, durationMinutes: 60, ageMin: 5, ageMax: 8, seats: 3,
    thumbnail: image("watercolor-palette-and-botanical-painting.png"),
  },
  {
    slug: "clay-wonders",
    title: "Clay Wonders",
    description: { vi: "Nặn, ép, nối và tạo một vật thể nhỏ từ đất bằng cách quan sát hình khối trong đời sống.", en: "Pinch, press, join and shape a small clay object by observing forms from everyday life." },
    publicDescription: { vi: "Trẻ làm quen với khối, bề mặt và lực tay qua một sản phẩm đất đơn giản có thể mang về.", en: "Children discover form, texture and hand pressure through a simple clay object they can take home." },
    skillSummary: { vi: "Cảm giác vật liệu, hình khối, lực tay và tư duy không gian.", en: "Material awareness, form, hand strength and spatial thinking." },
    pathCode: "AC", pathName: "Artchitect", dayOffset: 3, startHour: 15, startMinute: 30, durationMinutes: 60, ageMin: 6, ageMax: 9, seats: 4,
    thumbnail: image("child-making-clay-cup.png"),
  },
  {
    slug: "music-and-movement",
    title: "Music & Movement",
    description: { vi: "Một buổi chuyển động theo nhạc để trẻ cảm nhận nhịp bằng cả cơ thể trước khi chạm vào nhạc cụ.", en: "A music-and-movement session where children feel rhythm through the whole body before touching an instrument." },
    publicDescription: { vi: "Trẻ phản hồi với tốc độ, nhịp và khoảng dừng thông qua trò chơi chuyển động theo nhóm.", en: "Children respond to tempo, pulse and pauses through playful group movement." },
    skillSummary: { vi: "Cảm nhịp, phối hợp cơ thể, lắng nghe và phản xạ nhóm.", en: "Rhythm, body coordination, listening and group response." },
    pathCode: "PH", pathName: "PianoHouse", dayOffset: 4, startHour: 16, startMinute: 45, durationMinutes: 45, ageMin: 4, ageMax: 7, seats: 0, full: true,
    thumbnail: image("children-dance-class.png"),
  },
  {
    slug: "architecture-explorers",
    title: "Architecture Explorers",
    description: { vi: "Quan sát một không gian, phác thảo ý tưởng rồi biến nó thành mô hình nhỏ bằng vật liệu đơn giản.", en: "Observe a space, sketch an idea and turn it into a small model with simple materials." },
    publicDescription: { vi: "Trẻ đi từ quan sát đến bản phác rồi dựng một mô hình kiến trúc mini, tập suy nghĩ bằng hình khối và tỷ lệ.", en: "Children move from observation to sketch to a miniature architectural model, learning to think with form and proportion." },
    skillSummary: { vi: "Quan sát, phác thảo, bố cục không gian và tư duy mô hình.", en: "Observation, sketching, spatial composition and model thinking." },
    pathCode: "AC", pathName: "Artchitect", dayOffset: 5, startHour: 18, startMinute: 0, durationMinutes: 75, ageMin: 7, ageMax: 10, seats: 2,
    thumbnail: image("architectural-model-and-sketchbook.png"),
  },
];

export const isFallbackSession = (session: CoreSession | null | undefined) => Boolean(session?.id.startsWith(DEMO_PREFIX));

export function buildOpenStudioFallbackSessions(locale: PublicLocale = "vi", now = new Date()): CoreSession[] {
  return DEFINITIONS.map((definition) => {
    const startsAt = localIso(now, definition.dayOffset, definition.startHour, definition.startMinute);
    const endsAt = new Date(new Date(startsAt).getTime() + definition.durationMinutes * 60_000).toISOString();
    const bookingClosesAt = new Date(new Date(startsAt).getTime() - 2 * 60 * 60_000).toISOString();
    return {
      id: `${DEMO_PREFIX}${definition.slug}`,
      path: { id: `demo-path-${definition.pathCode.toLowerCase()}`, code: definition.pathCode, displayName: definition.pathName },
      startsAt, endsAt, bookingClosesAt, timezone: TIMEZONE,
      availability: { remainingSeats: definition.seats, isFull: definition.full === true || definition.seats <= 0 },
      access: { kind: "open-studio", trialPremium: false },
      syllabus: {
        id: `demo-syllabus-${definition.slug}`,
        title: definition.title,
        shortDescription: definition.description[locale],
        publicDescription: definition.publicDescription[locale],
        skillSummary: definition.skillSummary[locale],
        ageMin: definition.ageMin,
        ageMax: definition.ageMax,
        thumbnailUrl: definition.thumbnail,
        coverUrl: definition.thumbnail,
      },
    } satisfies CoreSession;
  }).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
