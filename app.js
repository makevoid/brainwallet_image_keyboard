"use strict";

const d = document

const bitcore  = require('bitcore-lib')
const Mnemonic = require('bitcore-mnemonic')

const ALL_WORDS = Mnemonic.Words.ENGLISH

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

const wordTag = (imageUrl, word) => {
  return `<div class="word" data-word="${word}">
    <img class="img" src="${imageUrl}">
    <h3 class="text">${word}</h3>
  </div>`
}

const genImagesHtml = (words) => {
  let images = ""
  _(words).each((word) => {
    let imageUrl = `/images/english/${word}.jpg`
    images = `
    ${images}
    ${wordTag(imageUrl, word)}`
  })
  return images
}

const renderWords = (element, words) => {
  // words = _(words).first(500)
  let imagesHTML = genImagesHtml(words)
  element.innerHTML = imagesHTML
}

const generateWords = () => {
  let code = new Mnemonic(ALL_WORDS);
  let codeStr = code.toString()
  return codeStr
}

const showWords = (words) => {
  let key = d.querySelector("#key")
  renderWords(key, words)
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
    showWords(words)
  }

  this.save = (x) => {
    store.privateKeyMnemonic = KEY
  }

  this.load = (x) => {
    KEY = store.privateKeyMnemonic
    let words = KEY.split(" ")
    showWords(words)
  }

  this.training = (x) => {
    c.log("TODO")
  }

  const linkClick = (evt) => {
    let fn = evt.target.dataset.fn.toString()
    c.log(`executing: ${fn}()`)
    this[fn]()
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
    let code = new Mnemonic(words.join(" "))
    return code.toHDPrivateKey()
  }

  const showPrivateKey = (words) => {
    let key = getPrivateKey(words)
    let elem = d.querySelector("#keyWIF")
    let keyString = key.privateKey.toWIF()
    let message = `PrivateKey:<br>${keyString}`
    elem.innerHTML = message
  }

  // TODO: training
  // d.querySelector("#input")
  // d.addEventListener("keyup", onKey)

  //

  const WORDS = []

  const wordAddDo = (word) => {
    if (WORDS.length < 12)
      WORDS.push(word)

    if (WORDS.length > 11)
      showPrivateKey(WORDS)

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

  let input = d.querySelector("#input")
  input.addEventListener("keydown", wordsAddOnEnter)

}, 0))
