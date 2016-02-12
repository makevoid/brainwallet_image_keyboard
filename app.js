"use strict";

const d = document


const bitcore  = require('bitcore-lib')
const Mnemonic = require('bitcore-mnemonic')

const ALL_WORDS = Mnemonic.Words.ENGLISH

let WORDS = []
let FILTERS = []

const get = (url) => {
  return new Promise((resolve, reject) => {
    // var xhrLoad = () => {
    //   resolve(this.responseText)
    // }
    var xhrLoad = function() {
      resolve(JSON.parse(this.responseText))
    }
    let oReq = new XMLHttpRequest()
    oReq.addEventListener("load", xhrLoad)
    oReq.open("GET", url)
    oReq.send()
  })
}

const loadWords = () => {
  // return get("/words/english.json")
  return new Promise((resolve, reject) =>
    resolve(ALL_WORDS)
  )
}

const COLORS = ["blue", "orange", "green", "pink", "purple", "brown", "yellow", "red", "black"]

const wordTag = (imageUrl, word, close) => {
  if (close)
    close = "<div class=\"close\">x</div>"
  else
    close = ""

  let colIdx = ALL_WORDS.indexOf(word)
  return `<div class="word" data-word="${word}">
    <img class="img col${colIdx % 9 + 1}" src="${imageUrl}">
    <h3 class="text">${word}</h3>
    ${close}
  </div>`
}

const genImagesHtml = (words, closeBtn) => {
  let images = ""
  _(words).each((word) => {
    let imageUrl = `/images/english/${word}.jpg`
    images = `
    ${images}
    ${wordTag(imageUrl, word, closeBtn)}`
  })
  return images
}

const renderWords = (element, words, closeBtn) => {
  // words = _(words).first(500)
  let imagesHTML = genImagesHtml(words, closeBtn)
  element.innerHTML = imagesHTML
}

const generateWords = () => {
  let code = new Mnemonic(ALL_WORDS);
  let codeStr = code.toString()
  return codeStr
}

const updateCounter = () => {
  d.querySelector("#counter #count").innerHTML = WORDS.length
}

const removeCurrentWord = (word) => {
  WORDS = _(WORDS).without(word)
  updateCounter()
}

const onKeyWordClick = (evt) => {
  let elem = evt.currentTarget.parentElement
  let word = elem.dataset.word
  removeCurrentWord(word)
  showWords(WORDS)
}

const showWords = (words) => {
  let key = d.querySelector("#key")
  let closeBtn = true
  renderWords(key, words, closeBtn)
  let wordElems = d.querySelectorAll("#key .word .close")
  _(wordElems).each((word) => {
    word.removeEventListener("click", onKeyWordClick)
    word.addEventListener("click",    onKeyWordClick)
  })
}

// main
(setTimeout(function(){
  const c = console
  const store = localStorage

  let KEY = generateWords()

  this.generate = (x) => {
    let words = generateWords()
    KEY = words
    words = words.split(" ")
    WORDS = words
    updateCounter()
    showWords(words)
  }

  this.save = (x) => {
    if (KEY.length > 11)
      store.privateKeyMnemonic = KEY
  }

  this.load = (x) => {
    KEY = store.privateKeyMnemonic
    WORDS = KEY.split(" ")
    showWords(WORDS)
  }

  this.training = (x) => {
    c.log("TODO")
  }

  this.changeColor = (color) => {
    let colorIdx = COLORS.indexOf(color)
    filterWordsByColor(colorIdx)
  }

  const filterWordsByColor = (colorIdx) => {
    let words = ALL_WORDS

    words = _(words).select((word, idx) => {
      return idx % 9 == colorIdx
    })

    words = applyWordsFilter(words)

    let wordsElem = d.querySelector("#brainwallet-words")
    renderWords(wordsElem, words)
  }

  const linkClick = (evt) => {
    let data = evt.target.dataset
    let fn = data.fn.toString()
    let arg = data.arg

    if (arg) {
      c.log(`executing: ${fn}(${arg})`)
      this[fn](arg)
    } else {
      c.log(`executing: ${fn}()`)
      this[fn]()
    }
  }

  const links = d.querySelectorAll("a")
  _(links).map(function(link){
    link.addEventListener("click", linkClick, false)
  })

  const element = d.querySelector("#brainwallet-words")

  loadWords()
    .then((words) => {
      renderWords(element, words)
      let event = new Event('words-loaded')
      window.dispatchEvent(event)
    })
    .catch((err) => {
      c.error(err)
    })

  const onKey = (evt) => {
    let input = d.querySelector("#input")
    c.log(input.value)
  }

  const getPrivateKey = (words) => {
    try {
      let code = new Mnemonic(words.join(" "))
      return code.toHDPrivateKey()
    } catch (e) {
      console.error("Error:", e)
      d.querySelector("#status").innerHTML = `Error: ${e.message}`
    }
  }

  const showPrivateKey = (words) => {
    let key = getPrivateKey(words)
    if (key) {
      let elem = d.querySelector("#keyWIF")
      let keyString = key.privateKey.toWIF()
      let message = `PrivateKey:<br>${keyString}`
      elem.innerHTML = message
    }
  }

  // TODO: training
  // d.querySelector("#input")
  // d.addEventListener("keyup", onKey)

  //


  const wordAddDo = (word) => {
    if (WORDS.length < 12) {
      d.querySelector("#keyWIF").innerHTML = ""
      WORDS.push(word)
    }

    if (WORDS.length > 11)
      showPrivateKey(WORDS)

    updateCounter()
    showWords(WORDS)
  }

  const wordClick = (evt) => {
    let elem = evt.currentTarget
    let word = elem.dataset.word

    wordAddDo(word)
  }

  const wordsAddClickListener = () => {
    const wordElems = d.querySelectorAll("#brainwallet-words .word")
    _(wordElems).map(function(wordElem){
      wordElem.addEventListener("click", wordClick, false)
    })
  }

  window.addEventListener("words-loaded", wordsAddClickListener, false)

  const addWordToInput = (word, elem) => {
    if (CURRENT_WORD)
      word = CURRENT_WORD

    if (_(ALL_WORDS).include(word)) {
      wordAddDo(word)
      elem.value = ""
    }
  }

  const wordsAddOnEnter = (evt) => {
    let enterPressed = evt.keyCode == 13
    if (enterPressed) {
      let elem = evt.target
      let word = elem.value
      addWordToInput(word, elem)
    }
  }

  let CURRENT_WORD = null

  const applyWordsFilter = (words) => {
    let input = d.querySelector("#input")

    let regex = new RegExp(`^${input.value}`)

    CURRENT_WORD = null

    words = _(words).select((word) => {
      return word.match(regex)
    })

    if (words.length == 1)
      CURRENT_WORD = words[0]

    return words
  }

  const wordsFilter = () => {
    let words = ALL_WORDS
    words = applyWordsFilter(words)

    let wordsElem = d.querySelector("#brainwallet-words")
    renderWords(wordsElem, words)
  }

  let input = d.querySelector("#input")
  input.addEventListener("keydown", wordsAddOnEnter)
  input.addEventListener("keyup", wordsFilter)

}, 0))
