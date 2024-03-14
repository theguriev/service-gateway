import { setResponseHeader, setResponseStatus, send } from 'h3'
import type { H3Event } from 'h3'
import type { NitroErrorHandler } from 'nitropack'

export function defineNitroErrorHandler (
  handler: NitroErrorHandler
): NitroErrorHandler {
  return handler
}

const isDev = process.env.NODE_ENV === 'development'

interface ParsedError {
  url: string;
  statusCode: number;
  statusMessage: number;
  message: string;
  stack?: string[];
}

const renderHTMLError = (error: ParsedError): string => {
  const statusCode = error.statusCode || 500
  const statusMessage = error.statusMessage || 'Request Error'
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${statusCode} ${statusMessage}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico/css/pico.min.css">
    </head>
    <body>
      <main class="container">
        <dialog open>
          <article>
            <header>
              <h2>${statusCode} ${statusMessage}</h2>
            </header>
            <code>
              ${error.message}<br><br>
              ${
                '\n' +
                (error.stack || []).map(i => `&nbsp;&nbsp;${i}`).join('<br>')
              }
            </code>
            <footer>
              <a href="/" onclick="event.preventDefault();history.back();">Go Back</a>
            </footer>
          </article>
        </dialog>
      </main>
    </body>
  </html>
  `
}

export function hasReqHeader (event: H3Event, name: string, includes: string) {
  const value = getRequestHeader(event, name)
  return (
    value && typeof value === 'string' && value.toLowerCase().includes(includes)
  )
}

export function isJsonRequest (event: H3Event) {
  // If the client specifically requests HTML, then avoid classifying as JSON.
  if (hasReqHeader(event, 'accept', 'text/html')) {
    return false
  }
  return (
    hasReqHeader(event, 'accept', 'application/json') ||
      hasReqHeader(event, 'user-agent', 'curl/') ||
      hasReqHeader(event, 'user-agent', 'httpie/') ||
      hasReqHeader(event, 'sec-fetch-mode', 'cors') ||
      event.path.startsWith('/api/') ||
      event.path.endsWith('.json')
  )
}

export function normalizeError (error: any) {
  // temp fix for https://github.com/unjs/nitro/issues/759
  // TODO: investigate vercel-edge not using unenv pollyfill
  const cwd = typeof process.cwd === 'function' ? process.cwd() : '/'
  const stack = ((error.stack as string) || '')
    .split('\n')
    .splice(1)
    .filter(line => line.includes('at '))
    .map((line) => {
      const text = line
        .replace(cwd + '/', './')
        .replace('webpack:/', '')
        .replace('file://', '')
        .trim()
      return {
        text,
        internal:
            (line.includes('node_modules') && !line.includes('.cache')) ||
            line.includes('internal') ||
            line.includes('new Promise')
      }
    })

  const statusCode = error.statusCode || 500
  const statusMessage =
      error.statusMessage ?? (statusCode === 404 ? 'Not Found' : '')
  const message = error.message || error.toString()

  return {
    stack,
    statusCode,
    statusMessage,
    message
  }
}

export default defineNitroErrorHandler((error, event) => {
  const { stack, statusCode, statusMessage, message } = normalizeError(error)

  const showDetails = isDev && statusCode !== 404

  const errorObject = {
    url: event.path || '',
    statusCode,
    statusMessage,
    message,
    data: error?.data,
    stack: showDetails ? stack.map(i => i.text) : undefined
  }

  // Console output
  if (error.unhandled || error.fatal) {
    const tags = [
      '[nitro]',
      '[request error]',
      error.unhandled && '[unhandled]',
      error.fatal && '[fatal]'
    ]
      .filter(Boolean)
      .join(' ')
    console.error(
      tags,
      error.message + '\n' + stack.map(l => '  ' + l.text).join('  \n')
    )
  }

  setResponseStatus(event, statusCode, statusMessage)

  if (isJsonRequest(event)) {
    setResponseHeader(event, 'Content-Type', 'application/json')
    return send(event, JSON.stringify(errorObject))
  } else {
    setResponseHeader(event, 'Content-Type', 'text/html')
    return send(event, renderHTMLError(errorObject))
  }
}
)
