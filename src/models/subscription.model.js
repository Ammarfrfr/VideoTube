import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber:{
      type: Schema.Types.ObjectId,    // one user subscribing to many channels (type shi)
      ref: "User"
    },
    channel:{
      type: Schema.Types.ObjectId,    // users subscribing to one subscriber (type shi)
      ref: "User"
    }
  },
  {timestamps: true}
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema)