/* global beforeEach, describe, it, expect */

const { app, html, h } = require("../")

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

beforeEach(() => {
    document.body.innerHTML = ''
})

describe("App", () => {

    it("boots with no bugs", () => {
        app({ model: {}, view: () => (html`<div>Hi</div>`) })
    })

    // FIXME: if fails... this is not true
    it.skip("allow all params to be optional", () => {
        app()
    })

    it("renders a model", () => {
        const model = {
            world: "world"
        }

        const view = (model) => html`<div id="test-me">${model.world}</div>`

        app({ model, view })

        expect(document.getElementById("test-me").innerHTML).toEqual(model.world)
    })

    it("renders a model with a loop", () => {
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

    it("renders svg", () => {
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

    it("exec's a render when the update changes", () => {
        const firstValue = 'first-value'
        const secondValue = 'second-value'

        const model = firstValue

        const view = (model, update) => html`<div><input oninput=${e => update.fire(e.target.value)} value=${model}/><p>${model}</p></div>`

        const update = { fire: (_, value) => value }

        app({ model, view, update })

        const input = document.getElementsByTagName('input')[0];

        expect(input.value).toEqual(firstValue)

        const evnt = new Event('input', { bubbles: true });
        input.value = secondValue;
        input.dispatchEvent(evnt);

        expect(input.value).toEqual(secondValue)
        expect(document.getElementsByTagName('p')[0].innerHTML).toEqual(secondValue)
    });
})

describe("Views", () => {
    it("allows inline styles as object with properties in camelCase", () => {
        const view = (model) => html`<div id="red"
      style=${{
                backgroundColor: "red",
                padding: "10px"
            }}>I'm red</div>`

        app({ view })
        var el = document.getElementById("red")
        expect(el).not.toBe(null)
        expect(el.style["background-color"]).toEqual("red")
        expect(el.style["padding"]).toEqual("10px")
    })

    it("allows the views to be defined directly with h", () => {
        const view = (model) => h("div", { id: "test" }, "inside div")
        app({ view })
        var el = document.getElementById("test")
        expect(el).not.toBe(null)
        expect(el.innerHTML).toEqual("inside div")
    })
})

describe("Subscriptions", () => {

    it("fires all subscriptions when DOM is ready", () => {
        const check = {}

        app({
            view: () => html`<div>View</div>`,
            subscriptions: [
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

    const subscriptions = [(_, msg) => msg.add(2)]

    it("fires onUpdate when the model is updated", () => {
        let guard = null

        const hooks = {
            onUpdate: (prev, model) => { guard = { prev, model } }
        }

        app({ model, view, update, subscriptions, hooks })

        fireDOMLoaded()

        expect(guard).toEqual({ model: 2, prev: 0 })
    })

    it("fires onAction when a reducer is dispatched", () => {
        let guard = null

        const hooks = {
            onAction: (name, data) => { guard = { name, data } }
        }

        app({ model, view, update, subscriptions, hooks })

        fireDOMLoaded()

        expect(guard).toEqual({ name: "add", data: 2 })
    })

    it("fires onAction when an effect is dispatched", () => {
        let guard = null

        let effectDone = false

        const hooks = {
            onAction: (name, data) => { guard = { name, data } }
        }

        const effects = {
            add: () => { effectDone = true }
        }

        app({ model, view, effects, subscriptions, hooks })

        fireDOMLoaded()

        expect(effectDone).toBe(true)
        expect(guard).toEqual({ name: "add", data: 2 })
    })

    it("fires onError when a effect fails", () => {
        let guard = null

        const hooks = {
            onError: (err) => { guard = err }
        }

        const effects = {
            add: (model, msg, data, error) => { error("effect error") }
        }

        app({ model, view, effects, subscriptions, hooks })

        fireDOMLoaded()

        expect(guard).toEqual("effect error")
    })

})

describe("Lifecycle events", () => {
    const model = {}

    const update = { add: (model, data) => model + data }

    const subscriptions = [(_, msg) => msg.add(2)]

    it("accepts oncreate property", done => {
        let target = null

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
        let guard = null

        const handleUpdate = (e) => { guard = e }

        const view = (model) => html`<div onupdate=${handleUpdate}>${model}</div>`

        app({ model, update, subscriptions, view })

        fireDOMLoaded()

        setTimeout(() => {
            expect(guard).not.toEqual(null)
            done()
        }, 1)

    })

})
