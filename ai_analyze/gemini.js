// const { GoogleGenAI } = require('@google/genai'); 
// const ai = new GoogleGenAI({ apiKey: "AIzaSyAWuH-6ucMg35U5ZdI_ukCV6m7UKldCP-Y" });
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config({ path: '../.env' });

//import { GoogleGenAI } from '@google/genai';
// exports.generateContent = async(data) =>{
//     const response = await ai.models.generateContent({
//         model: "gemini-2.0-flash",
//         contents: `제가 제공한 데이터는 PDF에서 추출한 내용입니다. 이 내용에서 중요한 정보들을 추려내어 기승전결 구조에 맞춰서, 
//         각각의 부분이 자연스럽게 연결되도록 정리해주세요. 예를 들어, 처음에는 주제를 간략히 소개하고, 
//         그 후에는 내용을 확장하여 설명한 뒤, 마지막에는 결론을 내려주세요.
//         PDF에서 추출한 데이터 : ${data}`,
//       });
//       return response.text
// }


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 환경변수로 관리 권장
});

export const generateContent = async (data) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: [
      {
        role: "system",
        content:
          "너는 PDF에서 추출된 데이터를 기승전결 구조로 자연스럽게 요약하는 전문가다.",
      },
      {
        role: "user",
        content: `제가 제공한 데이터는 PDF에서 추출한 내용입니다. 이 내용에서 중요한 정보들을 추려내어 기승전결 구조에 맞춰서, 
각각의 부분이 자연스럽게 연결되도록 정리해주세요. 예를 들어, 처음에는 주제를 간략히 소개하고, 
그 후에는 내용을 확장하여 설명한 뒤, 마지막에는 결론을 내려주세요.
PDF에서 추출한 데이터 : ${data}`,
      },
    ],
  });

  return response.choices[0].message.content;
};

