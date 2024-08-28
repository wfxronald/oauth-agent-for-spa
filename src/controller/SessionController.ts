/*
 *  Modelled based on UserInfoController.ts
 *  Only to check if user is logged in or not
 */

import express from 'express'
import {getATCookieName, getUserInfo, ValidateRequestOptions} from '../lib/index.js'
import {config} from '../config.js'
import validateExpressRequest from '../validateExpressRequest.js'
import {asyncCatch} from '../middleware/exceptionMiddleware.js'

class SessionController {
    public router = express.Router()

    constructor() {
        this.router.get('/', asyncCatch(this.getSession))
    }

    getSession = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        // Verify the web origin
        const options = new ValidateRequestOptions()
        options.requireCsrfHeader = false;
        options.requireTrustedOrigin = config.corsEnabled
        validateExpressRequest(req, options)

        const atCookieName = getATCookieName(config.cookieNamePrefix)
        if (req.cookies && req.cookies[atCookieName]) {
            try {
                const accessToken = req.cookies[atCookieName]
                const userData = await getUserInfo(config, config.encKey, accessToken)
                res.status(200).json({is_logged_in: true})
            } catch (exc) {
                // TODO: does this handle expired token?
                console.log(`getUserInfo from AT cookie error: ${exc}`)
                res.status(200).json({is_logged_in: false})
            }
        } else {
            res.status(200).json({is_logged_in: false})
        }
    }
}

export default SessionController
