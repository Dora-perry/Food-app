import express from "express";
import { createFood, DeleteFood, updateVendorProfile, VendorLogin, VendorProfile } from "../controller/vendorController";
import { authVendor } from "../middleware/authorization"
import { upload } from "../utils/multer";




const router = express.Router();

router.post('/login', VendorLogin)
router.post('/create-food', authVendor, upload.single("image"), createFood)
router.get('/get-profile', authVendor, VendorProfile)

router.delete('/delete-food/:foodid', authVendor, DeleteFood)
router.patch('/update-profile', authVendor, upload.single('coverImage') ,updateVendorProfile)


export default router


