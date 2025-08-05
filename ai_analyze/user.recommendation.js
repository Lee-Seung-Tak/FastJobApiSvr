import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableMap, RunnableLambda } from "@langchain/core/runnables";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import * as dotenv from "dotenv";

dotenv.config({ path: '../.env' });


import { Client } from "pg";

const client = new Client({
    user: "postgres",
    host: "127.0.0.1",
    database: "api",
    password: "1111",
    port: 5433,
});
await client.connect();
// 비동기 함수를 선언하여 전체 코드를 감싸줍니다.
async function fetchUserData() {
    try {
        const res = await client.query("SELECT name, email, phone, resume, self_intro, career_desc FROM users.user_account;");
        const data = res.rows;
        console.log("쿼리 결과:", data);
        return data;

    } catch (err) {
        // 에러 발생 시 처리
        console.error("쿼리 중 에러 발생:", err);
    } finally {
        // 연결 종료는 항상 실행되도록 finally 블록에 넣습니다.
        console.log("PostgreSQL 연결 종료");
    }
}

async function fetchCompanyData() {
    try {
        console.log("here - 1")
        const res = await client.query("SELECT name, email, phone, ideal_candidate_profile FROM company.company_account;");
        const data = res.rows;
        console.log("쿼리 결과:", data);
        
        return data;

    } catch (err) {
        // 에러 발생 시 처리
        console.error("쿼리 중 에러 발생:", err);
    } finally {
        // 연결 종료는 항상 실행되도록 finally 블록에 넣습니다.
        console.log("PostgreSQL 연결 종료");
    }
}


const userRawData    = await fetchUserData();
const companyrawData = await fetchCompanyData();
await client.end();


const embeddings = new OpenAIEmbeddings();
const model = new ChatOpenAI({
    modelName: "gpt-4.1-nano",
    temperature: 0,
});

// 벡터 db를 따로 안쓰고, 메모리에 올렸다.
// system이 시작 될 때 -> psql에서 user account를 전부 가져오면 안되고, 이름 , 전화번호, 이메일 , 이력서 , 경력기술서 , 자기소개서 컬럼만 가져와서
// chroma 벡터 디비에 임베딩 하고,
// company_account에서 회사명, 이메일, 요구 인재 사항 가져와서 -> 요구 인재사항으로 검색 -> 
const docs = userRawData.map((user) => new Document({
    pageContent: `
        자기소개: ${user.self_intro ?? ''}
        경력기술서: ${user.career_desc ?? ''}
        이력서: ${user.resume ?? ''}
    `,
    metadata: {
        name: user.name,
        email: user.email,
        phone: user.phone
    }
}));

const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
console.log("문서 임베딩 및 메모리 저장 완료.");

const retriever = vectorStore.asRetriever();





const findTalented = async (question) => {


    const prompt = ChatPromptTemplate.fromTemplate(`
        아래에 제공된 문맥(context)을 사용하여 사용자가 원하는 사람의 이름을 답변하고, 그 이유를 설명하세요.
        만약 문맥(context)에서 유사한 사용자가 없다면, 질문: {question}과 가장 유사한 사람을 추천하세요.

        {context}

        질문: {question}

        답변은 아래와 같은 형식으로 하세요.

        이름 : 
        이유 :
    `);
    const formatDocs = (docs) => docs.map((doc) => `이름: ${doc.metadata.name}\n내용: ${doc.pageContent}`).join("\n\n");
    const ragChain = RunnableMap.from({
        context: async (input) => {
        const retrievedDocs = await retriever.invoke(input.question);
        return formatDocs(retrievedDocs);
    },
        question: (input) => input.question,
    })
    .pipe(prompt).
    pipe(model).
    pipe(new StringOutputParser());


    // company raw data의 ideal_candidate_profile 수 만큼 돌리면 됨.
    // 그리고 여기서 , 인재를 뽑았으면 그거 이메일로 (회사 이메일)로 보내줘도 되고 뭐 그건 나중 문제
    //const resultDatas = companyrawData.map() 
    console.log(`\n질문: ${question}`);

    const result = await ragChain.invoke({ question });
    console.log(`\n답변\n${result}`);

    return result;
};

for (const company of companyrawData) {
    if (company.ideal_candidate_profile != null) {
        console.log("회사명 :", company.name)
        console.log("회사가 원하는 인재상 : ", company.ideal_candidate_profile)
        const returnData = await findTalented(company.ideal_candidate_profile);
        console.log("returnData:", returnData);
        // send email 등 후속 작업 수행
    }
}
