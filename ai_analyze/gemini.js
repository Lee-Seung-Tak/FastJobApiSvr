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
        role: "user",
        content: `아래는 PDF에서 추출한 원문입니다. "정형 이력서"에 바로 사용할 수 있게 **오직 JSON 객체 하나만** 반환하세요.
코드블록(\`\`\`), 설명문, 주석 절대 금지.

[톤]
- 한국어, 간결/전문
- 과장/추정 금지 (모르면 null/빈배열)

[스키마] (키 추가 금지)
{
  "data": {
    "category": 1,
    "name": string|null,
    "phone": string|null,
    "email": string|null,

    "education": [
      { "period": string, "school": string, "major": string, "degree": string }
    ],

    "skills": {
      "frontend": string[],
      "backend": string[],
      "database": string[],
      "devops": string[],
      "etc": string[]
    },

    "careers": [
      { "period": string, "company": string, "role": string, "summary": string }
    ],

    "projects": [
      {
        "title": string,
        "period": string,
        "overview": string,
        "responsibilities": string[],   // 불릿
        "stack": string[],              // 불릿
        "result": string|null,
        "problem_solution": string|null
      }
    ],

    "essays": [
      { "title": string, "content": string } // 실제 개행 사용, \\n 금지
    ],

    "certs": [
      { "date": string, "name": string, "score_or_grade": string|null, "issuer": string|null }
    ],

    "links": [
      { "label": string, "url": string, "note": string|null }
    ]
  }
}

[형식 규칙]
- 문자열 내부 줄바꿈은 실제 개행문자 사용(\\n 금지)
- skills는 표준 표기(예: "Node.js", "TypeScript", "Spring Boot", "AWS"), 중복 제거
- 불명확한 값은 null 또는 []
- projects.responsibilities/stack는 3~6개 권장

[원문]
${data}`
      },
    ],
  });
  return response.choices[0].message?.content ?? "";
};