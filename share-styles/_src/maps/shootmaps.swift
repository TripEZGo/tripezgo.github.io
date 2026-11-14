// 拍整趟地圖的底圖（MKMapSnapshotter），並用 snapshot.point(for:) 算每一站在圖上的位置（含框外的站，會是外推點）。
//   swift shootmaps.swift spec.json ../../_sample/maps
// 框：叢集成員的外框（MKMapPoint）放進「安全區」（畫布扣掉圖例、badge 會蓋住的地方），四邊留 margin，再撐到畫布比例。
// 參考：docs/App/Design/trip-share-map-clusters/shoot_layouts.swift。
import AppKit
import MapKit

struct Job: Decodable {
    let id: String; let w: Double; let h: Double; let safe: [Double]; let dark: Bool
    let members: [[Double]]; let margin: Double; let points: [String: [Double]]
}
let args = CommandLine.arguments
let jobs = try JSONDecoder().decode([Job].self, from: Data(contentsOf: URL(fileURLWithPath: args[1])))
let outDir = URL(fileURLWithPath: args[2])
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

func mp(_ ll: [Double]) -> MKMapPoint { MKMapPoint(CLLocationCoordinate2D(latitude: ll[0], longitude: ll[1])) }

func rect(for job: Job) -> MKMapRect {
    let pts = job.members.map(mp)
    let minX = pts.map(\.x).min()!, maxX = pts.map(\.x).max()!
    let minY = pts.map(\.y).min()!, maxY = pts.map(\.y).max()!
    let lat = job.members.map { $0[0] }.reduce(0, +) / Double(job.members.count)
    let minSide = MKMapPointsPerMeterAtLatitude(lat) * 2_000      // 至少 2 km 見方（S157，App 的 ShareMapArt.minimumSpanMetres）
    let ex = max(maxX - minX, minSide), ey = max(maxY - minY, minSide)
    let l = job.safe[0], t = job.safe[1], r = job.safe[2], b = job.safe[3]
    let sw = job.w - l - r, sh = job.h - t - b
    let ppp = max(ex / (sw * (1 - 2 * job.margin)), ey / (sh * (1 - 2 * job.margin)))   // map points per px
    let cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
    let sx = l + sw / 2, sy = t + sh / 2
    return MKMapRect(x: cx - sx * ppp, y: cy - sy * ppp, width: job.w * ppp, height: job.h * ppp)
}

func snapshot(_ job: Job) -> MKMapSnapshotter.Snapshot? {
    let o = MKMapSnapshotter.Options()
    o.mapRect = rect(for: job)
    o.size = CGSize(width: job.w, height: job.h)
    o.appearance = NSAppearance(named: job.dark ? .darkAqua : .aqua)
    var result: MKMapSnapshotter.Snapshot?
    for attempt in 0..<6 where result == nil {
        var done = false
        MKMapSnapshotter(options: o).start(with: .main) { s, e in
            result = s; done = true
            if let e { FileHandle.standardError.write("snapshot err \(attempt) \(e)\n".data(using: .utf8)!) }
        }
        while !done { RunLoop.main.run(until: Date().addingTimeInterval(0.05)) }
        if result == nil { Thread.sleep(forTimeInterval: 2) }
    }
    return result
}

for job in jobs {
    guard let snap = snapshot(job) else { print("FAILED \(job.id)"); continue }
    var out: [String: [Double]] = [:]
    var h: CGFloat = 0
    if let rep = snap.image.representations.first { h = CGFloat(rep.pixelsHigh) }
    for (k, ll) in job.points {
        let p = snap.point(for: CLLocationCoordinate2D(latitude: ll[0], longitude: ll[1]))
        out[k] = [Double(p.x), Double(job.h) - Double(p.y)]     // macOS：左下原點 → 轉成左上原點的 CSS px
    }
    if let tiff = snap.image.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
       let jpg = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.82]) {
        try jpg.write(to: outDir.appendingPathComponent("\(job.id).jpg"))
        print("\(job.id) px \(rep.pixelsWide)x\(rep.pixelsHigh) for \(Int(job.w))x\(Int(job.h)) rep.h=\(h)")
    }
    let data = try JSONSerialization.data(withJSONObject: ["w": job.w, "h": job.h, "points": out], options: [])
    try data.write(to: outDir.appendingPathComponent("\(job.id).json"))
}
