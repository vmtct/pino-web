import "./catalog.css";

export type AcrylicOffering = {
  slug: string;
  title: string;
  collection: string;
  mood: string;
  story: string;
  difficulty: "Beginner friendly";
  duration: string;
  canvas: string;
  familyFriendly: boolean;
  visual: string;
};

export type AcrylicCollection = {
  slug: string;
  title: string;
  promise: string;
  description: string;
  offerings: AcrylicOffering[];
};

const offer = (
  slug: string,
  title: string,
  collection: string,
  mood: string,
  story: string,
  visual: string,
  familyFriendly = true,
): AcrylicOffering => ({
  slug,
  title,
  collection,
  mood,
  story,
  difficulty: "Beginner friendly",
  duration: "150 min",
  canvas: "Acrylic on canvas · sample size TBD",
  familyFriendly,
  visual,
});

export const acrylicCollections: AcrylicCollection[] = [
  {
    slug: "slow-living",
    title: "Slow Living",
    promise: "Small rituals worth noticing.",
    description: "Những khoảnh khắc đời thường đủ yên để mình muốn giữ lại lâu hơn.",
    offerings: [
      offer("sunday-flowers", "Sunday Flowers", "Slow Living", "warm · soft · slow", "Một bình hoa không cần hoàn hảo — chỉ cần đủ đẹp cho một chiều Chủ Nhật.", "linear-gradient(145deg,#8a9b72 0%,#d7c6a2 52%,#e6a59a 100%)"),
      offer("morning-coffee", "Morning Coffee", "Slow Living", "cozy · earthy · quiet", "Ly cà phê, ánh sáng đầu ngày và cảm giác chưa cần vội đi đâu cả.", "linear-gradient(145deg,#5d4439 0%,#b99072 48%,#efe0c5 100%)"),
      offer("books-by-the-window", "Books by the Window", "Slow Living", "calm · literary · warm", "Một góc cửa sổ, vài cuốn sách và buổi chiều được phép trôi chậm.", "linear-gradient(145deg,#8c6f55 0%,#d8c5a5 50%,#8092a2 100%)"),
      offer("little-balcony", "Little Balcony", "Slow Living", "airy · green · homelike", "Một ban công nhỏ với nắng, cây và khoảng thở dành riêng cho mình.", "linear-gradient(145deg,#718869 0%,#d8d0ad 50%,#c6866f 100%)"),
    ],
  },
  {
    slug: "botanical-escape",
    title: "Botanical Escape",
    promise: "Breathe in green.",
    description: "Một khoảng thiên nhiên đủ gần để mình bước vào bằng màu sắc.",
    offerings: [
      offer("wild-garden", "Wild Garden", "Botanical Escape", "lush · loose · alive", "Không cần vẽ từng cánh hoa. Chỉ cần để cả khu vườn cùng xuất hiện.", "linear-gradient(145deg,#49634a 0%,#9cad76 48%,#e7c5a2 100%)"),
      offer("hydrangea-afternoon", "Hydrangea Afternoon", "Botanical Escape", "soft · floral · dreamy", "Những cụm cẩm tú cầu mềm và mát như một buổi chiều sau mưa.", "linear-gradient(145deg,#63799a 0%,#b5a9c8 48%,#d8e1cf 100%)"),
      offer("olive-branch", "Olive Branch", "Botanical Escape", "minimal · meditative · sage", "Ít chi tiết hơn, nhiều khoảng thở hơn — một nhành olive cho căn phòng thật.", "linear-gradient(145deg,#52644f 0%,#a7ae86 55%,#e2d8bd 100%)"),
      offer("little-meadow", "Little Meadow", "Botanical Escape", "bright · breezy · open", "Một đồng cỏ nhỏ, ánh sáng rộng và cảm giác được đi xa dù chỉ trong vài giờ.", "linear-gradient(145deg,#8cb58c 0%,#d7d79b 50%,#c2d7e2 100%)"),
    ],
  },
  {
    slug: "postcards",
    title: "Postcards",
    promise: "Paint somewhere you want to be.",
    description: "Những nơi mình muốn trốn đến — được nén lại thành một tấm postcard bằng acrylic.",
    offerings: [
      offer("amalfi-window", "Amalfi Window", "Postcards", "sunny · mediterranean · blue", "Cửa sổ mở ra biển, nắng trắng và một buổi chiều kiểu Địa Trung Hải.", "linear-gradient(145deg,#3e88a0 0%,#8ac5cc 48%,#e7c27d 100%)"),
      offer("paris-cafe", "Paris Café", "Postcards", "romantic · urban · warm", "Một chiếc bàn nhỏ ngoài phố và cảm giác mình đang ngồi lâu hơn thường ngày.", "linear-gradient(145deg,#6f4d48 0%,#c49273 50%,#ddc8ad 100%)"),
      offer("kyoto-alley", "Kyoto Alley", "Postcards", "quiet · lantern · nostalgic", "Con hẻm yên, đèn ấm và một chuyến đi được nhớ bằng màu.", "linear-gradient(145deg,#5b453b 0%,#b86752 48%,#d3b98f 100%)"),
      offer("seaside-house", "Seaside House", "Postcards", "coastal · airy · restful", "Một căn nhà gần biển, trời rộng và không có lịch hẹn nào tiếp theo.", "linear-gradient(145deg,#5d95a6 0%,#b9d7d3 50%,#efe0b4 100%)"),
    ],
  },
  {
    slug: "after-rain",
    title: "After Rain",
    promise: "For quieter moods.",
    description: "Mưa, ánh đèn và những khoảnh khắc thành phố dịu xuống — cinematic nhưng vẫn dễ vẽ.",
    offerings: [
      offer("rainy-window", "Rainy Window", "After Rain", "quiet · rainy · cinematic", "Nhìn thành phố qua một lớp mưa, đủ xa để mọi thứ trở nên nhẹ hơn.", "linear-gradient(145deg,#445466 0%,#758696 48%,#c89a72 100%)"),
      offer("blue-hour", "Blue Hour", "After Rain", "blue · still · reflective", "Khoảnh khắc giữa ngày và đêm, khi mọi thứ chuyển sang một màu xanh rất riêng.", "linear-gradient(145deg,#34475e 0%,#667d9b 55%,#d8a876 100%)"),
      offer("cafe-at-night", "Café at Night", "After Rain", "amber · intimate · rainy", "Ánh đèn vàng trong quán nhỏ, bên ngoài vẫn còn mưa.", "linear-gradient(145deg,#2f3540 0%,#6c584c 48%,#d29a5e 100%)"),
      offer("city-after-rain", "City After Rain", "After Rain", "moody · glossy · urban", "Đường phố vừa tạnh, mặt đường còn phản chiếu ánh sáng và người thì đã đi chậm lại.", "linear-gradient(145deg,#283742 0%,#596b72 48%,#a5755c 100%)", false),
    ],
  },
];

export const acrylicOfferings = acrylicCollections.flatMap((collection) => collection.offerings);
