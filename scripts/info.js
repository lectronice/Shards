'use strict'

// Please note this file is a quick and dirty hack to diplay mostly innacurate statistics about the microblog content.
// Projects are hard coded, and this file could probably (and should) be merged with the main hallway.js
// Externalizing projects descriptions, maybe in an indental file, or with special tags in the shards file, would be much cleaner.

const reChannel = /(\s|^)\/([a-zA-Z0-9]+)/g
const reUser = /((\s|^)@&lt;[a-zA-Z0-9./:\-_+~#= ]*&gt;)/g
const reTag = /(^|\s)(#[a-z\d-]+)/ig
const reProject = /(^|\s)(~[a-z\d-]+)/ig
const reUrl = /((https?):\/\/(?!\S+(?:png|gif|jpe?g))(([-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b)([-a-zA-Z0-9@:%_+.~#?&//=]*)))/g
const reImg = /(https?:\/\/\S+(\.png|\.jpg|\.gif))/g
const reMood = /(^|\s)(:([++]|[+]|[=]|[-]|[--])+)/ig

const p1name = 'Shards'
const p1desc = '<strong>Shards</strong> is the bunch of dirty hacks holding this website together. While I never managed to maintain a blog nor use a time ' +
'tracker consistently, this unexpected hybrid experiment born from <a href="https://webring.xxiivv.com/hallway.html">the Hallway</a> suits my needs pretty ' +
'well so far.'

const p2name = 'ForlornTree'
const p2desc = '<strong>Under This Forlorn Tree</strong> is a post-cyberpunk CRPG made with <a href="http://rpginabox.com">RPG in a Box</a>, set in a ' +
'universe I\'ve been working on for more than two decades. The only successful attempt at bringing it to life so far is through music, with the ' +
'<a href="http://europeaftertherain.com/category/albums">Streams of Europe</a> project.'

const p3name = 'Melodics'
const p3desc = '<strong>Melodics</strong> is a <a href="https://melodics.com">music training software</a> I use daily to improve my rhythmic skills. The ' +
'process has been very rewarding, as I\'m finally able to enjoy playing and learning a physical instrument after years of using only DAWs.'

const p4name = 'JardinsdAcier'
const p4desc = '<strong>Jardins d\'Acier</strong> is an ambient/drone project involving live steel tongue drums and audio manipulation. I\'m still ' +
'defining its aesthetics, but I plan to self-publish albums and to compose Under This Forlorn Tree\'s soundtrack with what I\'ll learn.'

const p5name = 'Opuscule'
const p5desc = '<strong>Opuscule</strong> is a minimalist writing and note-taking application I\'m developing with the Godot engine. It can output HTML ' +
'documents and be used as a personal wiki or a static website generator. <a href="https://opuscule.lectronice.com">Get it here</a>.'

const p6name = 'Zotialith'
const p6desc = '<strong>Zotialith Aggregate</strong> is a microfiction experiment based on playing Stellaris. The idea is to write regular reports about ' +
'the progress of the game, while using polls and community feedback to decide how the empire is managed. ' +
'<a href="https://merveilles.town/@ice/103226902642303710">Mastodon thread</a>.'

function Info (sites) {
  const feeds = {}
  this.sites = sites
  this._el = document.createElement('div')
  this._el.id = 'info'
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
  this.toTop ='<a href="#list"><div id="totop"></div></a>'
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
      <div id='projects'>
        <p>Projects <span class ="number">${Object.keys(projects).length}::${Object.keys(projects).reduce((acc, val) => acc + projects[val], 0)}</span></p>
        <ul>
          ${Object.keys(projects).reduce((acc, val) => acc + `<li onclick='filter("${val}") class='${info.finder.filter === '' ? 'selected' : ''}'><a href='../#${val}'>~${val}
            <span class='total'>${projects[val]}</span>
            <span class='percent'>${Math.floor((projects[val] / (Object.keys(projects).reduce((acc, val) => acc + projects[val], 0)) * 100) * 100) / 100}% projects :: ${Math.floor((projects[val] / localEntries.length * 100) * 100) / 100}% shards</span>
            <div id='progress'><div id='bar' style='width: ${Math.floor((projects[val] / localEntries.length * 100) * 100) / 100}%'></div></div>
            </a></li>
            ${val === p1name ? "<div class='desc'>" + p1desc + "</div>" :
              val === p2name ? "<div class='desc'>" + p2desc + "</div>" :
              val === p3name ? "<div class='desc'>" + p3desc + "</div>" :
              val === p4name ? "<div class='desc'>" + p4desc + "</div>" :
              val === p5name ? "<div class='desc'>" + p5desc + "</div>" :
              val === p6name ? "<div class='desc'>" + p6desc + "</div>" :
              ''}\n`, '')}
        </ul>
      </div>
      <div id='channels'>
        <p>Channels <span class="number">${Object.keys(channels).length}::${Object.keys(channels).reduce((acc, val) => acc + channels[val], 0)}</span></p>
        <ul>
          ${Object.keys(channels).reduce((acc, val) => acc + `<li onclick='filter("${val}") class='${info.finder.filter === '' ? 'selected' : ''}'><a href='../#${val}'>/${val}
            <span class='total'>${channels[val]}</span>
            <span class='percent'>${Math.floor((channels[val] / localEntries.length * 100) * 100) / 100}%</span>
            <div id='progress'><div id='bar' style='width: ${Math.floor((channels[val] / localEntries.length * 100) * 100) / 100}%'></div></div>
            </a></li>\n`, '')}
        </ul>
      </div>
      <div id='tags'>
        <p>Tags <span class="number">${Object.keys(tags).length}::${Object.keys(tags).reduce((acc, val) => acc + tags[val], 0)}</span></p>
        <ul>
          ${Object.keys(tags).reduce((acc, val) => acc + `<li onclick='filter("${val}") class='${info.finder.filter === '' ? 'selected' : ''}'><a href='../#${val}'>#${val}
            <span class='total'>${tags[val]}</span>
            <span class='percent'>${Math.floor((tags[val] / localEntries.length * 100) * 100) / 100}%</span>
            <div id='progress'><div id='bar' style='width: ${Math.floor((tags[val] / localEntries.length * 100) * 100) / 100}%'></div></div>
            </a></li>\n`, '')}
        </ul>
      </div>
      <div id='moods'>
        <p>Moods <span class ="number">${Object.keys(moods).length}</span></p>
        <ul>
          ${Object.keys(moods).reduce((acc, val) => acc + `<li onclick='filter("${val}") class='${info.finder.filter === '' ? 'selected' : ''}'><a href='../#${val}'><span class='mood-icon'>Mood [${val}]</span>
            <span class='total'>${moods[val]}</span>
            <span class='percent'>${Math.floor((moods[val] / localEntries.length * 100) * 100) / 100}%</span>
            <div id='progress'><div id='bar' style='width: ${Math.floor((moods[val] / localEntries.length * 100) * 100) / 100}%'></div></div>
            </a></li>\n`, '')}
        </ul>
      </div>
      <div id='years'>
        <p>Years <span class ="number">${Object.keys(years).length}</span></p>
        <ul>
          ${Object.keys(years).reverse().reduce((acc, val) => acc + `<li onclick='filter("${val}") class='${info.finder.filter === '' ? 'selected' : ''}'><a href='../#${val}'>${val}
            <span class='total'>${years[val]}</span>
            <span class='percent'>${Math.floor((years[val] / localEntries.length * 100) * 100) / 100}%</span>
            <div id='progress'><div id='bar' style='width: ${Math.floor((years[val] / localEntries.length * 100) * 100) / 100}%'></div></div>
            </a></li>\n`, '')}
        </ul>
      </div>
    </div>
    `

    const aside = `
    <aside id='aside' class='aside'>
      <div id="sidecontent">
        <div id="logo"></div>
        <p>Hello.<br/><br/>
        This ever-changing website collects things <strong>lectronice</strong> does.<br/><br/>
        It\'s a microblog also meant to serve as a very inaccurate time tracker.<br/><br/>
        Maybe you'll find it useful for an overview of how creative processes look like, or to follow one project you\'re interested in.<br/><br/>
        Feel free to drop me a line on <a rel="me" href="https://merveilles.town/@ice">Mastodon</a> for any question or feedback.</p>
      </div>
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
      .replace(reImg, '<div class="image"><a href="#$1"><img src="$1" class="thumbnail"/></a><a href="#_" class="lightbox" id="$1"><img src="$1" /></a></div>')
      .replace(reUrl, '<a class="link" target="_blank" href="$1"></a>')

    const filter = window.location.hash.substr(1).replace(/\+/g, ' ').toLowerCase()
    const highlight = filter === entry.author
    const origin = feeds[entry.author].path
    let titlePrefix = ''
    let moodPrefix = ''
    let moodIcon = ''

    if (entry.projects.length > 0) {titlePrefix = '~'}

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
  info.finder = { filter: stripHash(filterAndPage[0]), page: filterAndPage[1] || 1 }
  info.refresh()
}

function openNav() {
  let w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  if (w < 630) {
    document.getElementById("aside").style.display = "block";
    document.getElementById("footer").style.marginLeft = "20.85em";
  } else {
    document.getElementById("footer").style.marginLeft = "20.85em";
  }
  document.getElementById("aside").style.opacity = "1";
  document.getElementById("aside").style.width = "19.5em";
  document.getElementById("closebtn").style.opacity = "1";
  document.getElementById("closebtn").style.cursor = "pointer";
  document.getElementById("openbtn").style.opacity = "0";
  document.getElementById("openbtn").style.cursor = "default";
  document.getElementById("list").style.marginLeft = "21em";

}

window.onload = function() {
  toggleToTop();
};
window.addEventListener('resize', function(event){
  toggleToTop()
});
