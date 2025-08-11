const fs     = require('fs');
const pdf    = require('pdf-parse');
const gemini = require('./gemini.js'); 
const db     = require('@db');
const query  = require('@query');

exports.aiAnalyzeResume = async ( userId, fileUrl ) => {
    const ResumeUrl      = `./${fileUrl}`;
    const dataBuffer     = fs.readFileSync( ResumeUrl );
    let pdfData          = await pdf(dataBuffer);
    pdfData              = pdfData.text.replace(/\n/g, '');
    const aiAnlaysReulst = await gemini.generateContent( pdfData );
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

    await db.query(query.updateCareerDesc, [ aiAnlaysReulst, userId ] )
}



