
const pool    = require('@db')
const query   = require('@query')

exports.login = async( email, password ) => {
    
    const result = await pool.query( query.login, [email]);
}