// 由 tools/gen-home-data.py 產生——不要手改。資料是 App 內建範本「山陽 6 日」的第 2 天。
export const DATA = {
 "zh": {
  "title": "山陽 6 日｜廣島、宮島、尾道、倉敷、岡山",
  "day": [
   {
    "key": "d2-breakfast",
    "title": "飯店免費早餐",
    "start": "07:30",
    "end": "08:05",
    "category": "dining",
    "leg": null
   },
   {
    "key": "d2-ferry",
    "title": "JR 宮島渡輪 宮島口 → 宮島",
    "start": "09:10",
    "end": "09:20",
    "category": "ferry",
    "leg": {
     "mode": "transit",
     "transitKind": "train",
     "durationMinutes": 46,
     "runs": [
      {
       "name": "山陽本線 岩國行",
       "departure": "08:12",
       "arrival": "08:40"
      },
      {
       "name": "山陽本線 大野浦行",
       "departure": "08:27",
       "arrival": "08:55"
      },
      {
       "name": "山陽本線 岩國行",
       "departure": "08:42",
       "arrival": "09:10"
      }
     ],
     "selectedRunIndex": 1
    }
   },
   {
    "key": "d2-omotesando",
    "title": "表參道商店街 邊走邊吃",
    "start": "09:30",
    "end": "10:05",
    "category": "market",
    "leg": {
     "mode": "walking",
     "durationMinutes": 5
    }
   },
   {
    "key": "d2-itsukushima",
    "title": "嚴島神社",
    "start": "10:15",
    "end": "11:15",
    "category": "temple",
    "leg": {
     "mode": "walking",
     "durationMinutes": 6
    }
   },
   {
    "key": "d2-momijidani",
    "title": "紅葉谷公園",
    "start": "11:30",
    "end": "12:00",
    "category": "park",
    "leg": {
     "mode": "walking",
     "durationMinutes": 12
    }
   },
   {
    "key": "d2-ropeway",
    "title": "宮島纜車 → 獅子岩展望台",
    "start": "12:25",
    "end": "13:25",
    "category": "cablecar",
    "leg": {
     "mode": "other",
     "durationMinutes": 20
    }
   },
   {
    "key": "d2-oyster",
    "title": "午餐：牡蠣屋",
    "start": "14:00",
    "end": "15:00",
    "category": "dining",
    "leg": {
     "mode": "walking",
     "durationMinutes": 30
    }
   },
   {
    "key": "d2-genbaku-dome",
    "title": "原爆圓頂",
    "start": "16:40",
    "end": "17:20",
    "category": "sight",
    "leg": {
     "mode": "transit",
     "transitKind": "ferry",
     "durationMinutes": 85,
     "runs": [
      {
       "name": "JR 宮島渡輪",
       "departure": "15:10",
       "arrival": "15:20"
      },
      {
       "name": "松大汽船",
       "departure": "15:25",
       "arrival": "15:35"
      },
      {
       "name": "JR 宮島渡輪",
       "departure": "15:40",
       "arrival": "15:50"
      }
     ],
     "selectedRunIndex": 1
    }
   },
   {
    "key": "d2-peace-park",
    "title": "和平紀念公園、和平之燈",
    "start": "17:30",
    "end": "18:05",
    "category": "park",
    "leg": {
     "mode": "walking",
     "durationMinutes": 5
    }
   },
   {
    "key": "d2-orizuru",
    "title": "折鶴塔 展望台",
    "start": "18:15",
    "end": "18:55",
    "category": "viewpoint",
    "leg": {
     "mode": "walking",
     "durationMinutes": 8
    }
   },
   {
    "key": "d2-yakiniku",
    "title": "晚餐：炭火燒肉 敏（外帶燒肉便當）",
    "start": "19:00",
    "end": "20:00",
    "category": "dining",
    "leg": {
     "mode": "transit",
     "transitKind": "train",
     "durationMinutes": 30
    }
   }
  ],
  "todos": [
   "出發前先在網站上劃好新幹線的位子，尖峰時段自由席會站著",
   "第一次使用當天到綠色窗口或兌換機領實體票"
  ],
  "todoOwner": "岡山＆廣島＆山口地區 JR Pass（5 日）"
 },
 "en": {
  "title": "San'yō in 6 Days — Hiroshima, Miyajima, Onomichi, Kurashiki, Okayama",
  "day": [
   {
    "key": "d2-breakfast",
    "title": "Free hotel breakfast",
    "start": "07:30",
    "end": "08:05",
    "category": "dining",
    "leg": null
   },
   {
    "key": "d2-ferry",
    "title": "JR Miyajima ferry, Miyajimaguchi → Miyajima",
    "start": "09:10",
    "end": "09:20",
    "category": "ferry",
    "leg": {
     "mode": "transit",
     "transitKind": "train",
     "durationMinutes": 46,
     "runs": [
      {
       "name": "San'yō Line for Iwakuni",
       "departure": "08:12",
       "arrival": "08:40"
      },
      {
       "name": "San'yō Line for Ōnoura",
       "departure": "08:27",
       "arrival": "08:55"
      },
      {
       "name": "San'yō Line for Iwakuni",
       "departure": "08:42",
       "arrival": "09:10"
      }
     ],
     "selectedRunIndex": 1
    }
   },
   {
    "key": "d2-omotesando",
    "title": "Eat your way along Omotesando",
    "start": "09:30",
    "end": "10:05",
    "category": "market",
    "leg": {
     "mode": "walking",
     "durationMinutes": 5
    }
   },
   {
    "key": "d2-itsukushima",
    "title": "Itsukushima Shrine",
    "start": "10:15",
    "end": "11:15",
    "category": "temple",
    "leg": {
     "mode": "walking",
     "durationMinutes": 6
    }
   },
   {
    "key": "d2-momijidani",
    "title": "Momijidani Park",
    "start": "11:30",
    "end": "12:00",
    "category": "park",
    "leg": {
     "mode": "walking",
     "durationMinutes": 12
    }
   },
   {
    "key": "d2-ropeway",
    "title": "Miyajima Ropeway to the Shishiiwa Observatory",
    "start": "12:25",
    "end": "13:25",
    "category": "cablecar",
    "leg": {
     "mode": "other",
     "durationMinutes": 20
    }
   },
   {
    "key": "d2-oyster",
    "title": "Lunch at Kakiya",
    "start": "14:00",
    "end": "15:00",
    "category": "dining",
    "leg": {
     "mode": "walking",
     "durationMinutes": 30
    }
   },
   {
    "key": "d2-genbaku-dome",
    "title": "The Atomic Bomb Dome",
    "start": "16:40",
    "end": "17:20",
    "category": "sight",
    "leg": {
     "mode": "transit",
     "transitKind": "ferry",
     "durationMinutes": 85,
     "runs": [
      {
       "name": "JR Miyajima ferry",
       "departure": "15:10",
       "arrival": "15:20"
      },
      {
       "name": "Miyajima Matsudai ferry",
       "departure": "15:25",
       "arrival": "15:35"
      },
      {
       "name": "JR Miyajima ferry",
       "departure": "15:40",
       "arrival": "15:50"
      }
     ],
     "selectedRunIndex": 1
    }
   },
   {
    "key": "d2-peace-park",
    "title": "Peace Memorial Park and the Flame of Peace",
    "start": "17:30",
    "end": "18:05",
    "category": "park",
    "leg": {
     "mode": "walking",
     "durationMinutes": 5
    }
   },
   {
    "key": "d2-orizuru",
    "title": "Orizuru Tower observation deck",
    "start": "18:15",
    "end": "18:55",
    "category": "viewpoint",
    "leg": {
     "mode": "walking",
     "durationMinutes": 8
    }
   },
   {
    "key": "d2-yakiniku",
    "title": "Dinner: Yakiniku Bin (takeaway bento)",
    "start": "19:00",
    "end": "20:00",
    "category": "dining",
    "leg": {
     "mode": "transit",
     "transitKind": "train",
     "durationMinutes": 30
    }
   }
  ],
  "todos": [
   "Reserve Shinkansen seats online before you leave — the unreserved cars mean standing at peak times",
   "Collect the physical ticket at a JR ticket office or machine on the first day you use it"
  ],
  "todoOwner": "Okayama–Hiroshima–Yamaguchi Area Pass (5 days)"
 },
 "ja": {
  "title": "山陽 6 日間｜広島・宮島・尾道・倉敷・岡山",
  "day": [
   {
    "key": "d2-breakfast",
    "title": "ホテルの無料朝食",
    "start": "07:30",
    "end": "08:05",
    "category": "dining",
    "leg": null
   },
   {
    "key": "d2-ferry",
    "title": "JR 宮島フェリー 宮島口 → 宮島",
    "start": "09:10",
    "end": "09:20",
    "category": "ferry",
    "leg": {
     "mode": "transit",
     "transitKind": "train",
     "durationMinutes": 46,
     "runs": [
      {
       "name": "山陽本線 岩国行",
       "departure": "08:12",
       "arrival": "08:40"
      },
      {
       "name": "山陽本線 大野浦行",
       "departure": "08:27",
       "arrival": "08:55"
      },
      {
       "name": "山陽本線 岩国行",
       "departure": "08:42",
       "arrival": "09:10"
      }
     ],
     "selectedRunIndex": 1
    }
   },
   {
    "key": "d2-omotesando",
    "title": "表参道商店街で食べ歩き",
    "start": "09:30",
    "end": "10:05",
    "category": "market",
    "leg": {
     "mode": "walking",
     "durationMinutes": 5
    }
   },
   {
    "key": "d2-itsukushima",
    "title": "厳島神社",
    "start": "10:15",
    "end": "11:15",
    "category": "temple",
    "leg": {
     "mode": "walking",
     "durationMinutes": 6
    }
   },
   {
    "key": "d2-momijidani",
    "title": "紅葉谷公園",
    "start": "11:30",
    "end": "12:00",
    "category": "park",
    "leg": {
     "mode": "walking",
     "durationMinutes": 12
    }
   },
   {
    "key": "d2-ropeway",
    "title": "宮島ロープウエー → 獅子岩展望台",
    "start": "12:25",
    "end": "13:25",
    "category": "cablecar",
    "leg": {
     "mode": "other",
     "durationMinutes": 20
    }
   },
   {
    "key": "d2-oyster",
    "title": "昼食：牡蠣屋",
    "start": "14:00",
    "end": "15:00",
    "category": "dining",
    "leg": {
     "mode": "walking",
     "durationMinutes": 30
    }
   },
   {
    "key": "d2-genbaku-dome",
    "title": "原爆ドーム",
    "start": "16:40",
    "end": "17:20",
    "category": "sight",
    "leg": {
     "mode": "transit",
     "transitKind": "ferry",
     "durationMinutes": 85,
     "runs": [
      {
       "name": "JR 宮島フェリー",
       "departure": "15:10",
       "arrival": "15:20"
      },
      {
       "name": "宮島松大汽船",
       "departure": "15:25",
       "arrival": "15:35"
      },
      {
       "name": "JR 宮島フェリー",
       "departure": "15:40",
       "arrival": "15:50"
      }
     ],
     "selectedRunIndex": 1
    }
   },
   {
    "key": "d2-peace-park",
    "title": "平和記念公園、平和の灯",
    "start": "17:30",
    "end": "18:05",
    "category": "park",
    "leg": {
     "mode": "walking",
     "durationMinutes": 5
    }
   },
   {
    "key": "d2-orizuru",
    "title": "おりづるタワー 展望台",
    "start": "18:15",
    "end": "18:55",
    "category": "viewpoint",
    "leg": {
     "mode": "walking",
     "durationMinutes": 8
    }
   },
   {
    "key": "d2-yakiniku",
    "title": "夕食：炭火焼肉 敏（焼肉弁当のテイクアウト）",
    "start": "19:00",
    "end": "20:00",
    "category": "dining",
    "leg": {
     "mode": "transit",
     "transitKind": "train",
     "durationMinutes": 30
    }
   }
  ],
  "todos": [
   "新幹線の指定席は事前にネットで確保。ピーク時の自由席は立つことになる",
   "利用開始日にみどりの窓口か受取機で実券を受け取る"
  ],
  "todoOwner": "岡山・広島・山口エリアパス（5 日間）"
 }
};
