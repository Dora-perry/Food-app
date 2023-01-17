import express from 'express'
import { Request,Response } from 'express';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import userRouter from './routes/users'
import indexRouter from './routes/index'
import adminRouter from './routes/Admin'
import vendorRouter from './routes/Vendor'
import dotenv from 'dotenv'
import { db } from './config'

dotenv.config()
// sequelize connection
db.sync().then(() => {
    console.log("Db connected succesfully");
}).catch(err => {
    console.log(err);
})
const app = express()

app.use(express.json())
app.use(logger('dev'));
app.use(cookieParser())

app.use('/', indexRouter)
app.use('/users', userRouter)
app.use('/admins', adminRouter)
app.use('/vendor',vendorRouter)
const port = 4000
app.listen(port, () => {
    console.log(`server running on http://localhost:${port}`);
    
})


export default app