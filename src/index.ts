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
  bBoxes: Array<BBox>,
  grouped: Array<Array<Point>>
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

// Moves the bBox rather than moving the points... either would work
// Padding is split evenly so the orignial points are centered
export function paddedPartitionedPoints(points: Array<Point>, originalBBox: BBox, padding: Point, partitionsPerAxis: number) : Partitions {
  const paddedBBox = {
    x: originalBBox.x - padding.x * 0.5,
    y: originalBBox.y - padding.y * 0.5,
    width: originalBBox.width + padding.x,
    height: originalBBox.height + padding.y
  }
  const result = partitionedPoints(points, paddedBBox, partitionsPerAxis)
  return result
}

export function partitionedPoints(points: Array<Point>, bBox: BBox, partitionsPerAxis: number) : Partitions {
  if (partitionsPerAxis <= 1) {
    return {
      bBoxes: [bBox],
      grouped: [points]
    }
  }

  // TODO Add minimal padding?
  const size = Math.max(bBox.width, bBox.height)
  const step = size / partitionsPerAxis

  // Linear array of empty arrays of partitions*partions size
  const grouped = Array.from(Array<Array<Point>>(partitionsPerAxis*partitionsPerAxis), () => []);

  points.forEach((p, i) => {
    let xx = Math.floor((p.x - bBox.x)/step)  // + halfStep?
    let x = xx == partitionsPerAxis ? xx - 1 : xx // Edge case on maximum... nudge maximum size?
    let yy = Math.floor((p.y - bBox.y)/step)  // + halfStep?
    let y = yy == partitionsPerAxis ? yy - 1 : yy
    let index = y*partitionsPerAxis + x
    if (index > grouped.length) {
      console.log(i, x, y)
      console.log(p)
      console.log(bBox)
    }
    let point: Point = {x: p.x, y: p.y}
    grouped[index] = [...grouped[index], point]
  })

  const bBoxes = Array.from(Array<BBox>(partitionsPerAxis*partitionsPerAxis), (_, i) => {
    let x = (i%partitionsPerAxis) * step + bBox.x
    let y = Math.floor(i/partitionsPerAxis) * step + bBox.y
    let width = step
    let height = step
    return { x, y, width, height }
  })

  return { bBoxes, grouped }
}

function within(bBox: BBox, point: Point): boolean {
  if (bBox.x > point.x) return false
  if (bBox.x + bBox.width < point.x) return false
  if (bBox.y > point.y) return false
  if (bBox.y + bBox.height < point.y) return false
  return true
}

export function withinBBox(bBox: BBox, points: Array<Point>): boolean {
  let good = points.reduce((prev: boolean, point: Point) => within(bBox, point), true)
  return good
}

export function badlyPartitioned(points: Array<Point>, bBox: BBox, partitionsPerAxis: number) : Partitions {
  let partitioned = partitionedPoints(points, bBox, partitionsPerAxis)
  let bad = partitioned.bBoxes.reduce((prev: Partitions, bBox: BBox, i: number) => {
    let points = partitioned.grouped[i]
    let good = withinBBox(bBox, points)
    if (good) return prev
    let result = {
      bBoxes: [...prev.bBoxes, bBox],
      grouped: [...prev.grouped, points]
    }
    return result
  }, { bBoxes: [], grouped: []})
  return bad
}

function zeroOrThree(points: Array<Point>): Array<Point> {
  if (points.length < 3) return []
  const p1 = points[0]
  const p2 = points[Math.floor(points.length/2)]
  const p3 = points[points.length-1]
  return [p1, p2, p3]
}

export function partitionedThreePoints(points: Array<Point>, bBox: BBox, partitionsPerAxis: number) : Partitions {

  const firstPass = partitionedPoints(points, bBox, partitionsPerAxis)

  const grouped = firstPass.grouped.map((points) => zeroOrThree(points))
  const bBoxes = firstPass.bBoxes
  
  return { bBoxes, grouped }
}
