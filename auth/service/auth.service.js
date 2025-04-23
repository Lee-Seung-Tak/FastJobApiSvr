
const login = async( email, password ) =>{
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
}