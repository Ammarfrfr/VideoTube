import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const generateRefreshAndAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found while generating tokens")
        }
        // these are methods so () is needed
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()

        // storing the token in db
        user.refreshToken = refreshToken
        // saving in db
        await user.save({ validateBeforeSave: false })

        // we need this so we return
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}



const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    // receive user details from req.body
    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    // verify that all fields are present
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // .findOne helps in finding using this syntax 
    // $or: this is used to check if either is true or some shit
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    // this is by multer to tweak and collect files and some shit
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        // .select("-password") this will like empty whatever to select here while initialising with -
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler( async (req, res) => {
    // take your input from req body
    // trim the spaces if the user has typed it by mistake 
    // find the user if it exists or not
    // check username and password is correct
    // validate and generate access token
    // then generate refresh token so that your shit is saved
    // send these tokens using cookies

    const {email, username, password} = req.body
    console.log(email); 

    // require username OR email, and password
    if (!username && !email) {
        throw new ApiError(400, "Username or Email is required to LogIn")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "Invalid Credentials")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400, "Password is Invalid")
    }

    const {accessToken, refreshToken} = await generateRefreshAndAccessToken(user._id)

    const loggedIn = await User.findById(user._id).select("-password -refreshToken")

    // this locks the cookie so it can only be changed on the server
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedIn, accessToken, refreshToken },
                "User logged in successfully"
            )
        )

})

const logOutUser = asyncHandler(async (req, res) => {
    // delete cookies
    // delete refreshToken

    /*
        had to do multiple shit to get the user Refrence, so we prepare middleware 
    */

    // 
    User.findByIdAndUpdate(
        await req.user._id,
        {   // sets refreshToken undefined so the user can logout 
            $set: {refreshToken: undefined}
        },
        {   // new values storing will be true
            new: true
        }
    )

    // no options
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})

export {
    registerUser,
    loginUser,
    logOutUser
}