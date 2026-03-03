import connectDB from "@/lib/connectDB"
import User from "@/models/User"


const POST = async (req) => {
    const { name, email, password } = await req.body
    try {
        connectDB()
        User.create({
            name: 'azizahmed',
            email: 'azizahmed@gmail.com',
            password: 'azizahmed',
        })
    }
    catch (error) {
        console.log(error)
    }
}