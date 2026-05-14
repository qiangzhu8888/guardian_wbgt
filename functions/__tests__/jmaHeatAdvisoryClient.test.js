'use strict';

const {
  prefectureNameFromMuniCd,
  parseAtomEntries,
  isVpft50Href,
  textMentionsPrefecture,
  pickVpft50EntryForPrefecture,
  parseLatLonQuery,
  resolveHeatAdvisoryFromFeedXml,
} = require('../lib/jmaHeatAdvisoryClient');

describe('jmaHeatAdvisoryClient', () => {
  it('prefectureNameFromMuniCd maps JIS prefix', () => {
    expect(prefectureNameFromMuniCd('13101')).toBe('東京都');
    expect(prefectureNameFromMuniCd('10201')).toBe('群馬県');
    expect(prefectureNameFromMuniCd('47201')).toBe('沖縄県');
    expect(prefectureNameFromMuniCd('01101')).toBe('北海道');
  });

  it('parseLatLonQuery accepts lng alias', () => {
    expect(parseLatLonQuery({ lat: '35', lng: '139' })).toEqual({ lat: 35, lng: 139 });
    expect(parseLatLonQuery({ lat: '35', lon: '139' })).toEqual({ lat: 35, lng: 139 });
    expect(parseLatLonQuery({ lat: 'x' })).toBeNull();
  });

  it('isVpft50Href detects VPFT50 in path', () => {
    expect(isVpft50Href('https://www.data.jma.go.jp/developer/xml/data/20250715120000_0_VPFT50_130000.xml')).toBe(true);
    expect(isVpft50Href('https://www.data.jma.go.jp/developer/xml/data/20250715120000_0_VPWW53_130000.xml')).toBe(false);
  });

  it('parseAtomEntries extracts link and content', () => {
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <title>熱中症警戒アラート</title>
        <updated>2025-07-15T08:00:00Z</updated>
        <link type="application/xml" href="https://x.example/20250715120000_0_VPFT50_130000.xml"/>
        <content type="text">東京都では暑さに注意してください</content>
      </entry>
    </feed>`;
    const entries = parseAtomEntries(xml);
    expect(entries).toHaveLength(1);
    expect(entries[0].href).toContain('VPFT50');
    expect(entries[0].contentText).toContain('東京都');
  });

  it('textMentionsPrefecture matches full or short name', () => {
    expect(textMentionsPrefecture('東京都では', '東京都')).toBe(true);
    expect(textMentionsPrefecture('東京都市部では', '東京都')).toBe(true);
    expect(textMentionsPrefecture('大阪府では', '京都府')).toBe(false);
  });

  it('pickVpft50EntryForPrefecture prefers atom content match', () => {
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <title>other</title>
        <link href="https://x.example/a.xml"/>
      </entry>
      <entry>
        <title>熱中症</title>
        <link type="application/xml" href="https://x.example/20250715120000_0_VPFT50_999999.xml"/>
        <content type="text"><![CDATA[群馬県では熱中症に警戒してください]]></content>
      </entry>
    </feed>`;
    const { entry, matchedIn } = pickVpft50EntryForPrefecture(xml, '群馬県');
    expect(matchedIn).toBe('atom');
    expect(entry && entry.href).toContain('VPFT50');
  });

  it('resolveHeatAdvisoryFromFeedXml returns active when atom matches', async () => {
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <title>熱中症警戒アラート</title>
        <updated>2025-07-15T08:00:00Z</updated>
        <link type="application/xml" href="https://x.example/20250715120000_0_VPFT50_130000.xml"/>
        <content type="text">東京都に熱中症警戒アラート</content>
      </entry>
    </feed>`;
    const r = await resolveHeatAdvisoryFromFeedXml(xml, '東京都', '13101', null);
    expect(r.active).toBe(true);
    expect(r.prefName).toBe('東京都');
  });
});
