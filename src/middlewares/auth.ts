import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import User, { IUser } from "../models/Users"

// Extends the Express Request interface to include a `user` property,
// which can hold the IUser type. The `?` indicates that this property
// is optional. This is useful when working with authentication middlewares
// that attach user data to the request object.
declare global {
    namespace Express {
        interface Request {
            recover_user?: IUser
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization
    if (!bearer) {
        const error = new Error("No Autorizado")
        res.status(401).json({ error: error.message })
        return
    }
    // const token = bearer.split(' ')[1] //other way
    const [, token] = bearer.split(' ')
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (typeof decoded === 'object' && decoded.id) {
            const user = await User.findById(decoded.id).select('_id name email') // Retrieves the user by their ID and limits the fields returned to only `_id`, `name`, and `email`.
            // This helps improve performance and security by excluding unnecessary or sensitive data.
            if (user) {
                // Assigns the user data to the custom `recover_user` property on the request object.
                // This allows the user information to be accessed later in the request lifecycle.
                req.recover_user = user
                next()
            } else {
                res.status(500).json({ error: "Token No Válido" })
            }
        }
    } catch (error) {
        res.status(500).json({ error: "Token No Válido" })
    }


}