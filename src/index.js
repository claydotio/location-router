import * as Rx from 'rxjs'
import qs from 'qs-lite'

const getCurrentUrl = function (mode) {
  const hash = window.location.hash.slice(1)
  let {
    pathname
  } = window.location
  const {
    search
  } = window.location
  if (pathname) {
    pathname += search
  }

  if (mode === 'pathname') {
    return pathname || hash
  } else { return hash || pathname }
}

const parseUrl = function (url) {
  const a = document.createElement('a')
  a.href = url

  return {
    pathname: a.pathname,
    hash: a.hash,
    search: a.search,
    path: a.pathname + a.search
  }
}

export default class Router {
  constructor () {
    this.getStream = this.getStream.bind(this)
    this._parse = this._parse.bind(this)
    this.go = this.go.bind(this)
    this.mode = window.history?.pushState ? 'pathname' : 'hash'
    this.hasRouted = false
    this.subject = new Rx.BehaviorSubject(this._parse())

    // some browsers erroneously call popstate on intial page load (iOS Safari)
    // We need to ignore that first event.
    // https://code.google.com/p/chromium/issues/detail?id=63040
    window.addEventListener('popstate', () => {
      if (this.hasRouted) {
        return setTimeout(() => {
          return this.subject.next(this._parse())
        })
      }
    })
  }

  getStream () { return this.subject }

  _parse (url) {
    if (url == null) { url = getCurrentUrl(this.mode) }
    const { pathname, search } = parseUrl(url)
    const query = qs.parse(search?.slice(1))

    const {
      hostname
    } = window.location

    return { url, path: pathname, query, hostname }
  }

  go (url) {
    const req = this._parse(url)

    if (this.mode === 'pathname') {
      window.history.pushState(null, null, req.url)
    } else {
      window.location.hash = req.url
    }

    this.hasRouted = true
    return this.subject.next(req)
  }
}
