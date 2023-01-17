import { VendorPayload } from './Vendor.dto';
import { UserPayload } from './user.dto'



export type AuthPayload = VendorPayload | UserPayload
    