import express, { Request, Response } from 'express';

import { UserAttributes, UserInstance } from '../model/userModel';
import { v4 as uuidv4 } from 'uuid';
import { fromAdminMail, userSubject } from '../config';
import { JwtPayload } from 'jsonwebtoken';
import { GenerateSignature, loginSchema, option, updateSchema, validatePassword, vendorSchema } from '../utils';
import { VendorAttributes, VendorInstance } from '../model/vendorModel';
import { FoodAttributes, FoodInstance } from '../model/foodModel';

export const VendorLogin = async (req: JwtPayload, res: Response) => {
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


        // / check if a vendor exists
        const Vendor = await VendorInstance.findOne({
            where: { email: email }
        }) as unknown as VendorAttributes;

        if (Vendor) {
            const validation = await validatePassword(password, Vendor.password, Vendor.salt)
            if (validation) {

                // generate  signature for user
                let signature = await GenerateSignature({
                    id: Vendor.id,
                    email: Vendor.email,
                    serviceAvailable: Vendor.serviceAvailable
                })

                return res.status(200).json({
                    message: "You have successfully logged in",
                    signature,
                    email: Vendor.email,
                    role: Vendor.role,
                    serviceAvailable: Vendor.serviceAvailable

                });
            }
        }

        res.status(400).json({
            Error: "Wrong Username or password"
        })

    } catch (error) {
        res.status(500).json({
            message: "Internal server Error",
            routes: "vendors/login"
        })

    }


}


/**************************************** VENDOR ADD FOOD  ****************************/

export const createFood = async (req: JwtPayload, res: Response) => {
    try {
        const id = req.vendor.id

        const { name, description, foodType, category, readyTime, price, image } = req.body


        // / check if a vendor exists
        const Vendor = await VendorInstance.findOne({
            where: { id: id }
        }) as unknown as VendorAttributes;
        const foodId = uuidv4()
        if (Vendor) {
            const createdFood = await FoodInstance.create({
                id: foodId, name, description, foodType, category, readyTime, price, rating: 0, vendorId: id, image:req.file.path
            });
            return res.status(201).json({
                message: "Food created successfully",
                createdFood

            });
        }

    } catch (error) {
        res.status(500).json({
            Error: "Internal server Error",
            routes: "vendors/login"
        })

    }


}
/*============================Get Vendor profile===============================*/
export const VendorProfile = async(req: JwtPayload, res: Response) => {
    try {
        const id = req.vendor.id
        // / check if a vendor exists
        const Vendor = await VendorInstance.findOne({
            where: { id: id },
            // attributes: [""],
            include: [
                {
                    model: FoodInstance,
                    as: 'food',
                    attributes:["id","name","description","category","foodType", "readyTime","price","rating","vendorId"]
                }
            ]
        }) as unknown as VendorAttributes;
        return res.status(200).json({
            Vendor

        });
        
     } catch (error) {
        res.status(500).json({
            Error: "Internal server Error",
            routes: "vendors/get-profile"
        })
    }
}

/*============================Get delete food===============================*/
export const DeleteFood = async (req: JwtPayload, res: Response) => {
    try {
        const id = req.vendor.id;
        const foodid = req.params.foodid

        // check if the vendor exist
        const Vendor = await VendorInstance.findOne({
            where: { id: id },
        }) as unknown as VendorAttributes;

        if (Vendor) {
            const deletedFood = await FoodInstance.destroy({ where: { id: foodid } });

            return res.status(200).json({
                Message: "you have succesfully deleted food",
                deletedFood

            });
        }
        

 } catch (error) {
        res.status(500).json({
            Error: "Internal server Error",
            routes: "vendors/get-profile"
        })
        
    }
}


export const updateVendorProfile = async (req: JwtPayload, res: Response) => {
    try {
        const id = req.vendor.id;
        const { name, coverImage, address, phone } = req.body;
        // Joi validation
        const validateResult = updateSchema.validate(req.body, option)
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            });
        }
        // check if  the user is a registered user
        const Vendor = await UserInstance.findOne({
            where: { id: id }
        }) as unknown as UserAttributes;

        if (!Vendor) {
            return res.status(400).json({
                Error: "You are not authorised to update profile"
            });

        }

        const updatedVendor = await VendorInstance.update({
            name,
            phone,
            address,
            coverImage: req.file.path
        }, { where: { id: id } }) as unknown as UserAttributes;

        if (updatedVendor) {
            const Vendor = await UserInstance.findOne({
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

