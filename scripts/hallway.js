'use strict'

const reChannel = /(\s|^)\/([a-zA-Z0-9]+)/g
const reUser = /((\s|^)@&lt;[a-zA-Z0-9./:\-_+~#= ]*&gt;)/g
const reTag = /(^|\s)(#[a-z\d-]+)/ig
const reProject = /(^|\s)(~[a-z\d-]+)/ig
const reUrl = /((https?):\/\/(?!\S+(?:png|gif|jpe?g|mp3|ogg|wav))(([-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b)([-a-zA-Z0-9@:%_+.~#?&//=]*)))/g
const reImg = /(https?:\/\/\S+(\.png|\.jpg|\.gif))/g
const reAudio = /(https?:\/\/\S+(\.mp3|\.ogg|\.wav))/g
const reMood = /(^|\s)(:([++]|[+]|[=]|[-]|[--])+)/ig

function Hallway (sites) {
  const feeds = {}
  this.sites = sites
  this._el = document.createElement('div')
  this._el.id = 'hallway'
  const filterAndPage = window.location.hash.split('^')
  this.finder = { filter: stripHash(filterAndPage[0]), page: filterAndPage[1] || 1 }
  this.cache = null

  this._menu = document.createElement('menu')
  this._menu.id = 'menu'
  this._main = document.createElement('main')
  this._main.id = 'entries'
  this._footer = document.createElement('footer')
  this._footer.id = 'footer'
  this.webring = '<a href="http://webring.xxiivv.com/#random"><div id="webring"></div></a>'
  this.readme = '<p><strong>Shards</strong> is an experimental modification of <a href="https://webring.xxiivv.com/hallway.html">the Hallway</a> meant to be used as a personal microblog.</p>'
  this.nav = '<p class="buttons"><a href="https://shards.lectronice.com/shards/shards.txt">twtxt feed</a> | <a rel="me" href="https://merveilles.town/@ice">Mastodon</a> | <a href="https://lectronice.itch.io">Itch</a> | <a href="https://en.wikipedia.org/wiki/Criticism_of_Facebook">Facebook</a></p>'
  this.toTop ='<div id="totop" onClick="window.scrollTo({ top: 0, behavior: "smooth" })"></div>'
  this._footer.innerHTML = `${this.webring}${this.readme}${this.nav}${this.toTop}`

  this.install = function (host) {
    this._el.appendChild(this._menu)
    this._el.appendChild(this._main)
    this._el.appendChild(this._footer)
    host.appendChild(this._el)
    this.findFeeds()
  }

  this.start = function () {
    this._main.innerHTML = 'Loading...'
    this.fetchFeeds()
  }

  this.refresh = function (feeds = this.cache) {
    const entries = this.findEntries(feeds)
    const localEntries = entries.filter(entry => this.filterExternals(entry))
    const channels = this.find(localEntries, 'channel')
    const users = this.find(localEntries, 'author')
    const years = this.find(localEntries, 'dateYear')
    const months = this.find(localEntries, 'dateMonth')
    const days = this.find(localEntries, 'dateDay')
    const tags = this.findTags(localEntries)
    const projects = this.findProjects(localEntries)
    const moods = this.findMoods(localEntries)
    const relevantEntries = localEntries.filter(val => !this.finder.filter || (val.author === this.finder.filter || val.channel === this.finder.filter ||
      val.dateYear === this.finder.filter || val.dateMonth === this.finder.filter || val.dateDay === this.finder.filter || val.tags.includes(this.finder.filter) ||
      val.projects.includes(this.finder.filter) || val.moods.includes(this.finder.filter)))

    const mainHtml = `
    <div id='list'>
      <nav>
        <div><a href="../" id="homebtn" class="navbtn">Shards</a> <a href="info.html" id="infobtn" class="navbtn">Info</a></div>
      </nav>
      <ul>
        ${localEntries.filter((val) => !this.finder.filter || (val.author === this.finder.filter || val.channel === this.finder.filter || val.dateYear === this.finder.filter || val.tags.includes(this.finder.filter) || val.projects.includes(this.finder.filter) || val.moods.includes(this.finder.filter))).filter((_, id) => id < Number(this.finder.page) * 20 && id >= (Number(this.finder.page) - 1) * 20).reduce((acc, val) => acc + this.templateEntry(val) + '\n', '')}
      </ul>
      <div id='pagination' class='bottom'>
        ${[...Array(Math.ceil(relevantEntries.length / 20)).keys()].reduce((acc, num) => `${acc}<span class='${Number(hallway.finder.page) === num + 1 ? 'selected' : ''}' onclick='filter("${this.finder.filter}^${num + 1}"); window.scroll(0,0)'>${num + 1}</span>`, '')}
      </div>
    </div>`

    const aside = `
    <aside id='aside' class='aside'>
      <ul id='channels'>
        <li onclick='filter("")' class='${hallway.finder.filter === '' ? 'selected' : ''}' id='home'><a href='#'>Shards <span class='right'>${localEntries.length}</span></a></li>
        ${Object.keys(channels).slice(0, 10).reduce((acc, val) => acc + `<li onclick='filter("${val}")' class='${hallway.finder.filter === val ? 'selected' : ''}'><a href='#${val}'>${val} <span class='right' title='${Math.floor((channels[val] / localEntries.length * 100) * 100) / 100}% of all shards'>${channels[val]}</span></a></li>\n`, '')}
      </ul>
      <ul id='projects'>
        ${Object.keys(projects).slice(0, 10).reduce((acc, val) => acc + `<li onclick='filter("${val}")' class='${hallway.finder.filter === val ? 'selected' : ''}'><a href='#${val}'>~${val} <span class='right' title='${Math.floor((projects[val] / localEntries.length * 100) * 100) / 100}% of all shards'>${projects[val]}</span></li>\n`, '')}
      </ul>
      <ul id='tags'>
        ${Object.keys(tags).slice(0, 10).reduce((acc, val) => acc + `<li onclick='filter("${val}")' class='${hallway.finder.filter === val ? 'selected' : ''}'><a href='#${val}'>#${val} <span class='right' title='${Math.floor((tags[val] / localEntries.length * 100) * 100) / 100}% of all shards'>${tags[val]}</span></li>\n`, '')}
      </ul>
      <ul id='moods'>
        ${Object.keys(moods).slice(0, 10).reduce((acc, val) => acc + `<li onclick='filter("${val}")' class='${hallway.finder.filter === val ? 'selected' : ''}'><a href='#${val}'><span class='mood-icon'>Mood [${val}]</span> <span class='right' title='${Math.floor((moods[val] / localEntries.length * 100) * 100) / 100}% of all shards'>${moods[val]}</span></li>\n`, '')}
      </ul>
      <ul id='years'>
        ${Object.keys(years).reverse().slice(0, 10).reduce((acc, val) => acc + `<li onclick='filter("${val}")' class='${hallway.finder.filter === val ? 'selected' : ''}'><a href='#${val}'>${val} <span class='right' title='${Math.floor((years[val] / localEntries.length * 100) * 100) / 100}% of all shards'>${years[val]}</span></li>\n`, '')}
      </ul>
    </aside>`

    this._menu.innerHTML = `${aside}`

    this._main.innerHTML = `${mainHtml}`

    if (feeds) {
      this.cache = feeds
    }
  }

  // Entries

  this.filterExternals = function (entry) {
    const matches = entry.body.match(reUser)
    const locals = Object.keys(feeds)
    return matches ? matches.some(match => locals.some(local => match.indexOf(feeds[local].path) !== -1)) : true
  }

  this.find = function (entries, key) {
    const h = {}
    for (const entry of entries) {
      if (entry && entry[key]) {
        h[entry[key]] = h[entry[key]] ? h[entry[key]] + 1 : 1
      }
    }
    return h
  }

  this.findTags = function (entries) {
    const tags = {}
    for (const entry of entries) {
      entry.tags.map(tag => {
        tags[tag] = tags[tag] ? tags[tag] + 1 : 1
      })
    }
    return tags
  }

  this.findProjects = function (entries) {
    const projects = {}
    for (const entry of entries) {
      entry.projects.map(project => {
        projects[project] = projects[project] ? projects[project] + 1 : 1
      })
    }
    return projects
  }

  this.findMoods = function (entries) {
    const moods = {}
    for (const entry of entries) {
      entry.moods.map(mood => {
        moods[mood] = moods[mood] ? moods[mood] + 1 : 1
      })
    }
    return moods
  }

  this.findEntries = function (feeds) {
    const a = []
    for (const id in feeds) {
      for (const i in feeds[id].content) {
        a.push(feeds[id].content[i])
      }
    }
    return a.sort((a, b) => a.offset - b.offset)
  }

  this.findMention = function (found) {
    const mention = Object.keys(feeds).filter(user => found.indexOf(feeds[user].path) > -1)
    return ` <span class='user local'>${mention[0]}</span>`
  }


  this.templateEntry = function (entry) {
    entry.html = entry.body
      .replace(reChannel, '')
      .replace(reUser, this.findMention)
      .replace(reTag, '$1<span class="tag">$2</span>')
      .replace(reProject, '')
      .replace(reMood, '')
      .replace(reAudio, '<audio controls id="controls"><source src="$1" type="audio/mpeg"><source src="$1" type="audio/ogg">Your browser sucks. It doesn\'t support HTML5 audio tags</audio>')
      .replace(reImg, '<div class="image"><a href="#$1"><img src="$1" class="thumbnail"/></a><a href="#" class="lightbox" id="$1"><img src="$1" /></a></div>')
      .replace(reUrl, '<a class="link" target="_blank" href="$1"></a>')

    const filter = window.location.hash.substr(1).replace(/\+/g, ' ').toLowerCase()
    const highlight = filter === entry.author
    const origin = feeds[entry.author].path
    let titlePrefix = ''
    let moodPrefix = ''
    let moodIcon = ''

    if (entry.projects.length > 0) {titlePrefix = '~'}

    if (entry.moods.length > 0) {moodPrefix = ':'}
    if (entry.moods[0] == '++') {moodIcon = '<span id="up" title="Mood ++"></span>'}
    if (entry.moods[0] == '+') {moodIcon = '<span id="up" title="Mood +"></span>'}
    if (entry.moods[0] == '=') {moodIcon = '<span id="equal" title="Mood ="></span>'}
    if (entry.moods[0] == '-') {moodIcon = '<span id="down" title="Mood -"></span>'}
    if (entry.moods[0] == '--') {moodIcon = '<span id="down" title="Mood --"></span>'}

    return `<li class='entry ${highlight ? 'highlight' : ''}'><span class='title'>/${entry.channel} ${titlePrefix}${entry.projects}</span><span class='date'>${entry.date}::${timeAgo(Date.parse(entry.date))}</span> <a class='author' href='${origin}' target='_blank'>${entry.author}</a> <span class='mood'>${moodIcon}</span> <span class='body'>${entry.html}</span></li>`

  }

  // Feeds

  this.findFeeds = function () {
    console.log('Finding feeds..')
    for (const site of sites) {
      if (site.feed && site.author) {
        feeds[site.author] = { path: site.feed }
      }
    }
    console.log(`Found ${Object.keys(feeds).length} feeds.`)
  }

  this.fetchFeeds = function () {
    console.log(`Fetching ${Object.keys(feeds).length} feeds..`)
    for (const id in feeds) {
      this.fetchFeed(id, feeds[id])
    }
  }

  this.fetchFeed = function (id, feed) {
    console.log(`Fetching ${id}(${feed.path})..`)
    fetch(feed.path, { cache: 'no-store' }).then(x => x.text()).then((content) => {
      feeds[id].content = parseFeed(id, content)
      this.refresh(feeds)
    }).catch((err) => {
      console.warn(`${id}`, err)
    })
  }

  // Utils

  function parseFeed (author, feed) {
    const lines = feed.split('\n').filter((line) => line.substr(0, 1) !== '#')
    const entries = []
    for (const id in lines) {
      const line = lines[id].trim()
      if (line === '') { continue }
      const parts = line.replace('  ', '\t').split('\t')
      const date = parts[0].trim()
      const dateYear = date.substring(0,4)
      const dateMonth = date.substring(5,7)
      const dateDay = date.substring(8,10)
      const body = escapeHtml(parts[1].trim()).trim()
      const channel = body.substr(0, 1) === '/' ? body.split(' ')[0].substr(1) : body.substr(0, 1) === '@' ? 'Veranda' : 'Random'
      const tags = (body.match(reTag) || []).map(a => a.substr(a.indexOf('#') + 1))
      const projects = (body.match(reProject) || []).map(a => a.substr(a.indexOf('~') + 1))
      const moods = (body.match(reMood) || ['=']).map(a => a.substr(a.indexOf(':') + 1))
      const offset = new Date() - new Date(date)
      entries.push({ date, dateYear, dateMonth, dateDay, body, author, offset, channel, tags, projects, moods })
    }
    return entries
  }

  function timeAgo (dateParam) {
    const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam)
    const today = new Date()
    const yesterday = new Date(today - 86400000)
    const seconds = Math.round((today - date) / 1000)
    const minutes = Math.round(seconds / 60)
    const isToday = today.toDateString() === date.toDateString()
    const isYesterday = yesterday.toDateString() === date.toDateString()
    const monthWeeks = Math.floor(minutes / 10080) - Math.floor(minutes / 43920) * 4
    const yearMonths = Math.floor(minutes / 43920) - Math.floor(minutes / 525949) * 12
    let showWeeks = monthWeeks + 'wk'
    let showMonths = yearMonths + 'mo'

    if (seconds < 5) {
      return 'now'
    } else if (seconds < 60) {
      return `${seconds}s`
    } else if (seconds < 90) {
      return '1min'
    } else if (minutes < 60) {
      return `${minutes}min`
    } else if (isToday) {
        if (minutes < 120) {
          return `2h` // less than
        }
          else {return `${Math.floor(minutes / 60)}h`
        }
    } else if (isYesterday) {
      return 'yd'
    } else if (minutes < 2880) {
          return `2d` // less than
    } else if (minutes < 20160) {
      return `${Math.floor(minutes / 1440)}d`
    } else if (minutes <  43920) {
      if (Math.floor(minutes / 10080) < 4) {
        return `${Math.floor(minutes / 10080)}wk`
      } else {
        return `1mo`
      }
    } else if (minutes < 525949) {
    	if (monthWeeks < 1) {showWeeks = ''}
    	return `${Math.floor(minutes / 43920)}mo${showWeeks}`
    }
    if (yearMonths < 1) {showMonths = ''}
    return `${Math.floor(minutes / 525949)}y${showMonths}`
  }
}

function toggleVisibility (id) {
  const e = document.getElementById(id)
  if (e.style.display === 'block') { e.style.display = 'none' } else { e.style.display = 'block' }
}

function escapeHtml (unsafe) {
  return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function stripHash (hash) {
  const decoded = decodeURIComponent(hash)
  return decoded.charAt(0) === '#' ? decoded.substring(1) : decoded
}

function filter (name) {
  window.location.hash = name
  const filterAndPage = window.location.hash.split('^')
  hallway.finder = { filter: stripHash(filterAndPage[0]), page: filterAndPage[1] || 1 }
  hallway.refresh()
}

function toggleToTop() {
    if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
    document.getElementById("totop").style.display = "block";
  } else {
    document.getElementById("totop").style.display = "none";
  }
}

window.onload = function() {
  toggleToTop();
};
window.addEventListener('resize', function(event){
  toggleToTop()
});
