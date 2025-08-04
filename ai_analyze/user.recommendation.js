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
  // 1. 임베딩 모델 초기화
  const embeddings = new OpenAIEmbeddings();
  
  // 2. 답변을 생성할 OpenAI 모델 초기화
  const model = new ChatOpenAI({
    modelName: "gpt-4.1-nano", // 또는 "gpt-3.5-turbo"
    temperature: 0,
  });

  // 3. 문서를 임베딩하고 메모리 내에 벡터 저장소 생성
  const docs = [
    new Document({ pageContent: "나는 자바스크립트를 좋아합니다." }),
    new Document({ pageContent: "나는 TypeScript도 좋아합니다." }),
    new Document({ pageContent: "LangChain은 LLM 애플리케이션 개발을 돕습니다." }),
    new Document({ pageContent: "나는 컴퓨터 프로그래밍에 관심이 많습니다." }),
  ];
  
  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  console.log("문서 임베딩 및 메모리 저장 완료.");

  // 4. 질문에 해당하는 문서를 찾는 리트리버 설정
  const retriever = vectorStore.asRetriever();

  // 5. 프롬프트 템플릿 생성: 찾은 문맥(context)과 질문(question)을 포함
  const prompt = ChatPromptTemplate.fromTemplate(`
    아래에 제공된 문맥(context)을 사용하여 질문에 답변하세요.
    만약 문맥에 답변이 없다면, "제공된 정보로는 답변할 수 없습니다."라고 말하세요.

    {context}

    질문: {question}
    `);

  // 6. RAG 체인 구성
  const ragChain = RunnableMap.from({
      context: new RunnableLambda({
          func: (input) => retriever.invoke(input.question).then((docs) => docs.map(doc => doc.pageContent).join("\n\n")),
      }),
      question: (input) => input.question,
    })
    .pipe(prompt)
    .pipe(model)
    .pipe(new StringOutputParser());

  // 7. RAG 체인 실행
  const question = "LangChain은 무엇을 돕나요?";
  console.log(`\n질문: ${question}`);
  
  const result = await ragChain.invoke({ question });
  console.log(`\n답변: ${result}`);
};

run();