import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler( async (req, res, next) => {

  try {
    // get token from cookies or headers (header means postman or frontend)
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
    // if no token found
    if(!token){
      throw new ApiError(401, "Token generation was unsuccessfull")
    }

    // verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    // get user from token using id in token and remove password and refresh token from user object
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if(!user){
      throw new ApiError(40, "Invalid Access Token  ")
    }

    // attach user to req object
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
  }
})


// then go to routes
