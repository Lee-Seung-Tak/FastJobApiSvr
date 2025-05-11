
import dotenv from 'dotenv';
dotenv.config(); // 가장 먼저 호출해야 함

import {GoogleGenAI} from '@google/genai';
const ai = new GoogleGenAI({ apiKey:  process.env.API_KEY });

//import { GoogleGenAI } from '@google/genai';
export const generateContent = async(data) =>{
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `제가 제공한 데이터는 PDF에서 추출한 내용입니다. 이 내용에서 중요한 정보들을 추려내어 기승전결 구조에 맞춰서, 
        각각의 부분이 자연스럽게 연결되도록 정리해주세요. 예를 들어, 처음에는 주제를 간략히 소개하고, 
        그 후에는 내용을 확장하여 설명한 뒤, 마지막에는 결론을 내려주세요.
        PDF에서 추출한 데이터 : ${data}`,
      });
      return response.text
}

