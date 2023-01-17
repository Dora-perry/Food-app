import express, { Request, Response } from 'express';
import { emailHtml, GenerateOTP, GeneratePassword, GenerateSalt, GenerateSignature, mailsent,adminSchema, option, vendorSchema } from '../utils'
import { UserAttributes, UserInstance } from '../model/userModel';
import { v4 as uuidv4 } from 'uuid';
import { fromAdminMail, userSubject } from '../config';
import { JwtPayload } from 'jsonwebtoken';
import { VendorAttributes, VendorInstance } from '../model/vendorModel';
import { Op, or } from 'sequelize';

export const AdminRegister = async (req: JwtPayload, res: Response) => {
    try {
        const id = req.user.id;
   
        const {
            email, phone, password,firstName, lastName,address
        } = req.body;
        const uuiduser = uuidv4()


        const validateResult = adminSchema.validate(req.body, option)
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }

        // GENERATE SALT
        const salt = await GenerateSalt();
        const adminPassword = await GeneratePassword(password, salt)
        

        // generate otp
        const { otp, expiry } = GenerateOTP();
      

        // check if the admin exists
        const Admin = await UserInstance.findOne({
            where: {id:id }
        }) as unknown as UserAttributes
       
        

        const existingAdmin = await UserInstance.findOne({
            where: { email: email}
        }) as unknown as UserAttributes
       
        if (existingAdmin ) {
            return res.status(400).json({
                Error: "Admin already exists"
            });
        }
        // console.log(existingAdmin)
        // if (existingAdmin) {
        //     return res.status(400).json({
        //         Error: " Admin Phone number already exists"
        //     });
        //  }

        // create Admin
        if (Admin.role === "superadmin") {
            await UserInstance.create({
                id: uuiduser,
                email,
                password: adminPassword,
                firstName,
                lastName,
                salt,
                address,
                phone,
                otp,
                otp_expiry: expiry,
                lng: 0,
                lat: 0,
                verified: true,
                role: "role",

            });
            // check if Admin is created
            const admin = await UserInstance.findOne({ where: { id: id } }) as unknown as UserAttributes
            
           // generate signature 
            let signature = await GenerateSignature({
                id: admin.id,
                email: email,
                verified:admin.verified
            })

            return res.status(201).json({
                message: "Admin created successfully",
                signature,
                verified: Admin.verified,

            })
        }
        return res.status(400).json({
            message: " user already exists"
        })


    } catch (error) {
           res.status(500).json({
            Error: "Internal server Error",
               route: "/admins/signup",
               error,
        })

    }
}


/**===========================================Create superAdmin===================================== */
export const SuperAdmin = async (req: JwtPayload, res: Response) => {
    try {
        const id = req.body.id
        const {
            email, phone, password, firstName, lastName, address
        } = req.body;
        const uuiduser = uuidv4();

        const validateResult = adminSchema.validate(req.body, option)
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }

        // GENERATE SALT
        const salt = await GenerateSalt();
        const adminPassword = await GeneratePassword(password, salt)

        // generate otp
        const { otp, expiry } = GenerateOTP();

        // check if the admin exists
        const Admin = await UserInstance.findOne({
            where: {email:email}
        }) as unknown as UserAttributes

        // create Admin

        if (!Admin) {
            await UserInstance.create({
                id: uuiduser,
                email,
                password: adminPassword,
                firstName,
                lastName,
                salt,
                address,
                phone,
                otp,
                otp_expiry: expiry,
                lng: 0,
                lat: 0,
                verified: true,
                role: "superadmin",

            });
            //   check if Admin exist
            const Admin = await UserInstance.findOne({
                where: { email: email }
            }) as unknown as UserAttributes


            // generate signature 
            let signature = await GenerateSignature({
                id: Admin.id,
                email: email,
                verified: Admin.verified
            });
               // send email
            const html = emailHtml(otp)
            await mailsent(fromAdminMail, email, userSubject, html)

            return res.status(201).json({
                message: "Superadmin created successfully",
                signature,
                verified: Admin.verified,

            });
        }
        return res.status(400).json({
            message: "Admin already exists"
        })
     } catch (error) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/admins/signup",
            error,
        })

    }
}


/**=========================================Create Vendor========================================* */

export const createVendor = async (req: JwtPayload, res: Response) => { 

    try {
        const id = req.user.id

        const { name,
            restaurantName,
            pincode,
            email,
            password,
            phone,
            address } = req.body;
        
        const validateResult = vendorSchema.validate(req.body, option)
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }

        // GENERATE SALT
        const salt = await GenerateSalt();
        const vendorPassword = await GeneratePassword(password, salt)
        const uuidvendor = uuidv4()


        // check if the admin exists
        const Admin = await UserInstance.findOne({
            where: {id:id}
        }) as unknown as UserAttributes

        const Vendor = await UserInstance.findOne({
            where: { email: email }
        }) as unknown as VendorAttributes

        if (Admin.role === 'admin' || Admin.role === 'superadmin') {

            if (!Vendor) {
                await VendorInstance.create({
                    id: uuidvendor,
                    email,
                    password: vendorPassword,
                    salt,
                    address,
                    phone,
                    serviceAvailable: false,
                    rating: 0,
                    role: "vendor",
                    pincode,
                    restaurantName,
                    name,
                    coverImage:""

                });
                return res.status(201).json({
                    message: "Vendor created successfully",
                    createVendor,

                })
            }

            return res.status(400).json({
                message: " vendor already exists"
            })
        }

        
        return res.status(400).json({
            message: "sorry, you are not authorised"
        })



        
    } catch (error) {
        console.log(error);
        
    }
}


