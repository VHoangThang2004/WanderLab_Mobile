const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const isApiKeyValid = GEMINI_API_KEY.startsWith("AIzaSy");

export const aiService = {
  /**
   * General-purpose Gemini API request sender using Fetch.
   */
  async generateContent(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      console.warn("Gemini API error: EXPO_PUBLIC_GEMINI_API_KEY is missing or empty.");
      throw new Error("INVALID_KEY: Missing Key");
    }
    if (!isApiKeyValid) {
      console.warn("Gemini API error: EXPO_PUBLIC_GEMINI_API_KEY is invalid (must start with AIzaSy).");
      throw new Error("INVALID_KEY: Invalid Key format");
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Không nhận được kết quả hợp lệ từ Gemini API.");
      }

      return text.trim();
    } catch (error: any) {
      console.error("Gemini API error:", error);
      throw error;
    }
  },

  /**
   * Generates a full itinerary (JSON array) based on the user's selected context.
   */
  async generateItinerary(context: any, language: string = "vi"): Promise<any> {
    const { destination, duration, budget, groupSize, interests } = context;
    const days = parseInt(duration) || 3;
    
    const prompt = language === "vi"
      ? `Bạn là một AI lên lịch trình du lịch chuyên nghiệp.
Hãy tạo một lịch trình ${days} ngày cho chuyến đi tới ${destination}.
Thông tin chuyến đi:
- Ngân sách: ${budget}
- Nhóm: ${groupSize}
- Sở thích: ${interests.join(", ")}

YÊU CẦU QUAN TRỌNG:
Chỉ trả về DUY NHẤT một đối tượng JSON hợp lệ, không có văn bản nào khác, theo đúng cấu trúc sau:
{
  "title": "Chuyến đi tuyệt vời tới ${destination}",
  "duration": "${days} ngày",
  "days": [
    {
      "day": 1,
      "title": "Tiêu đề ngày 1",
      "activities": ["Sáng: ...", "Trưa: ...", "Chiều: ...", "Tối: ..."],
      "budget": "Dự kiến chi phí ngày 1 (VND)"
    }
  ],
  "budgetBreakdown": [
    { "label": "Khách sạn / Resort", "amount": "4.500.000₫" },
    { "label": "Ăn uống", "amount": "1.800.000₫" },
    { "label": "Di chuyển", "amount": "500.000₫" }
  ],
  "totalBudget": "11.400.000₫"
}`
      : `You are a professional travel AI planner.
Create a ${days}-day itinerary for a trip to ${destination}.
Trip Info:
- Budget: ${budget}
- Group: ${groupSize}
- Interests: ${interests.join(", ")}

CRITICAL REQUIREMENT:
Return ONLY a valid JSON object, with no other text, exactly matching this structure:
{
  "title": "Amazing trip to ${destination}",
  "duration": "${days} days",
  "days": [
    {
      "day": 1,
      "title": "Day 1 Title",
      "activities": ["Morning: ...", "Noon: ...", "Afternoon: ...", "Evening: ..."],
      "budget": "Estimated cost for day 1"
    }
  ],
  "budgetBreakdown": [
    { "label": "Hotel / Resort", "amount": "4.500.000₫" },
    { "label": "Dining", "amount": "1.800.000₫" },
    { "label": "Transportation", "amount": "500.000₫" }
  ],
  "totalBudget": "11.400.000₫"
}`;

    try {
      const responseText = await this.generateContent(prompt);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      return JSON.parse(jsonString);
    } catch (error: any) {
      console.warn("Falling back to mock itinerary due to API error or invalid key.");
      await new Promise(resolve => setTimeout(resolve, 800));
      return getMockItinerary(destination, days, language);
    }
  },

  /**
   * Generates bot response for AIAssistant chat.
   */
  async chatWithWanderBot(message: string, history: { role: 'user' | 'model', text: string }[]): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error("INVALID_KEY: Missing Key");
    }

    const SYSTEM_PROMPT = `Bạn là trợ lý du lịch AI của WanderLab — nền tảng du lịch Việt Nam.

## Phạm vi trả lời (QUAN TRỌNG)
Bạn CHỈ trả lời các câu hỏi liên quan đến:
• Du lịch Việt Nam (điểm đến, lịch trình, trải nghiệm)
• Lập kế hoạch chuyến đi (ngân sách, thời gian, phương tiện)
• Ẩm thực, văn hóa, lễ hội Việt Nam
• Gợi ý khách sạn, nhà hàng, hoạt động
• Mẹo du lịch, an toàn, visa, thời tiết
• Các tính năng của WanderLab (nhật ký, lộ trình, bạn đồng hành)

Nếu người dùng hỏi ngoài phạm vi (lập trình, toán, y tế, pháp luật, chính trị, tình cảm, v.v.), hãy từ chối lịch sự và gợi ý quay lại chủ đề du lịch. Ví dụ:
"Mình chuyên về du lịch thôi nè 😊 Bạn có muốn tìm hiểu điểm đến nào ở Việt Nam không?"

## Phong cách trả lời
• Ngắn gọn, thân thiện, dùng emoji phù hợp
• Dùng markdown để format (bold, list, heading) cho dễ đọc
• Dùng tiếng Việt trừ khi người dùng hỏi bằng tiếng Anh
• Ưu tiên thông tin thực tế, có ích`;

    try {
      const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: contents,
          }),
        }
      );

      const data = await response.json();
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Không nhận được kết quả hợp lệ từ Gemini API.");
      }

      return text.trim();
    } catch (error) {
      console.warn("Falling back to mock chat due to API error.", error);
      await new Promise(resolve => setTimeout(resolve, 800));
      return "WanderBot đang tra cứu thông tin... Bạn có thể tham khảo thêm Lịch trình gợi ý nhé!";
    }
  }
};

function getMockItinerary(destination: string, days: number, language: string): any {
  const arr = [];
  const destName = destination.toUpperCase();
  for (let i = 1; i <= days; i++) {
    arr.push({
      day: i,
      title: language === "vi" ? `Khám phá ${destName} - Ngày ${i}` : `Explore ${destName} - Day ${i}`,
      activities: language === "vi" 
        ? [`Sáng: Khởi hành đi các điểm nổi tiếng ở ${destName}`, `Trưa: Ăn trưa đặc sản địa phương`, `Chiều: Chụp ảnh và nghỉ ngơi`, `Tối: Đi dạo chợ đêm`] 
        : [`Morning: Depart to famous spots in ${destName}`, `Noon: Eat local specialties`, `Afternoon: Take photos and rest`, `Evening: Walk around the night market`],
      budget: language === "vi" ? "1.000.000₫" : "1,000,000 VND",
    });
  }
  return {
    title: language === "vi" ? `Khám phá ${destName}` : `Explore ${destName}`,
    duration: language === "vi" ? `${days} ngày` : `${days} days`,
    days: arr,
    budgetBreakdown: [
      { label: language === "vi" ? "Vé máy bay / Di chuyển" : "Flight / Transport", amount: "2.000.000₫" },
      { label: language === "vi" ? "Khách sạn" : "Hotel", amount: "3.000.000₫" },
      { label: language === "vi" ? "Ăn uống" : "Dining", amount: "2.000.000₫" },
      { label: language === "vi" ? "Vui chơi" : "Activities", amount: "1.000.000₫" }
    ],
    totalBudget: "8.000.000₫"
  };
}
