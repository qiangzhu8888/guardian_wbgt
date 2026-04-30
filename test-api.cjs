/**
 * BUILDICS API 接続テストスクリプト
 * 使い方: node test-api.cjs
 */

const https = require('https');

const API_KEY = 'cVJHYmgrbWdzUEpBc3Y0SGl0ZE9VdzVsY0lBbmR1OGg=';
const DEVICE_ID = '350976658106130';

function callApi(endpoint, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const opts = {
      hostname: 'www.buildics.jp',
      path: `/api${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Apikey': API_KEY,
        'X-Apikey-Encoding': 'base64',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function calcWbgt(temp, humidity) {
  const e = (humidity / 100) * 6.1078 * Math.exp((17.269 * temp) / (237.3 + temp));
  return Math.round((0.567 * temp + 0.393 * e + 3.94) * 10) / 10;
}

function wbgtToLevel(wbgt) {
  if (wbgt >= 31) return '危険';
  if (wbgt >= 28) return '厳重警戒';
  if (wbgt >= 25) return '警戒';
  if (wbgt >= 21) return '注意';
  return 'ほぼ安全';
}

async function main() {
  console.log('━'.repeat(50));
  console.log('  BUILDICS API 接続テスト');
  console.log('━'.repeat(50));
  console.log(`  デバイスID: ${DEVICE_ID}`);
  console.log('');

  try {
    const result = await callApi('/common/device/queryDeviceData', [{ deviceId: DEVICE_ID }]);

    console.log(`  HTTP ステータス: ${result.status}`);
    console.log('');

    if (result.status !== 200) {
      console.log('❌ HTTPエラー');
      console.log(result.body);
      return;
    }

    const json = result.body;
    const code = json.code ?? json.Code;

    if (code !== 200) {
      console.log(`❌ APIエラー (code: ${code}): ${json.msg ?? json.Msg}`);
      return;
    }

    const data = json.data ?? json.Data;
    console.log('✅ API接続成功！');
    console.log('');
    console.log('  --- 生データ ---');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    // データ解析
    const item = Array.isArray(data) ? data[0] : data;
    if (!item) {
      console.log('⚠️  データなし（デバイスがオフラインの可能性）');
      return;
    }

    const { dataValue, typeUnit, latestDataTime, deviceId, deviceSn } = item;
    console.log('  --- 解析結果 ---');
    console.log(`  deviceId     : ${deviceId}`);
    console.log(`  deviceSn     : ${deviceSn}`);
    console.log(`  typeUnit     : ${typeUnit}`);
    console.log(`  dataValue    : ${dataValue}`);
    console.log(`  latestDataTime: ${latestDataTime} → ${new Date(parseInt(latestDataTime, 10)).toLocaleString('ja-JP')}`);
    console.log('');

    // 温湿度解析
    const values = String(dataValue ?? '').split(',');
    const units  = String(typeUnit  ?? '').split(',');

    let temp = null, humidity = null;
    units.forEach((u, i) => {
      const unit = u.toLowerCase().trim();
      const val  = parseFloat(values[i]);
      if (isNaN(val)) return;
      if (unit.includes('℃') || unit.includes('°c') || unit.includes('temp')) temp = val;
      else if (unit.includes('rh') || unit.includes('humidity') || unit === '%') humidity = val;
    });

    // フォールバック: 順番で取得
    if (temp === null && humidity === null && values.length >= 2) {
      temp     = parseFloat(values[0]);
      humidity = parseFloat(values[1]);
    }

    if (temp !== null && humidity !== null) {
      const wbgt  = calcWbgt(temp, humidity);
      const level = wbgtToLevel(wbgt);
      const ts    = parseInt(latestDataTime, 10);
      const ageMin = Math.round((Date.now() - ts) / 60000);

      console.log('  --- WBGT 計算結果 ---');
      console.log(`  気温      : ${temp} ℃`);
      console.log(`  湿度      : ${humidity} %`);
      console.log(`  WBGT      : ${wbgt} ℃`);
      console.log(`  危険度    : ${level}`);
      console.log(`  データ経過: ${ageMin} 分前`);
      if (ageMin > 30) console.log('  ⚠️  30分以上経過 → 通信異常と判定');
    } else {
      console.log('⚠️  気温・湿度を特定できませんでした');
      console.log('   typeUnitの内容を確認してください:', typeUnit);
    }

  } catch (err) {
    console.log(`❌ 接続エラー: ${err.message}`);
  }

  console.log('');
  console.log('━'.repeat(50));
}

main();
