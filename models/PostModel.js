const mongoose=require("mongoose");

const postSchema=new mongoose.Schema({
    title:{
        type:String
    },
    body:{
        type:String
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    user:{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        firstname:{
            type:String
        },
        email:{
            type:String
        }
    },
    likeCount:{
        type:Number,    
        default:0
    },
    likePersons:[{
            id:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            },
            firstname:{
                type:String
            }
    }],
    comments:[{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        firstname:{
            type:String
        },
        comment:{
            type:String
        }
    }]
})

const Post=mongoose.model("Post",postSchema);

module.exports=Post;