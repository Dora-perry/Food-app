import { DataTypes, Model } from 'sequelize';
import { db } from '../config'

export interface FoodAttributes {
    id: string;
    name: string;
    description: string;
    foodType: string;
    category: string;
    readyTime:number;
    price: number;
    image:string,
    rating: number;
    vendorId:string
}

export class FoodInstance extends Model<FoodAttributes> { }
FoodInstance.init({
    id: {
        type: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
   
    category: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    foodType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    vendorId: {
        type: DataTypes.UUIDV4,
        allowNull: true
    },
    rating: {
        type: DataTypes.NUMBER,
        allowNull: true,

    },
    readyTime: {
        type: DataTypes.NUMBER,
        allowNull: true,
    },
    price: {
        type: DataTypes.NUMBER,
        allowNull: true,
    },

},

    {
        sequelize: db,
        tableName: 'food'
    }
)