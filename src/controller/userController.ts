import express, { Request, Response } from 'express';
import { registerSchema, option, GeneratePassword, GenerateSalt, GenerateOTP, onRequestOTP, emailHtml, mailsent, GenerateSignature, verifySignature,loginSchema, validatePassword,updateSchema} from '../utils'
import { UserAttributes, UserInstance } from '../model/userModel';
import { v4 as uuidv4 } from 'uuid';
import { fromAdminMail, userSubject } from '../config';
import { JwtPayload } from 'jsonwebtoken';

/**=======================================================Register User=========================================================**/

export const Register = async (req: Request, res: Response) => {
    try {
        const{
            email, phone, password, confirm_password
        } = req.body;
        const uuiduser = uuidv4()
        const validateResult = registerSchema.validate(req.body, option)
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }
        // GENERATE SALT
        const salt = await GenerateSalt();
        const userPassword = await GeneratePassword(password, salt)

        // generate otp
        const { otp, expiry } = GenerateOTP();

        // check if the user exists
        const User = await UserInstance.findOne({
            where: { email: email }
        });

        // create user
        if (!User) {
            await UserInstance.create({
                id: uuiduser,
                email,
                password: userPassword,
                firstName: "",
                lastName: "",
                salt,
                address: "",
                phone,
                otp,
                otp_expiry: expiry,
                lng: 0,
                lat: 0,
                verified: false,
                role:"user"
            })
            // SEND OTP TO USER
            await onRequestOTP(otp, phone);


            // send email
            const html = emailHtml(otp)

            await mailsent(fromAdminMail, email, userSubject, html)

            // check if a user exists
            const User = await UserInstance.findOne({
                where: { email: email }
            }) as unknown as UserAttributes

            // generate signature
            let signature = await GenerateSignature({
                id: User.id,
                email: User.email,
                verified: User.verified
            })


            return res.status(201).json({
                message: "User created successfully check your email or phone number for verification",
                signature,
                verified: User.verified,
            
            })
        }
        return res.status(400).json({
            message: " user already exist"
        })


    } catch (error) {
        console.log(error);
        
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/signup"
        })

    }
}

/**===================================verify Users============================== */


export const verifyUser = async(req: Request, res: Response) => {
    try {

        const token = req.params.signature
        const decode = await verifySignature(token) as JwtPayload;
        // console.log(decode);

        // check if user is a registered user
        const User = await UserInstance.findOne({
            where: { email: decode.email }
        }) as unknown as UserAttributes

        if (User) {
            const { otp } = req.body;
            if (User.otp === parseInt(otp) && User.otp_expiry >= new Date()) {
                const updatedUser = await UserInstance.update({
                   verified: true
                }, { where: { email: decode.email } })as unknown as UserAttributes
                
                // Regenerate a  new signature
                let signature = await GenerateSignature({
                    id: updatedUser.id,
                    email: updatedUser.email,
                    verified: updatedUser.verified
                });

                if (updatedUser) {
                    const User = await UserInstance.findOne({
                        where: { email: decode.email }
                    }) as unknown as UserAttributes

                    return res.status(200).json({
                        message: "You have successfully verified your account",
                        signature,
                        verified: User.verified,
                    });
                }


            }
        };

        return res.status(400).json({
            Error: "Invalid credential or otp already expired"
        })
        
        
    } catch (error) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/verify",
        })

    }
}


/**==============================================Login User============================== **/

export const Login = async (req: Request, res: Response) => {
    try {
        const {
            email, password,
        } = req.body;
        const validateResult = loginSchema.validate(req.body, option)
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            });
        }


        // / check if a user exists
        const User = await UserInstance.findOne({
            where: { email: email }
        }) as unknown as UserAttributes;

        if (User.verified === true) {
            const validation = await validatePassword(password, User.password, User.salt)
            if (validation) {

                // generate  signature for user
                let signature = await GenerateSignature({
                    id: User.id,
                    email: User.email,
                    verified: User.verified
                })

                return res.status(200).json({
                    message: "You have successfully logged in",
                    signature,
                    email: User.email,
                    verified: User.verified,
                });
            }
        }
        
        res.status(400).json({
            Error:"Wrong Username or password"
        })

        
     } catch (error) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/login"
        });

    }
};


/**=============================Resend OTP============================= */

export const resendOTP = async (req: Request, res: Response) => {
    try {

        const token = req.params.signature
        const decode = await verifySignature(token);

        // check if user is a registered user
        const User = await UserInstance.findOne({
            where: { email: decode.email }
        }) as unknown as UserAttributes;

        if (User) {
            // generate OTP
            const { otp, expiry } = GenerateOTP();
            const updatedUser = await UserInstance.update({
                otp,
                otp_expiry:expiry
            }, { where: { email: decode.email } }) as unknown as UserAttributes

            if (updatedUser) {
                const User = await UserInstance.findOne({
                    where: { email: decode.email }
                }) as unknown as UserAttributes
            //    send otp to user
                await onRequestOTP(otp, User.phone);

                // send mail to user

                const html = emailHtml(otp);
                await mailsent(fromAdminMail, User.email, userSubject, html);


                return res.status(200).json({
                    message: "OTP resent to registered phone number and email",

                });
            }
            
        }

        return res.status(400).json({
            Error: "Error sending otp"
        });


        
    } catch (error) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/resend-otp/:signature",
        })

    }
}


/**================================= PROFILE============================= */

export const getAllUsers = async(req: Request, res: Response) => {
    try {
        // the alternative to findall is findAndCountAll
        // to target limit
        const limit = req.query.limit as number | undefined
        const users = await UserInstance.findAndCountAll({
            limit:limit

        })
      return  res.status(200).json({
            message: 'You have successfully retrieved all users',
            count: users.count,
            Users:users.rows
      })
        
    } catch (error) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/get-all-users",
        })
}
}

export const getSingleUser = async (req:JwtPayload, res: Response) => {
    try {
            const {id} = req.user
        const User = await UserInstance.findOne({
            where: { id:id}
        }) as unknown as UserAttributes

        if (User) {
            return res.status(200).json({
                User
            })
        }

        return res.status(200).json({
            message: "User not found",
            User
        })
        
    } catch (error) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/get-users",
        })
    }
}


export const updateUserProfile = async(req: JwtPayload, res: Response) => {
    try {
        const id = req.user.id;
        const { firstName, lastName, address, phone } = req.body;
        // Joi validation
        const validateResult = updateSchema.validate(req.body, option)
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            });
        }
        // check if  the user is a registered user
        const User = await UserInstance.findOne({
            where: { id: id }
        }) as unknown as UserAttributes;

        if (!User) {
            return res.status(400).json({
                Error: "You are not authorised to update profile"
            });

        }

        const updatedUser = await UserInstance.update({
            firstName,
            lastName,
            address,
            phone
        }, { where: { id: id } }) as unknown as UserAttributes;

        if (updatedUser) {
            const User = await UserInstance.findOne({
                where: { id: id },
            }) as unknown as UserAttributes;

            return res.status(200).json({
                message: 'You have successfully updated your profile'
            })

        }
         } catch (err) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/update-profile",
        })
        
    }
}
