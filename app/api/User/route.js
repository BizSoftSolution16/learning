import connectDB from "@/lib/connectDB"

export const GET = async () => {
    try {
        const pool = await connectDB()

        const result = await pool.request()
            .query('SELECT * FROM Users')

        return Response.json({
            success: true,
            users: result.recordset
        }, { status: 200 })
    }
    catch (error) {
        console.log(error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
