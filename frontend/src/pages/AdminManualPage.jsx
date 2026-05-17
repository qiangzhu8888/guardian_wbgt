import PublicDocsLayout from '../components/PublicDocsLayout';

function ManualSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{children}</div>
    </section>
  );
}

function ManualTOC() {
  const items = /** @type {const} */ ([
    ['ログイン・ログアウト', '#login'],
    ['管理コンソールの全体像', '#menu'],
    ['組織設定', '#org-settings'],
    ['場所（監視地点）', '#facilities'],
    ['デバイス台帳と紐付け', '#devices'],
    ['プラットフォーム（superadmin）', '#platform'],
    ['公開監視画面の見方', '#monitoring-public'],
    ['うまくいかないとき', '#troubleshoot'],
  ]);
  return (
    <nav
      aria-label="目次"
      className="rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white/95 dark:bg-slate-900/85 p-4 sm:p-5 shadow-sm mb-10"
    >
      <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">目次（該当箇所へジャンプ）</p>
      <ol className="list-decimal list-outside pl-5 space-y-2 text-sm text-sky-900 dark:text-sky-100/95">
        {items.map(([label, href]) => (
          <li key={href}>
            <a href={href} className="font-semibold text-sky-800 dark:text-sky-200 underline underline-offset-4 hover:no-underline">
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function AdminManualPage() {
  return (
    <PublicDocsLayout
      title="管理コンソール操作マニュアル"
      description="BUILDICS GUARDIAN の管理画面にログインしてから公開の監視画面にデータを載せるまでを、画面上の名前に沿って手順順に説明しています。このページだけ読めば基本操作できます。"
    >
      <div className="surface-card p-5 sm:p-6 mb-8 space-y-4 text-sm text-slate-700 dark:text-slate-300">
        <div>
          <p className="font-bold text-slate-900 dark:text-white mb-1">このマニュアルの読み方</p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>初めてセットアップするとき：</strong>
              はじめから順に読み、画面上の<strong>ボタン名やメニュー名</strong>どおり進めればよい順番になっています（推奨は「組織設定 → 場所 → デバイス紐付け」です）。
            </li>
            <li>
              <strong>項目だけ確認したいとき：</strong>
              下の目次から該当の章だけ開いてください。
            </li>
            <li>
              画面上の細かな変更やリリース内容は{' '}
              <code className="text-xs bg-slate-200/80 dark:bg-slate-800 px-1 rounded">/changelog</code>{' '}
              （更新履歴）も参照してください。この文書の URL は{' '}
              <code className="text-xs bg-slate-200/80 dark:bg-slate-800 px-1 rounded">/manual</code> です。
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-sky-100 dark:border-sky-900/70 bg-sky-50/80 dark:bg-sky-950/35 px-4 py-3 space-y-2">
          <p className="font-bold text-sky-950 dark:text-sky-100">ページのどこから操作するか</p>
          <ul className="list-disc list-outside pl-5 space-y-1.5 text-sm leading-relaxed">
            <li>
              <strong>PC（幅が広い画面）：</strong>ログイン後、画面<strong>左の縦メニュー</strong>から「ホーム・手順一覧」「組織設定」「場所を追加・編集」「デバイス紐付け」などへ進みます。
            </li>
            <li>
              <strong>スマートフォン：</strong>
              画面上部左の<strong>「☰ メニュー」</strong>で同じ一覧を開けます（外側をタップまたは「閉じる」で閉じます）。
            </li>
            <li>
              <strong>いつでも使える共通ボタン：</strong>画面上部<strong>監視画面を開く</strong>は、来客向けの公開監視ページを別で開くためのリンクです（ログインしている組織の URL に進みます）。<strong>マニュアル</strong>／<strong>通知</strong>もヘッダーから開けます。
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">対象となる利用者</p>
          <ul className="list-disc list-outside pl-5 space-y-1 text-sm mt-1">
            <li>
              ログイン URL:{' '}
              <code className="text-xs bg-slate-200/80 dark:bg-slate-800 px-1 rounded">/admin/login</code>
            </li>
            <li>組織の管理者（admin）および、システム全体のプラットフォーム管理者（superadmin）</li>
          </ul>
        </div>
      </div>

      <div className="space-y-10 max-w-3xl">
        <ManualTOC />
        <ManualSection id="login" title="1. ログイン・ログアウト">
          <div className="rounded-lg bg-slate-50/90 dark:bg-slate-800/55 px-4 py-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
            目的：管理コンソールに入ります。終わったら安全のためログアウトしてください。
          </div>
          <ol className="list-decimal list-outside pl-5 space-y-3">
            <li>
              ブラウザのアドレス欄で{' '}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin/login</code>{' '}
              にアクセスします（製品サイトのリンクからでも構いません）。
            </li>
            <li>運用担当から案内されている<strong>メールアドレス</strong>と<strong>パスワード</strong>を入力します。</li>
            <li>
              ログインボタンが成功すると、URL は{' '}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin</code>{' '}
              付近になり、名前は「ホーム・手順一覧」の<strong>管理メニュー</strong>ページが開きます。
            </li>
            <li>
              離席するときや作業終了後は、画面右上<strong>ログアウト</strong>を選びます。エラー続きや再ログインの案内が出たときも、一度<strong>ログアウトしてからやり直す</strong>と解消することがあります。
            </li>
          </ol>
        </ManualSection>

        <ManualSection id="menu" title="2. 管理コンソールの全体像（ここだけ押さえる）">
          <div className="rounded-lg bg-slate-50/90 dark:bg-slate-800/55 px-4 py-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
            目的：公開の<strong>監視ダッシュボード</strong>にカードとして載せる<strong>場所</strong>と、その場所への<strong>デバイス紐付け</strong>を管理します。
          </div>

          <p className="font-semibold text-slate-900 dark:text-slate-100">画面上の名前（迷ったら）</p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>ホーム・手順一覧</strong>
              ：<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin</code>
              のカード一覧。セットアップの流れがまとめてあります（左メニューの「ホーム」と同じ内容です）。
            </li>
            <li>
              <strong>組織設定</strong>
              ：ダッシュボードに出る名前・見た目・更新の速さなどを決めます（場所より先でも後でも大丈夫ですが、見た目を先に決めたい場合は最初がおすすめです）。
            </li>
            <li>
              <strong>場所を追加・編集</strong>
              ：カードひとつ分の<strong>監視地点</strong>（名前・表示順など）です。ここで<strong>場所 ID（数値）</strong>が決まります。
            </li>
            <li>
              <strong>デバイス紐付け</strong>
              ：BUILDICS の<strong>デバイス ID</strong>（数字だけの ID）を、いま登録済みの<strong>場所 ID</strong>
              に結びつけます。ここまでやると、監視画面の対象地点に<strong>データが載り始めます</strong>。
            </li>
          </ul>

          <p className="font-semibold text-slate-900 dark:text-slate-100 pt-2">初回おすすめの順番（手順）</p>
          <ol className="list-decimal list-outside pl-5 space-y-2">
            <li>左メニュー（または ☰ メニュー）から<strong>組織設定</strong>へ → 表示名やテーマ、必要なら API 情報を入力 → 画面に沿って<strong>保存</strong></li>
            <li>
              <strong>場所を追加・編集</strong>へ → 名前・並び順を登録／確認（必要な住所・写真もここ）（場所リストの直下に<strong>デバイス紐付け</strong>への導線があります）
            </li>
            <li>
              <strong>デバイス紐付け</strong>へ → ID を入力するか QR／CSV で台帳に追加 → <strong>紐付け場所</strong>で場所 ID を確認（リストの直下に<strong>場所を登録</strong>への導線があります）
            </li>
          </ol>

          <div className="rounded-xl border border-amber-200/80 dark:border-amber-800/55 bg-amber-50/60 dark:bg-amber-950/30 px-4 py-3 space-y-2 text-sm mt-4">
            <p className="font-bold text-amber-950 dark:text-amber-100">複数の組織に登録されている場合</p>
            <p>
              画面上部に<strong>操作中の組織</strong>のプルダウンがあります。変更すると、そのあと<strong>一覧・組織設定・監視画面を開く</strong>まで含めて、その組織のデータだけが対象になります。
            </p>
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90">
              エラーになるときは表示メッセージを確認し、再試行かログアウト後のログインへ進んでください。
            </p>
          </div>

          <p className="pt-4 text-xs text-slate-500 dark:text-slate-400">
            プラットフォーム全体の運用のみ権限により <strong>/admin/platform/orgs</strong> が表示されます。一般の運用では出ません。
          </p>
        </ManualSection>

        <ManualSection id="org-settings" title="3. 組織設定">
          <div className="rounded-lg bg-slate-50/90 dark:bg-slate-800/55 px-4 py-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
            画面：<strong>組織設定</strong>{' '}
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin/org-settings</code>
          </div>
          <ol className="list-decimal list-outside pl-5 space-y-3">
            <li>左メニューまたは ☰ メニューから<strong>組織設定</strong>を開きます。</li>
            <li>
              <strong>ダッシュボードタイトル／サブタイトル</strong>
              ：監視画面の上部に載る名前です。来客向けの表示名になります。
            </li>
            <li>
              <strong>テーマ色（アクセント）</strong>
              ：<code className="text-xs">#RRGGBB</code> 形式です。画面上にカラーピッカーやプリセットがあれば、そこから選んでも問題ありません。
            </li>
            <li>
              <strong>ロゴ</strong>
              ：URL を直接入れる場合と、ブラウザからファイルを<strong>アップロード</strong>できる場合があります。画面上の説明どおり進めます。
            </li>
            <li>
              <strong>自動更新間隔</strong>
              ：監視画面がサーバー経由で BUILDICS から<strong>データを読み込む間隔</strong>
              を決めます。プリセット（1 分〜24 時間など）または自由入力（<strong>最短 1 分〜最大 1440 分の範囲</strong>
              と表示されている場合）は画面の許容値に合わせてください。組織に値を保存すると、公開側の応答にある{' '}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">polling.intervalMs</code>{' '}
              が上書きされます。運用開始時だけ変えればよいときは、この画面で済ませて<strong>保存</strong>してください。
              <strong>自動更新間隔をサーバー既定に戻す</strong>を押すと、組織側の特別設定をやめてサーバー共通の既定に戻ります。
            </li>
            <li>
              <strong>BUILDICS API キー（ある場合のみ）</strong>：組織単位でキーを登録する運用では、入力して<strong>保存</strong>
              します。画面ではマスク表示や末尾のみ表示になっていることがあります。
            </li>
          </ol>
          <p className="rounded-lg bg-amber-50/70 dark:bg-amber-950/35 border border-amber-200/70 dark:border-amber-900/55 px-3 py-2 text-xs mt-3">
            変更を反映するには<strong>画面上の保存</strong>
            が必要です。失敗するときは赤いエリアに理由が書かれているので読み、そのとおり修正してからもう一度保存します。
          </p>
        </ManualSection>

        <ManualSection id="facilities" title="4. 場所（監視地点）">
          <div className="rounded-lg bg-slate-50/90 dark:bg-slate-800/55 px-4 py-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
            画面：<strong>場所を追加・編集</strong>{' '}
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin/facilities</code>
          </div>

          <p className="font-semibold text-slate-900 dark:text-white">ここでやること</p>
          <p>
            「監視画面の<strong>カードひとつ</strong>」の単位になります。<strong>場所を登録するのはまずこちら</strong>です（デバイスは次の章です）。
          </p>

          <ol className="list-decimal list-outside pl-5 space-y-3 mt-3">
            <li>
              メニューからこのページへ来たら、画面上部の入力欄<strong>「新しい場所を登録」</strong>
              で番号や名前などを入力し、問題なければ<strong>登録</strong>クリックです。
              <strong>場所 ID</strong>
              は数値で、過去データやほか組織と<strong>ぶつからない番号</strong>が必要です（画面にも注意が出ます）。
            </li>
            <li>
              <strong>名前</strong>は監視画面の<strong>見出し</strong>
              に使われます。わかりやすい名前にしてください。<strong>表示順</strong>が小さいほど先に並びます。
            </li>
            <li>
              <strong>設置区分</strong>
              と<strong>場種</strong>
              ：それぞれプルダウンで選びます。<strong>設置区分</strong>
              が屋外／屋内のようなイメージ、<strong>場種</strong>が学校・工場などの区分です。<strong>登録後に変更する</strong>場合は一覧のプルダウンからでも直せます。
            </li>
            <li>
              <strong>住所／緯度経度／地図</strong>
              ：任意です。入力すると<strong>気象情報の参照</strong>や画面の詳細情報に効きます。住所から自動で緯度経度が入る<strong>ボタン</strong>があれば、まず試して問題なければそのままで構いません。
            </li>
            <li>
              <strong>設置写真</strong>
              ：一覧の<strong>アップロード</strong>から PNG / JPEG / WebP（目安約 5MB 以下）
              が使えます。監視一覧では名前のそばに小さめ（およそ<strong>58px</strong>
              の幅）できれいに正方形に切りそろえられたサムネイルが出ます。詳細ページでは<strong>およそ最大 270px</strong>{' '}
              のエリアまで拡がり縦長の写真は自動でトリミングされる動きになります。
            </li>
            <li>
              一覧にある<strong>無効／有効</strong>
              ：使わなくなった地点を監視一覧から<strong>見えなくするとき</strong>に使います（データは運用により残る場合があります）。
            </li>
            <li>
              リストの末尾に<strong>次のステップ（手順 2）</strong>
              と<strong>デバイス紐付け</strong>
              のボタンがあります。続けて台帳登録するときは、そちらへ進んで構いません。
            </li>
          </ol>
        </ManualSection>

        <ManualSection id="devices" title="5. デバイス台帳と紐付け">
          <div className="rounded-lg bg-slate-50/90 dark:bg-slate-800/55 px-4 py-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
            画面：<strong>デバイス紐付け</strong>{' '}
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin/devices</code>
          </div>

          <div className="rounded-xl border border-amber-100 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/25 px-4 py-3 text-sm mb-4">
            <strong>事前条件：</strong>
            BUILDICS が発行している<strong>6〜24 桁のデバイス ID（数字のみ）</strong> と、ひとつ上の画面で決めた<strong>場所 ID</strong>{' '}
            が両方わかっているとスムーズです。まだ<strong>場所がゼロ</strong>だと一覧のようにプルダウンが効かず、画面上部にも注意が表示されます。そのときは<strong>場所を登録してからやり直す</strong>か、リスト下の<strong>場所を登録</strong>ボタンで先へ飛んでください。
          </div>

          <p className="font-semibold text-slate-900 dark:text-white">A. ひとつのデバイスを登録するとき（いちばん簡単）</p>
          <ol className="list-decimal list-outside pl-5 space-y-2">
            <li>「登録」をする前に<strong>紐付け場所</strong>のリストで<strong>載せたい場所</strong>が選べる状態にします。</li>
            <li>
              <strong>デバイス ID</strong>
              と<strong>表示名（あれば）</strong>を入力し、<strong>この内容で登録</strong>をクリックします。
            </li>
            <li>
              現場のシール読みなら<strong>QR スキャン</strong>
              が使える環境です（ブラウザのカメラ許可が必要。<strong>https</strong>{' '}
              またはローカルの検証用アドレスに限られます）。
            </li>
            <li>すでに台帳に同じデバイス ID があるときは<strong>だめになります（重複エラー）</strong>。一覧を見直してください。</li>
          </ol>

          <p className="font-semibold text-slate-900 dark:text-white pt-4">B. CSV または JSON でたくさん登録するとき</p>
          <ol className="list-decimal list-outside pl-5 space-y-2">
            <li>「一括登録」を開き<strong>CSV</strong>か<strong>JSON</strong>のタブへ移ります（たいてい<strong>CSV</strong>での利用が楽です）。</li>
            <li>
              テンプレートを<strong>サンプルをダウンロード</strong>して試すか、そのまま表計算ツールへ貼り付けられる<strong>ヘッダー行あり</strong>の状態を作ります（列名には英語だけでなく日本語のゆるい名前も許容されることがあります）。
            </li>
            <li>
              右側の<strong>登録前チェック</strong>まで進み、<strong>行番号付きエラー一覧がゼロ</strong>になれば{' '}
              <strong>この内容で一括登録</strong>または同等の送信ボタンを押します。件数が多いと自動で複数回に分割され、画面上のゲージだけ追えば大丈夫です。
            </li>
          </ol>

          <p className="font-semibold text-slate-900 dark:text-white pt-4">C. 一覧であとから直すとき</p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>紐付け場所</strong>のリストで<strong>ほかの場所 ID に付けかえられます。</strong>
            </li>
            <li>
              「状態」の列には<strong>有効／無効</strong>
              と出ています。<strong>無効</strong>にしたデバイスは監視の対象外の動きになります。
            </li>
          </ul>
        </ManualSection>

        <ManualSection id="platform" title="6. プラットフォーム（管理者のうち superadmin のみ）">
          <div className="rounded-lg bg-slate-50/90 dark:bg-slate-800/55 px-4 py-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
            権限：<strong>superadmin</strong>のみ。ページは{' '}
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin/platform/orgs</code>
          </div>
          <ol className="list-decimal list-outside pl-5 space-y-2">
            <li>
              自分の画面上にプラットフォーム向け項目が<strong>ひとつも無ければ、この章全体を読む必要はありません</strong>
              （一般管理者向けのメニューのみ）。
            </li>
            <li>
              自分の画面上に<strong>プラットフォーム：組織の追加</strong>または左メニューにそれに近い文言があったら、このページへ来ています。<strong>新しいテナント用の組織</strong>{' '}
              をひとそろいで作れる画面です。
            </li>
            <li>
              やることの例：<strong>組織の新規作成</strong>／<strong>スラッグ</strong>など基本情報／その組織の<strong>ユーザー登録や編集</strong>
              （アカウントにより<strong>複数組織</strong>
              が選べます。チェックや既定の操作中の組織は画面上の項目に説明があります）。
            </li>
            <li>公開監視ページの説明リンクが画面内に並ぶことがあります（環境によりドメインは固定されています）。</li>
            <li>権限のない状態でこの URL に直接進むと、案内だけのエラーになります。</li>
          </ol>
        </ManualSection>

        <ManualSection id="monitoring-public" title="7. 公開監視画面（来客向けページの確認）">
          <div className="rounded-lg bg-slate-50/90 dark:bg-slate-800/55 px-4 py-2 text-xs text-slate-600 dark:text-slate-400 mb-3">
            ログイン不要の URL：<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/tenant/&lt;組織スラッグ&gt;</code>
            （ここだけ見ても来客向け説明になります）。
          </div>

          <div className="space-y-3">
            <p>
              <strong>ダッシュボード（一覧）</strong>
              ：カードごとに、現場計測にもとづいて<strong>現場センサーに基づく現在の WBGT（暑さ指数の推定値）</strong>
              や気温・湿度が並びます。これとは別チャンネルで、地点の緯度経度にもとづいた{' '}
              <strong>日本気象協会（JWA）の 1km メッシュによる時別 WBGT 予測（参考）</strong>
              は参考値です（センサー実測とまったく一致するとはかぎません）。画面上は環境により色の帯や折れ線にまとまります。そのうち、<strong>気象庁の地域ヒート注意情報はダッシュボードのカードには出しません。</strong>
              （一覧カードに載っている数値とはレイヤーの違う情報という整理です）。
            </p>
            <p>
              <strong>詳細（地点をひとつ押したとき）</strong>
              ：過去ぶんの実測波形や<strong>時間別</strong>
              のブロックなどがあります。「時間別（デモ・擬似データ・直近6時間）」という見出しはデモ構成のときも出ます。JWA の予測グラフはときに、その実測ブロックより<strong>下側</strong>
              に置かれています。そのほか、気象庁のヒート注意は強調枠でも表示されることがあり、ダッシュボードのカード本丸とは区別されています。
            </p>

            <p className="font-semibold text-slate-900 dark:text-white pt-2">現場での案内につかえるもの（ヘッダー付近）</p>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>
                ヘッダー付近にある<strong>スマホで開く</strong>には、<strong>QR コードまたは URL をコピーする</strong>
                機能があります。そのまま来客のスマートフォンに案内すると、同じ公開監視ページを開けます。管理コンソールのヘッダーにも類似の<strong>監視 QR</strong>{' '}
                が出力されることがあり、そちらは<strong>操作中の組織</strong>
                が切り替わるたび、その組織向け URL になります。
              </li>
              <li>
                <strong>PWA（ホームに追加）</strong>
                ：Chrome／Edge／Android に近いブラウザでは、画面上または下端に<strong>ホーム画面へ追加する案内バナー</strong>
                が現れるときがあります。<strong>iPhone／iPad の Safari は「共有 → ホーム画面に追加」</strong>
                が同じ効果です。<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin</code>
                で管理画面をひらきっぱなしのときは、このバナーを出さないようになっているので、来客向けの監視側だけになります。
              </li>
              <li>「閉じる」を選ぶと、この端末のブラウザではしばらくバナーを再び出さなくなるときがあります。</li>
              <li>
                画面上のヘッダーから<strong>製品の案内</strong>および<strong>管理ログインへのリンク</strong>が使えることがあります（運用サイトの並び）。
              </li>
              <li>フッターのバージョン番号がリビルド済みコードとひもづいて変わっていれば、更新されています。</li>
              <li>設置写真の見え方：<strong>58px</strong> 前後のアイコン並みのサムネ（一覧ページ）および<strong>およそ最大 270px</strong>{' '}
              の広がりぶんでの閲覧（詳細側）だったことは、このマニュアル「場所」章とも一致します。</li>
            </ul>
          </div>
        </ManualSection>

        <ManualSection id="troubleshoot" title="8. うまくいかないとき（チェックリスト）">
          <p className="font-semibold mb-3">症状に当てはまる行だけ拾って順に確認してください。</p>
          <ul className="space-y-3 text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-red-700 dark:text-red-400">401/403</span>
              <span>
                セッション切れまたは権限がありません。<strong>ログアウトしてから再ログイン</strong>
                を試してください。このあとも同じときは運用担当へ伝えます。
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-amber-800 dark:text-amber-400">監視一覧が空／ぐるぐる長い</span>
              <span>
                <strong>デバイス紐付け</strong>
                と<strong>場所 ID</strong>が噛み合っているか確認します（一番多いハズレ：<strong>紐付け忘れ／場が無効化されてるだけ</strong>）。
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-amber-800 dark:text-amber-400">BUILDICS 側だけいじった／ラベルをかえた</span>
              <span>
                台帳の<strong>デバイス ID</strong>{' '}
                がぶれていたら一覧で突き合わせ、追記や更新は<strong>この台帳画面だけ</strong>で足りているか確認します（BUILDICS 側との番号ずれ）。
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-slate-700 dark:text-slate-400">広告ブロック等</span>
              <span>ブラウザ拡張で API が止まっていると管理画面が異常になります。<strong>一旦オフでも試すこと</strong>。</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-slate-700 dark:text-slate-400">開発時のエラーだけ</span>
              <span>
                まれに開発・検証用のときブラウザのコンソールにプロキシ先が届かないログが並び、その環境だけ静的ファイルで最低限の画面になることがあります。本番では API が問題なく応答できる状態まで戻してください。
              </span>
            </li>
          </ul>
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">
            「公開設定の自動更新」をいじっているひとは、自動更新関連の項目は組織設定に{' '}
            <strong>自動更新間隔をサーバー既定に戻す</strong>もあり、その話は「組織設定」につながっている{' '}
            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">polling.intervalMs</code>
            と絡んでいます。このマニュアル上はそこへ飛んだあと環境共通のヘルパを見てください。
          </p>
        </ManualSection>
      </div>
    </PublicDocsLayout>
  );
}
