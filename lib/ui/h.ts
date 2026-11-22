type Nullish = null | undefined
type Primitive = string | number | boolean
export type HTMLTag = keyof HTMLElementTagNameMap

export type Attributes =
| Nullish
| { [key: string]: Record<string, string> | Function | Primitive | Nullish }
& { style?: Record<string, string> | string }

type Child = Element | Primitive | Nullish | Child[]

export type Element<T extends HTMLTag | Nullish = undefined> =
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


//////// FABRIC

export const h = <T extends HTMLTag | Nullish = null>(
  type?: T,
  attributes?: Attributes,
  ...children: Child[]
): Element<T> => {
  const node = type ? document.createElement(type) : new DocumentFragment()
  traverse_attributes(node, attributes)
  traverse_children(node, children)
  return node as Element<T>
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
    else if (value instanceof Function) {
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

export const onmount = (node: Node, fn: Function): void => {
  let subs = mount_set.get(node)
  if (subs === undefined) {
    mount_set.set(node, subs = new Set)
  }
  subs.add(fn)
}

export const offmount = (node: Node, fn: Function): void => {
  const subs = mount_set.get(node)
  if (subs) {
    subs.delete(fn)
  }
}

export const onunmount = (node: Node, fn: Function): void => {
  let subs = unmount_set.get(node)
  if (subs === undefined) {
    unmount_set.set(node, subs = new Set)
  }
  subs.add(fn)
}

export const offunmount = (node: Node, fn: Function): void => {
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

let observer: MutationObserver

export const init_mount_observer = (): void => {
  if (observer) return
  observer = new MutationObserver(list => {
    for (const mut of list) {
      for (const node of mut.addedNodes)   check_node(node, mount_set)
      for (const node of mut.removedNodes) check_node(node, unmount_set)
    }
  })
  observer.observe(document.body, {
    childList: true,
    subtree:   true,
  })
}
