import { Client } from "pg";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableMap } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

dotenv.config({ path: '../.env' });

// ESM에서 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =================== DB ===================
export function createPgClient(cfg = {}) {
  return new Client({
    user: cfg.user ?? "postgres",
    host: cfg.host ?? "127.0.0.1",
    database: cfg.database ?? "api",
    password: cfg.password ?? "1111",
    port: cfg.port ?? 5433,
  });
}

export async function fetchUserData(client) {
  const res = await client.query(
    "SELECT name, email, phone, resume, self_intro, career_desc FROM users.user_account;"
  );
  return res.rows;
}

export async function fetchCompanyData(client) {
  const res = await client.query(
    "SELECT name, email, phone, ideal_candidate_profile FROM company.company_account;"
  );
  return res.rows;
}


export function buildUserDocs(userRows = []) {
  return userRows.map(
    (user) =>
      new Document({
        pageContent: `
자기소개: ${user.self_intro ?? ""}
경력기술서: ${user.career_desc ?? ""}
이력서: ${user.resume ?? ""}
        `.trim(),
        metadata: {
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      })
  );
}

export function createEmbeddings(opts = {}) {
  return new OpenAIEmbeddings({
    model: opts.model ?? "text-embedding-3-small",
    timeout: opts.timeout ?? 60_000,
    maxRetries: opts.maxRetries ?? 1,
  });
}

export function createChatModel(opts = {}) {
  return new ChatOpenAI({
    modelName: opts.modelName ?? "gpt-4.1-nano",
    temperature: opts.temperature ?? 0,
  });
}

export async function createVectorStore(docs, embeddings) {
  return MemoryVectorStore.fromDocuments(docs, embeddings);
}

export function createRetriever(vectorStore, k = 4) {
  return vectorStore.asRetriever(k);
}

// =================== 체인 / 질의 ===================
export function formatDocsForPrompt(docs = []) {
  return docs
    .map(
      (doc) =>
        `이름: ${doc.metadata.name}\n내용: ${doc.pageContent}`
    )
    .join("\n\n");
}

export function buildRagChain(retriever, model) {
  const prompt = ChatPromptTemplate.fromTemplate(`
아래 문맥(context)을 사용하여 요구 조건에 맞는 사람의 이름과 이유를 작성하세요.
없으면 가장 유사한 사람을 추천하세요.

{context}

질문: {question}

이름 :
이유 :
  `.trim());

  return RunnableMap.from({
    context: async (input) => {
      const retrieved = await retriever.invoke(input.question);
      return formatDocsForPrompt(retrieved);
    },
    question: (input) => input.question,
  })
    .pipe(prompt)
    .pipe(model)
    .pipe(new StringOutputParser());
}

export async function findTalented(chain, question) {
  return chain.invoke({ question });
}

// ltj add / 메일 함수
let transporter = null;
function getMailer() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // 고정
    port: 587,              // 고정
    secure: false,          // 고정
    auth: {
      user: process.env.SYS_EMAIL,      // 환경변수
      pass: process.env.SYS_EMAIL_KEY,  // 환경변수
    },
    requireTLS: true, // secure=false면 TLS 필수
  });

  return transporter;
}

export function parseNameAndReason(ragText = "") {
  const nameMatch   = ragText.match(/이름\s*:\s*(.+)/);
  const reasonMatch = ragText.match(/이유\s*:\s*([\s\S]+)/);
  const name   = (nameMatch?.[1] || "").split(/\r?\n/)[0].trim() || "미상";
  const reason = (reasonMatch?.[1] || "").trim() || "사유 미상";
  return { name, reason };
}

function renderHtmlTemplate(replacements = {}) {
  const tplPath = path.join(__dirname, "web", "index.html");
  let html = fs.readFileSync(tplPath, "utf8");
  for (const [key, val] of Object.entries(replacements)) {
    const regex = new RegExp(`{{\\s*${escapeRegex(key)}\\s*}}`, "g");
    html = html.replace(regex, String(val ?? ""));
  }
  return html;
}
function escapeRegex(s = "") {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildRecommendationEmail(company, ragText) {
  const { name, reason } = parseNameAndReason(ragText);
  const subject = `[추천] ${company.name}에 적합한 인재: ${name}`;
  const text = [
    `${company.name} 담당자님,`,
    "",
    "아래 인재를 추천드립니다.",
    `- 이름: ${name}`,
    "",
    "추천 사유",
    reason,
    "",
    "감사합니다.",
  ].join("\n");
  const html = renderHtmlTemplate({
    company_name: company.name,
    candidate_name: name,
    reason,
  });
  return { subject, text, html, name, reason };
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || process.env.SYS_EMAIL;
  const info = await getMailer().sendMail({ from, to, subject, text, html });
  return info;
}

export async function sendRecommendationEmail(company, ragText) {
  const { subject, text, html, name, reason } = buildRecommendationEmail(company, ragText);
  const info = await sendEmail({ to: company.email, subject, text, html });
  return { info, name, reason };
}