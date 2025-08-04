import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableMap, RunnableLambda } from "@langchain/core/runnables";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import * as dotenv from "dotenv";

dotenv.config({ path: '../.env' });

const run = async () => {
    const embeddings = new OpenAIEmbeddings();
    const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0,
    });

    const docs = [
        new Document({ 
            pageContent: "나는 nodejs를 능숙하게 다루지는 못하지만 보통 실력은 됩니다. 그리고 협동을 잘 못합니다.", 
            metadata: { name: "영수" } 
        }),
        new Document({ 
            pageContent: "나는 TypeScript도 좋아합니다. 그리고 협동을 잘합니다.", 
            metadata: { name: "화영" } 
        }),
        new Document({ 
            pageContent: "나는 nodejs를 매우 능숙하게 다룹니다.", 
            metadata: { name: "철일" } 
        }),
        new Document({ 
            pageContent: "나는 컴퓨터 프로그래밍에 관심이 많습니다.", 
            metadata: { name: "삼오" } 
        }),
    ];

    const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    console.log("문서 임베딩 및 메모리 저장 완료.");

    const retriever = vectorStore.asRetriever();

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



    const question = "성실하고, 인내심 있으며 협동성이 있고, nodejs를 능숙하게 다룰 수 있는 사람.";
    console.log(`\n질문: ${question}`);

    const result = await ragChain.invoke({ question });
    console.log(`\n답변\n${result}`);
};

run();