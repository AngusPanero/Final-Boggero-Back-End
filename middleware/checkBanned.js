const checkBanned = (req, res, next) => {
    if(req.user?.banned){
        return res.status(403).json({
            code: "USER_BANNED",
            message: "User is banned",
            reason: req.user.bannedReason
        })
    }
    next()
}

module.exports = checkBanned