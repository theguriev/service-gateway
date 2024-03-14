export {}
declare global {
  const $fetch: typeof import('ofetch')['$fetch']
  const afterAll: typeof import('vitest')['afterAll']
  const beforeAll: typeof import('vitest')['beforeAll']
  const describe: typeof import('vitest')['describe']
  const expect: typeof import('vitest')['expect']
  const extractSetCookie: typeof import('/Users/eugen/work/service-authorization/utils/extractSetCookie')['default']
  const issueAccessToken: typeof import('/Users/eugen/work/service-authorization/utils/issueAccessToken')['default']
  const issueRefreshToken: typeof import('/Users/eugen/work/service-authorization/utils/issueRefreshToken')['default']
  const it: typeof import('vitest')['it']
  const parse: typeof import('set-cookie-parser')['parse']
  const passwordHash: typeof import('/Users/eugen/work/service-authorization/utils/passwordHash')['default']
  const uuidv4: typeof import('uuid')['v4']
  const verify: typeof import('/Users/eugen/work/service-authorization/utils/verify')['default']
  const zodValidateBody: typeof import('/Users/eugen/work/service-authorization/utils/zodValidateBody')['default']
  const zodValidateData: typeof import('/Users/eugen/work/service-authorization/utils/zodValidateData')['default']
}