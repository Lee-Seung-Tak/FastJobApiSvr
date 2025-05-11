const fs     = require('fs');
const pdf    = require('pdf-parse');
<<<<<<< HEAD
const gemini = require('@ai_analyze_gemini'); 
=======
const gemini = require('./gemini.js'); 
>>>>>>> 2f5bb8d (lst add / use ai model function add)
const db     = require('@db');
const query  = require('@query');

exports.aiAnalyzeResume = async ( userId, fileUrl ) => {
    const ResumeUrl      = `./${fileUrl}`;
    const dataBuffer     = fs.readFileSync( ResumeUrl );
    let pdfData          = await pdf(dataBuffer);
    pdfData              = pdfData.text.replace(/\n/g, '');
    const aiAnlaysReulst = await gemini.generateContent( pdfData );
<<<<<<< HEAD
=======

>>>>>>> 2f5bb8d (lst add / use ai model function add)
    await db.query(query.updateResume, [ aiAnlaysReulst, userId ] )
}

exports.aiAnalyzeSelfIntro = async ( userId, fileUrl ) => {
    const ResumeUrl      = `./${fileUrl}`;
    const dataBuffer     = fs.readFileSync( ResumeUrl );
    let pdfData          = await pdf(dataBuffer);
    pdfData              = pdfData.text.replace(/\n/g, '');
    const aiAnlaysReulst = await gemini.generateContent( pdfData );

    await db.query(query.updateSelfIntro, [ aiAnlaysReulst, userId ] )
}


exports.aiAnalyzeCarrerDesc = async ( userId, fileUrl ) => {
    const ResumeUrl      = `./${fileUrl}`;
    const dataBuffer     = fs.readFileSync( ResumeUrl );
    let pdfData          = await pdf(dataBuffer);
    pdfData              = pdfData.text.replace(/\n/g, '');
    const aiAnlaysReulst = await gemini.generateContent( pdfData );

<<<<<<< HEAD
    await db.query(query.updateCareerDesc, [ aiAnlaysReulst, userId ] )
}


// TO-DO ltj
/*
    1. 채용공고에 지원한 지원자들의 이력서, 경력기술서, 자기소개서를 바탕으로 어떤 사용자가 가장 지원한 공고에 적합한지 회사측에
    추천해주는 함수를 구현하세요.

    2. Rag를 활용하여 구축하세요.
 */
// end
=======
    await db.query(query.updateCarrerDesc, [ aiAnlaysReulst, userId ] )
}



>>>>>>> 2f5bb8d (lst add / use ai model function add)
