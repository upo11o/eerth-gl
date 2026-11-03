type HTMLTag = keyof HTMLElementTagNameMap

type Attributes =
| Nullish
| { [key: string]: Record<string, string> | Function | Primitive | Nullish }
& { style?: Record<string, string> | string }

type Child = Element | Primitive | Nullish | Child[]

type Element<T extends HTMLTag | Nullish = undefined> =
  T extends HTMLTag ? HTMLElementTagNameMap[T] :
  T extends null    ? DocumentFragment :
                      HTMLElement
//

const is_nullish = (value: unknown): value is Nullish => (
  value === null || value === undefined
)
const primitive_types = [ "string", "number", "boolean" ]
const is_primitive = (value: unknown): value is Primitive => (
  primitive_types.includes(typeof value)
)
const is_function = (value: unknown): value is Function => (
  value instanceof Function
)


//////// FABRIC

export const h = <T extends HTMLTag | Nullish = null>(
  type?: T,
  attributes?: Attributes,
  ...children: Child[]
) => {
  const node = type ? document.createElement(type) : new DocumentFragment()
  traverse_attributes(node, attributes)
  traverse_children(node, children)
  return node as Element<T>
}


export const new_ui_pool = <T extends keyof HTMLElementTagNameMap>(
  tag: T,
  capacity: number,
  attributes?: Attributes,
) => {
  type Pool_Item = HTMLElementTagNameMap[T]
  const new_el = () => h(tag, attributes) as Pool_Item

  const list: Pool_Item[] = Array(capacity)
  for (let i = 0; i < capacity; i++) {
    list[i] = new_el()
  }

  return {
    get() {
      if (list.length === 0) {
        list.length = capacity
        for (let i = 0; i < capacity; i++) {
          list[i] = new_el()
        }
      }
      return list.pop()!
    },
    put(el: Pool_Item) {
      list.push(el)
    },
    clear() {
      list.length = 0
    },
  }
}


//////// TRAVERSE

const traverse_attributes = (node: HTMLElement | DocumentFragment, attributes?: Attributes) => {
  if (node instanceof DocumentFragment || !attributes) {
    return
  }

  for (const key in attributes) {
    const value = attributes[key]
    if (is_nullish(value)) {
      continue
    }
    else if (is_primitive(value)) {
      node.setAttribute(key, `${value}`)
    }
    else if (is_function(value)) {
      // @ts-ignore
      node[key] = value
    }
    else if (key === "style") {
      node.setAttribute(key, Object.entries(value).map(map_style_entries).join(";"))
    }
  }
}


const map_style_entries = (e: [key: string, value: string]) => e[0] + ":" + e[1]


const traverse_children = (
  node: HTMLElement | DocumentFragment,
  children: Child[],
) => {
  for (const child of children) {
    if (is_nullish(child)) {
      continue
    }
    else if (is_primitive(child)) {
      node.appendChild(new Text(`${child}`))
    }
    else if (Array.isArray(child)) {
      traverse_children(node, child)
    }
    else {
      node.appendChild(child)
    }
  }
}


//////// MOUNT OBSERVER

export const onmount = (node: Node, fn: Function) => {
  let subs = mount_set.get(node)
  if (subs === undefined) {
    mount_set.set(node, subs = new Set)
  }
  subs.add(fn)
}

export const offmount = (node: Node, fn: Function) => {
  const subs = mount_set.get(node)
  if (subs) {
    subs.delete(fn)
  }
}

export const onunmount = (node: Node, fn: Function) => {
  let subs = unmount_set.get(node)
  if (subs === undefined) {
    unmount_set.set(node, subs = new Set)
  }
  subs.add(fn)
}

export const offunmount = (node: Node, fn: Function) => {
  const subs = unmount_set.get(node)
  if (subs) {
    subs.delete(fn)
  }
}

const mount_set   = new WeakMap<Node, Set<Function>>()
const unmount_set = new WeakMap<Node, Set<Function>>()

const check_node = (node: Node, map: WeakMap<Node, Set<Function>>) => {
  if (map.has(node)) {
    const subs = map.get(node)!
    for (const fn of subs) fn()
  }
  for (const child of node.childNodes)
    check_node(child, map)
}

export const init_mount_observer = () => {
  new MutationObserver(list => {
    for (const mut of list) {
      for (const node of mut.addedNodes)   check_node(node, mount_set)
      for (const node of mut.removedNodes) check_node(node, unmount_set)
    }
  }).observe(document.body, {
    childList: true,
    subtree:   true,
  })
}
