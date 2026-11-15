type glTF = {
  buffers:     { uri: string }[]
  bufferViews: {
    buffer:      number
    byteOffset?: number
    byteLength:  number
  }[]
  accessors:   {
    bufferView:    number
    byteOffset?:   number
    normalized?:   boolean
    componentType: keyof typeof components_type_map
    count:         number
    type:          keyof typeof components_num_map
    max?:          [number, number, number]
    min?:          [number, number, number]
  }[]
  meshes:      {
    name:       string
    primitives: {
      attributes: {
        POSITION:   number
        NORMAL:     number
        TEXCOORD_0: number
        COLOR_0:    number
      }
      indices:   number
      material?: number
    }[]
  }[]
  materials?: ({
    extensions?:           Record<string, Record<string, { index: number }>>
    pbrMetallicRoughness?: Record<string, { index: number }>
  } & Record<string, { index: number }>)[]
  textures?: {
    sampler: number
    source:  number
  }[]
  images?: {
    bufferView?: number
    uri?:        string
    mimeType?:   string
  }[]
}


export type Mesh_Data = {
  positions: Float32Array
  normals:   Float32Array
  uvs:       Float32Array
  indices:   Uint16Array | Uint32Array
  images:    ImageBitmap[]
}


export const load_glTF = async (url: string): Promise<Mesh_Data[]> => {
  const gltf: glTF = await fetch(url).then(res => res.json())
  const bin = await fetch(gltf.buffers[0].uri).then(res => res.arrayBuffer())
  return parse_bin(gltf, bin)
}


export const load_glb = async (url: string): Promise<Mesh_Data[]> => {
  const glb = await fetch(url).then(res => res.arrayBuffer())
  const { json, bin } = parse_glb(glb)
  return parse_bin(json, bin)
}


const parse_bin = async (
  gltf: glTF,
  bin: ArrayBuffer,
): Promise<Mesh_Data[]> => {

  const meshes: Mesh_Data[] = []

  let gltf_images: ImageBitmap[] = []
  if (gltf.images) {
    gltf_images = await Promise.all(gltf.images.map(async (img) => {
      let blob: Blob
      if (img.bufferView) {
        const view = gltf.bufferViews[img.bufferView]
        const bytes = new Uint8Array(bin, view.byteOffset ?? 0, view.byteLength)
        blob = new Blob([ bytes ], { type: img.mimeType })
      }
      else {
        blob = await fetch(img.uri!).then(res => res.blob())
      }
      return createImageBitmap(blob)
    }))
  }

  for await (const mesh of gltf.meshes) {
    const primitive = mesh.primitives[0]
    const attributes = primitive.attributes

    const indices   = read_accessor(gltf, bin, primitive.indices)
    const positions = read_accessor(gltf, bin, attributes.POSITION)
    const normals   = read_accessor(gltf, bin, attributes.NORMAL)
    const uvs       = read_accessor(gltf, bin, attributes.TEXCOORD_0)

    let images: ImageBitmap[] = []

    if (primitive.material !== undefined) {
      const mesh_images = parse_material(gltf, primitive.material)
      for (const id of mesh_images) images.push(gltf_images[id])
    }

    meshes.push({
      positions,
      normals,
      uvs,
      indices,
      images,
    } as Mesh_Data)
  }

  return meshes
}


const read_accessor = (
  gltf: glTF,
  bin: ArrayBuffer,
  accessor_id: number,
): TypedArray => {

  const accessor       = gltf.accessors[accessor_id]
  const view           = gltf.bufferViews[accessor.bufferView]
  const byte_offset    = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const components_num = components_num_map[accessor.type]
  const length         = accessor.count * components_num
  const TypedArray     = components_type_map[accessor.componentType]

  return new TypedArray(bin, byte_offset, length)
}


const parse_material = (gltf: glTF, id: number): number[] => {
  const images: number[] = []
  const material = gltf.materials![id]

  for (const key in material) {
    if (key === "extensions") {
      for (const name in material.extensions) {
        const ext = material.extensions[name]
        grab_images(gltf, ext, images)
      }
      continue
    }

    if (key === "pbrMetallicRoughness") {
      const obj = material.pbrMetallicRoughness!
      grab_images(gltf, obj, images)
      continue
    }

    grab_images(gltf, material, images)
  }

  return images
}


const grab_images = (
  gltf: glTF,
  source: Record<string, { index: number }>,
  images: number[],
) => {
  for (const key in source) {
    if (key.includes("Texture")) {
      images.push(gltf.textures![source[key].index].source)
    }
  }
}


const parse_glb = (glb: ArrayBuffer): { json: glTF, bin: ArrayBuffer } => {
  const view = new DataView(glb)
  let cursor = 0

  // GLB header
  const magic   = view.getUint32(cursor + 0, true)
  const version = view.getUint32(cursor + 4, true)
  const length  = view.getUint32(cursor + 8, true)

  if (magic !== 0x46546c67) { // 'glTF'
    throw new Error("Invalid GLB magic")
  }
  if (version !== 2) {
    throw new Error(`Unsupported GLB version: ${version}`)
  }
  if (length !== glb.byteLength) {
    throw new Error("GLB length mismatch")
  }

  cursor += 12

  // JSON chunk
  let chunk_length = view.getUint32(cursor + 0, true)
  let chunk_type   = view.getUint32(cursor + 4, true)
  cursor += 8

  if (chunk_type !== 0x4e4f534a) { // 'JSON'
    throw new Error("First GLB chunk is not JSON")
  }

  const json_bytes = new Uint8Array(glb, cursor, chunk_length)
  const json_text = new TextDecoder().decode(json_bytes)
  const json = JSON.parse(json_text) as glTF
  cursor += chunk_length

  // BIN chunk
  if (cursor + 8 > glb.byteLength) {
    throw new Error("Missing BIN chunk")
  }

  chunk_length = view.getUint32(cursor, true)
  chunk_type   = view.getUint32(cursor + 4, true)
  cursor += 8

  if (chunk_type !== 0x004e4942) { // 'BIN\0'
    throw new Error("Second GLB chunk is not BIN")
  }

  const bin = glb.slice(cursor, cursor + chunk_length)
  return { json, bin }
}


const components_type_map = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
} as const


const components_num_map = {
  SCALAR: 1,
  VEC2:   2,
  VEC3:   3,
  VEC4:   4,
  MAT2:   4,
  MAT3:   9,
  MAT4:   16,
} as const
