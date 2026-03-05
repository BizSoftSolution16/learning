import connectDB, { sql } from "@/lib/connectDB"

export const POST = async (req) => {
    const { name, email, password, role } = await req.json()
    try {
        const pool = await connectDB()

        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .input('role', sql.NVarChar, role || 'user')
            .query(`
                INSERT INTO Users (name, email, password, role)
                VALUES (@name, @email, @password, @role);
                SELECT SCOPE_IDENTITY() AS id;
            `)

        return Response.json({
            success: true,
            user: {
                id: result.recordset[0].id,
                name,
                email,
                role: role || 'user'
            }
        }, { status: 201 })
    }
    catch (error) {
        console.log(error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
