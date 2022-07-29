interface Point {
  x: number;
  y: number;
}

interface BBox {
  x: number,
  y: number,
  width: number,
  height: number
}

interface Partitions {
  shape: Array<number>,
  bBoxes: Array<BBox>,
  grouped: Array<Array<number>>
}

export function bBoxFromPoints(points: Array<Point>): BBox {
  let minX = Number.MAX_VALUE
  let maxX = Number.MIN_VALUE
  let minY = Number.MAX_VALUE
  let maxY = Number.MIN_VALUE
  points.forEach((p) => {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  })
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

// Padding is split evenly so the orignial points are centered
export function padBBox(originalBBox: BBox, padding: Point) : BBox {
  const paddedBBox = {
    x: originalBBox.x - padding.x * 0.5,
    y: originalBBox.y - padding.y * 0.5,
    width: originalBBox.width + padding.x,
    height: originalBBox.height + padding.y
  }
  return paddedBBox
}

export function partitionedPoints(points: Array<Point>, bBox: BBox, partitionsPerAxis: number) : Partitions {
  if (partitionsPerAxis <= 1) {
    return {
      shape: [1, 1],
      bBoxes: [bBox],
      grouped: [[...Array(points.length).keys()]]
    }
  }

  // TODO Add minimal padding?
  const size = Math.max(bBox.width, bBox.height)
  const step = size / partitionsPerAxis

  // Linear array of empty arrays of partitions*partions size
  //const grouped = Array.from(Array<Array<Point>>(partitionsPerAxis*partitionsPerAxis), () => []);
  const grouped = Array.from(Array<Array<number>>(partitionsPerAxis*partitionsPerAxis), () => []);

  points.forEach((p, i) => {
    let xx = Math.floor((p.x - bBox.x)/step)  // + halfStep?
    let x = xx == partitionsPerAxis ? xx - 1 : xx // Edge case on maximum... nudge maximum size?
    let yy = Math.floor((p.y - bBox.y)/step)  // + halfStep?
    let y = yy == partitionsPerAxis ? yy - 1 : yy
    let index = y*partitionsPerAxis + x
    let point: Point = {x: p.x, y: p.y}
    grouped[index] = [...grouped[index], point]
    // if (ies[index].length > 1) {
    //   let last = ies[index].slice(-1)[0]
    //   if (last+1 != i) {
    //     console.log('out of sequence')
    //     console.log(last, i)
    //   }
    // }
    // ies[index] = [...ies[index], i]
  })

  const bBoxes = Array.from(Array<BBox>(partitionsPerAxis*partitionsPerAxis), (_, i) => {
    let x = (i%partitionsPerAxis) * step + bBox.x
    let y = Math.floor(i/partitionsPerAxis) * step + bBox.y
    let width = step
    let height = step
    return { x, y, width, height }
  })

  const shape = [partitionsPerAxis, partitionsPerAxis]

  return { shape, bBoxes, grouped }
}

function within(bBox: BBox, point: Point): boolean {
  if (bBox.x > point.x) return false
  if (bBox.x + bBox.width < point.x) return false
  if (bBox.y > point.y) return false
  if (bBox.y + bBox.height < point.y) return false
  return true
}

export function withinBBox(bBox: BBox, points: Array<Point>, indexes: Array<number>): boolean {
  let good = indexes.reduce((prev: boolean, index: number) => within(bBox, points[index]), true)
  return good
}

export function badlyPartitioned(points: Array<Point>, bBox: BBox, partitionsPerAxis: number) : Partitions {
  let partitioned = partitionedPoints(points, bBox, partitionsPerAxis)
  let bad = partitioned.bBoxes.reduce((prev: Partitions, bBox: BBox, i: number) => {
    let indexes = partitioned.grouped[i]
    let good = withinBBox(bBox, points, indexes)
    if (good) return prev
    let result = {
      bBoxes: [...prev.bBoxes, bBox],
      grouped: [...prev.grouped, indexes]
    }
    return result
  }, { bBoxes: [], grouped: []})
  const shape = [partitionsPerAxis, partitionsPerAxis]
  const bBoxes = bad.bBoxes
  const grouped = bad.grouped 
  return { shape, bBoxes, grouped }
}

function zeroOrThree(indexes: Array<number>): Array<number> {
  if (indexes.length < 3) return []
  const i1 = indexes[0]
  const i2 = indexes[Math.floor(indexes.length/2)]
  const i3 = indexes[indexes.length-1]
  return [i1, i2, i3]
}

export function partitionedThreePoints(points: Array<Point>, bBox: BBox, partitionsPerAxis: number) : Partitions {

  const firstPass = partitionedPoints(points, bBox, partitionsPerAxis)

  const shape = firstPass.shape
  const grouped = firstPass.grouped.map((indexes) => zeroOrThree(indexes))
  const bBoxes = firstPass.bBoxes
  
  return { shape, bBoxes, grouped }
}
