import z from "zod"

export const UserSchema = z.object({
    username: z.string().min(4, "Username must be at least 4 characters long!"),
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters long!"),
})

export const UserLoginSchema = z.object({
    username: z.string().min(4, "Username must be at least 4 characters long!"),
    password: z.string().min(6, "Password must be at least 6 characters long!"),
})

export type UserDto= z.infer<typeof UserSchema>
export type UserLoginDto = z.infer<typeof UserLoginSchema>