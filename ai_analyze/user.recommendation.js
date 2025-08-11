// user.recommendation.js
import * as dotenv from "dotenv";
dotenv.config({ path: '../.env' });

import * as utils from "./utils.js";

// 추천 로직 함수
async function runRecommendation() {
  const client = utils.createPgClient();
  await client.connect();

  const userRawData    = await utils.fetchUserData(client);
  console.log('-----------------userRawData------------------', userRawData);
  const companyRawData = await utils.fetchCompanyData(client);
  console.log('-----------------companyRawData-------------------', companyRawData);
  await client.end();

  const docs        = utils.buildUserDocs(userRawData);
  console.log('------------------docs--------------------------', docs);
  const embeddings  = utils.createEmbeddings();
  const model       = utils.createChatModel();
  const vectorStore = await utils.createVectorStore(docs, embeddings);
  const retriever   = utils.createRetriever(vectorStore);
  const ragChain    = utils.buildRagChain(retriever, model);

  for (const company of companyRawData) {
    if (company.ideal_candidate_profile && company.email) {
      const returnData = await utils.findTalented(ragChain, company.ideal_candidate_profile);
      try {
        const { info, name } = await utils.sendRecommendationEmail(company, returnData);
        console.log('-------------------returnData-----------------', returnData);
        console.log(`[메일 발송 성공] ${company.name} -> ${company.email} / ${info.messageId} / ${name}`);
      } catch (err) {
        console.error(`[메일 발송 실패] ${company.name} -> ${company.email}`, err);
      }
    }
  }
}

// ltj add / 첫 실행
runRecommendation();

// ltj add / 30초마다 반복
setInterval(() => {
  runRecommendation().catch(err => console.error(err));
}, 30 * 1000);