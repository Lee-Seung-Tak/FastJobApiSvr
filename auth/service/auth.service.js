
const db        = require('@db')
const queryJson = require('@query')


exports.login = async( email, password ) => {
    const result = await db.query('SELECT NOW()');
    console.log(result);
    //const result = await pool.query( query.login, [email]);
}