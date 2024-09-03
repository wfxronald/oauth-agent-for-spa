/*
 *  Modelled based on UserInfoController.ts
 *  Only to check if user is logged in or not
 */

import express from 'express'
import {getATCookieName, getIDCookieName, getIDTokenClaims, ValidateRequestOptions} from '../lib/index.js'
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
                const idTokenCookieName = getIDCookieName(config.cookieNamePrefix)
                const userData = getIDTokenClaims(config.encKey, req.cookies[idTokenCookieName])
                
                var expiryTimeInSec = (userData as any).exp;
                var currTimeInSec = Date.now() / 1000;
                if (currTimeInSec > expiryTimeInSec) {
                    // token expired
                    res.status(200).json({is_logged_in: false})
                } else {
                    res.status(200).json({
                        access_token_expires_in: Math.round(expiryTimeInSec - currTimeInSec),
                        id_token_claims: userData,
                        is_logged_in: true
                    })
                }   
            } catch (exc) {
                // likely 'No ID cookie was supplied in a call to get claims'
                console.log(`getIDTokenClaims error: ${exc}`)
                res.status(200).json({is_logged_in: false})
            }
        } else {
            // no AT cookie means not logged in
            res.status(200).json({is_logged_in: false})
        }
    }
}

export default SessionController
