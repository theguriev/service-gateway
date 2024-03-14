/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/default */

import jwt, { JwtPayload } from 'jsonwebtoken'

describe('issueAccessToken', () => {
  const secret = 'mySecretKey'
  const payload = { userId: 12345 }

  it('should issue an access token with default expiration time', () => {
    const accessToken = issueAccessToken(payload, { secret })
    const decoded = jwt.verify(accessToken, secret) as JwtPayload

    expect(decoded.userId).toEqual(payload.userId)
  })

  it('should issue an access token with custom expiration time', () => {
    const customExpiresIn = '1h'
    const accessToken = issueAccessToken(payload, { secret, expiresIn: customExpiresIn })
    const decoded = jwt.verify(accessToken, secret) as JwtPayload

    expect(decoded.userId).toEqual(payload.userId)
  })
})
