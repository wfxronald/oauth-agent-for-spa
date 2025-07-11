/*
 * Mostly copied from ClaimsController.ts
 * The library used by the SPA Front-End to call this OAuth Agent is token-handler-js-assistant
 * This library calls /session endpoint (not /claims) to get ID Token claims and user login status
 * We duplicate instead of modifying ClaimsController directly to minimise changes to token-handler-js-assistant
 */

import express from 'express'
import {getIDCookieName, getIDTokenClaims, ValidateRequestOptions} from '../lib/index.js'
import {config} from '../config.js'
import validateExpressRequest from '../validateExpressRequest.js'
import {asyncCatch} from '../middleware/exceptionMiddleware.js';

class SessionController {
    public router = express.Router()

    constructor() {
        this.router.get('/', asyncCatch(this.getClaims))
    }

    getClaims = async (req: express.Request, res: express.Response, next: express.NextFunction) => {

        // Verify the web origin
        const options = new ValidateRequestOptions()
        options.requireCsrfHeader = false;
        options.requireTrustedOrigin = config.corsEnabled;
        validateExpressRequest(req, options)

        const idTokenCookieName = getIDCookieName(config.cookieNamePrefix)
        if (req.cookies && req.cookies[idTokenCookieName]) {

            const userData = getIDTokenClaims(config.encKey, req.cookies[idTokenCookieName])
            var idTokenExpiryTimeInSec = (userData as any).exp;
            var currTimeInSec = Date.now() / 1000;
            if (currTimeInSec > idTokenExpiryTimeInSec) {
                // Force user to log in again if ID Token is expired
                // By default, lifetime of ID Token and Access Token is both 1 hour
                // Assume the expiry for both token is the same and just check expiry of ID Token
                return res.status(200).json({is_logged_in: false})
            }
            return res.status(200).json({is_logged_in: true, id_token_claims: userData})

        } else {
            // No ID Token cookie means the user has not logged in
            return res.status(200).json({is_logged_in: false})
        }
    }
}

export default SessionController
