/* global describe, test, it, expect */

const { app, html } = require("../hx")

function fireDOMLoaded() {
  const event = document.createEvent("Event")
  event.initEvent("DOMContentLoaded", true, true)
  window.document.dispatchEvent(event)
}

function firePopState() {
  const event = document.createEvent("Event")
  event.initEvent("popstate", true, true)
  window.document.dispatchEvent(event)
}

describe("App", () => {

  test("boots with no bugs", () => {
    app({ model: {}, view: () => (html`<div>Hi</div>`) })
  })

  test("renders a model", () => {
    const model = {
      world: "world"
    }

    const view = (model) => html`<div id="test-me">${model.world}</div>`

    app({ model, view })

    expect(document.getElementById("test-me").innerHTML).toEqual(model.world)
  })

  test("renders a model with a loop", () => {
    const model = {
      loop: [
        "string1",
        "string2"
      ]
    }

    const view = model =>
      html`<div>${model.loop.map(value => html`<p>${value}</p>`)}</div>`

    app({ model, view })

    expect(document.getElementsByTagName("p").length).toEqual(model.loop.length)
  })

  test("renders svg", () => {
    const model = {
      text: "zelda"
    }

    const view = model =>
      html`<svg><text>${model.text}</text></svg>`

    app({ model, view })

    expect(document.getElementsByTagName("svg").length).toEqual(1)
    expect(document.getElementsByTagName("svg")[0].namespaceURI).toEqual("http://www.w3.org/2000/svg")
    expect(document.getElementsByTagName("text")[0].innerHTML).toEqual(model.text)
  })
})

describe("Subscriptions", () => {

  it("fires all subscriptions when DOM is ready", () => {
    const check = {}

    app({
      view: () => html`<div>View</div>`,
      subs: [
        () => { check["one"] = true },
        () => { check["two"] = true }
      ]
    })

    fireDOMLoaded()

    expect(check["one"]).toBe(true)
    expect(check["two"]).toBe(true)
  })
})

describe("Hooks", () => {
  const model = 0

  const view = (model) => html`<div>${model}</div>`

  const update = { add: (model, data) => model + data }

  const subs = [(_, msg) => msg.add(2)]

  it("fires onUpdate when the model is updated", () => {
    const guard = null

    const hooks = {
      onUpdate: (prev, model) => { guard = { prev, model } }
    }

    app({ model, view, update, subs, hooks })

    fireDOMLoaded()

    expect(guard).toEqual({ model: 2, prev: 0 })
  })

  it("fires onAction when a reducer is dispatched", () => {
    const guard = null

    const hooks = {
      onAction: (name, data) => { guard = { name, data } }
    }

    app({ model, view, update, subs, hooks })

    fireDOMLoaded()

    expect(guard).toEqual({ name: "add", data: 2 })
  })

  it("fires onAction when an effect is dispatched", () => {
    const guard = null

    const effectDone = false

    const hooks = {
      onAction: (name, data) => { guard = { name, data } }
    }

    const effects = {
      add: () => { effectDone = true }
    }

    app({ model, view, effects, subs, hooks })

    fireDOMLoaded()

    expect(effectDone).toBe(true)
    expect(guard).toEqual({ name: "add", data: 2 })
  })

  it("fires onError when a effect fails", () => {
    const guard = null

    const hooks = {
      onError: (err) => { guard = err }
    }

    const effects = {
      add: (model, msg, data, error) => { error("effect error") }
    }

    app({ model, view, effects, subs, hooks })

    fireDOMLoaded()

    expect(guard).toEqual("effect error")
  })
  
})

describe("Lifecycle events", () => {
  const model = {}

  const update = { add: (model, data) => model + data }

  const subs = [(_, msg) => msg.add(2)]

  test("accepts oncreate property", done => {
    const target = null

    const handleCreate = (e) => { target = e }

    app({
      model: {},
      view: () => (html`<div oncreate=${handleCreate}>Hi</div>`)
    })

    setTimeout(() => {
      expect(target).not.toEqual(null)
      done()
    }, 1)
  })

  // FIXME: currently it fails... is it a bug?
  // TODO: need help on this
  it.skip("fires onupdate when view changed", done => {
    const guard = null

    const handleUpdate = (e) => { guard = e }

    const view = (model) => html`<div onupdate=${handleUpdate}>${model}</div>`

    app({ model, update, subs, view })

    fireDOMLoaded()

    setTimeout(() => {
      expect(guard).not.toEqual(null)
      done()
    }, 1)

  })

})

describe("Routing", () => {

  it("handles the / route", () => {

    const view = {
      "/": () => html`<div id="root">root path</div>`
    }

    app({ view })

    expect(document.getElementById("root").innerHTML).toEqual('root path')
  })

  // FIXME: it throws an exception
  it.skip("handles * route", () => {
    const view = {
      "*": () => html`<div id="root">any path</div>`
    }

    app({ view })

    expect(document.getElementById("root").innerHTML).toEqual('any path')
  })

  // FIXME: how to change the location
  it.skip("handles route params", () => {

    const view = {
      "/": () => html`<div id="root">root path</div>`,
      ":a/:b/:c": () => html`<div id="root">params</div>`
    }

    app({ view })

    window.history.pushState({}, 'one', 'about:one/two/three')

    firePopState()

    expect(document.getElementById("root").innerHTML).toEqual('params')
  })

})
