export default function(tag, data) {
    data = data || {}

    var children = []
    children.push.apply(children, arguments)
    children.shift()
    children.shift()
    // var children = children.push.apply(children, arguments).splice(2)
    var head = children[0]

    children = Array.isArray(head) || head === undefined ? head : children

    if (typeof tag === "function") {
        return tag(data, children || [])
    }

    if (tag === "svg") {
        svg(tag, data, children)
    }

    return {
        tag: tag,
        data: data,
        children: [].concat.apply([], children)
    }
}

function svg(tag, data, children) {
    data.ns = "http://www.w3.org/2000/svg"

    for (var i = 0; i < children.length; i++) {
        var node = children[i]

        if (node.data) {
            svg(node.tag, node.data, node.children)
        }
    }
}
