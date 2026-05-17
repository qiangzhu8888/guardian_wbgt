/**
 * 温湿度センサーおよび現場側端末の参考仕様。お届け機種・設定により異なる場合があります。
 * @typedef {{ item: string, detail: string }} HardwareSpecRow
 * @typedef {{ category: string, rows: HardwareSpecRow[] }} HardwareSpecSection
 */

/** @type {HardwareSpecSection[]} */
export const HARDWARE_SPEC_SECTIONS = [
  {
    category: '外形・材質・耐性・設置',
    rows: [
      {
        item: '外形寸法 / 重量',
        detail: '146mm × 110mm × 37mm / 402g',
      },
      {
        item: '材質 / 保護等級',
        detail: 'ABS/PC 樹脂 / IP67（完全防塵・防浸型）',
      },
      {
        item: '電源 / 寿命',
        detail: '10,000mAh リチウムポリマー電池 ＋ 太陽光充電 / 設定により最大約 10 年駆動',
      },
      {
        item: '設置方法 / 動作環境',
        detail: 'ネジ止め式 / −30℃ ～ 70℃、5〜100% RH',
      },
    ],
  },
  {
    category: '通信機能',
    rows: [
      {
        item: 'セルラー通信',
        detail: 'LTE-M / NB-IoT（3GPP Release 13）',
      },
      {
        item: 'Bluetooth®',
        detail: 'BLE 4.x / 5.0、送信出力 +8 dBm（見通し約 100m）',
      },
      {
        item: '接続可能台数',
        detail: 'BLE サブデバイスと同時に最大 8 台まで',
      },
      {
        item: 'クラウドプロトコル',
        detail: 'HTTP/HTTPS、MQTT/MQTTS、UDP',
      },
    ],
  },
  {
    category: 'センサー',
    rows: [
      {
        item: '標準内蔵センサー',
        detail: '加速度センサー、地磁気センサー',
      },
      {
        item: '外部センサー',
        detail: '外部センサーに温湿度（温度・湿度）計測を搭載。そのほか CO₂、VOC 等はオプション',
      },
    ],
  },
  {
    category: 'GNSS 測位（オプション）',
    rows: [
      {
        item: '対応システム',
        detail: 'GPS / GLONASS / BeiDou',
      },
      {
        item: '測位精度',
        detail: '約 30m（CEP）',
      },
      {
        item: '受信感度',
        detail: '追跡 −162 dBm',
      },
    ],
  },
  {
    category: 'その他',
    rows: [
      {
        item: 'ファームウェア更新',
        detail: 'FOTA（クラウド経由の遠隔更新）対応',
      },
      {
        item: '認証 / 適合',
        detail: 'CE、FCC、TELEC',
      },
    ],
  },
];

export const HARDWARE_SPEC_DISCLAIMER =
  '上記は温湿度センサー計測を想定した現場端末クラスの参考値です。量産ロット・販売地域・モデル構成により異なることがあります。';
