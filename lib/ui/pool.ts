import { h, type Attributes, type Element, type HTMLTag } from "./h"



export type UI_Pool<T extends HTMLTag = any> = {
  list:     Element<T>[]
  capacity: number
  new_el:   () => Element<T>
}


export const new_ui_pool = <T extends HTMLTag>(
  tag: T,
  capacity: number,
  attributes?: Attributes,
): UI_Pool<T> => {
  const new_el = () => h(tag, attributes)
  const list = Array(capacity).fill(null).map(new_el)
  return {
    list,
    capacity,
    new_el,
  }
}


export const ui_pool_get = <T extends HTMLTag>(pool: UI_Pool<T>): Element<T> => {
  const list     = pool.list
  const capacity = pool.capacity
  const new_el   = pool.new_el

  if (list.length === 0) {
    list.length = capacity
    for (let i = 0; i < capacity; i++) {
      list[i] = new_el()
    }
  }

  return list.pop()!
}


export const ui_pool_put = <T extends HTMLTag>(pool: UI_Pool<T>, ...el: Element<T>[]): void => {
  pool.list.push(...el)
}


export const ui_pool_clear = (pool: UI_Pool): void => {
  pool.list.length = 0
}
