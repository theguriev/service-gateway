import { Schema } from 'mongoose'

const userSchema = new Schema({
  name: String,
  email: String,
  password: String,
  timestamp: Number,
  forgotPassword: {
    token: String,
    timestamp: Number
  }
})

export default userSchema
