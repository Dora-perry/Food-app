import { DataTypes, Model } from 'sequelize';
import { db } from '../config'
import { FoodInstance } from './foodModel';

export interface VendorAttributes {
    id: string;
    name: string;
    restaurantName: string;
    pincode: string;
    email: string;
    password: string;
    serviceAvailable: boolean;
    rating: number;
    salt: string;
    address: string;
    phone: string;
    role: string
    coverImage:string
}

export class VendorInstance extends Model<VendorAttributes> { }

VendorInstance.init({
    id: {
        type: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notNull: {
                msg: "Email address is required"
            },
            isEmail: {
                msg: "please provide a valid email"
            }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "password required"
            },
            notEmpty: {
                msg: " provide a password"
            }
        }
    },
    salt: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "provide a phone number",
            },
            notEmpty: {
                msg: "phone is required"
            }
        }
    },
    restaurantName: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pincode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    serviceAvailable: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    rating: {
        type: DataTypes.NUMBER,
        allowNull: true,

    },
    role: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    coverImage: {
        type: DataTypes.STRING,
        allowNull: true,
    },

},

    {
        sequelize: db,
        tableName: 'vendor'
    }
);

VendorInstance.hasMany(FoodInstance, { foreignKey: 'vendorId', as: 'food' })

FoodInstance.belongsTo(VendorInstance,{foreignKey:'vendorId', as:'vendor'})