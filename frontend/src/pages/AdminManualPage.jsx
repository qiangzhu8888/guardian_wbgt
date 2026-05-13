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

export default function AdminManualPage() {
  return (
    <PublicDocsLayout
      title="管理コンソール操作マニュアル"
      description="BUILDICS-GUARDIAN の管理画面（ログイン後）の画面遷移と、よく使う操作をまとめています。用語は画面上の表記に合わせています。"
    >
      <div className="surface-card p-5 sm:p-6 mb-8 space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <p className="font-semibold text-slate-900 dark:text-white">このマニュアルの対象</p>
        <ul className="list-disc list-outside pl-5 space-y-1 text-sm">
          <li>
            ログインページ: <code className="text-xs bg-slate-200/80 dark:bg-slate-800 px-1 rounded">/admin/login</code>
          </li>
          <li>組織の管理者（admin）およびプラットフォーム管理者（superadmin）</li>
        </ul>
      </div>

      <div className="space-y-10 max-w-3xl">
        <ManualSection id="login" title="1. ログイン・ログアウト">
          <ol className="list-decimal list-outside pl-5 space-y-2">
            <li>
              ブラウザで <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin/login</code>{' '}
              を開きます。
            </li>
            <li>運用担当から案内されたメールアドレス・パスワードを入力し、送信します。</li>
            <li>
              成功すると <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin</code>{' '}
              の管理メニューへ移動します。
            </li>
            <li>
              画面右上の <strong>ログアウト</strong> でセッションを終了できます。エラーで再ログインが必要な場合も、いったんログアウトしてから試します。
            </li>
          </ol>
        </ManualSection>

        <ManualSection id="menu" title="2. 管理メニュー（全体の流れ）">
          <p>
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin</code>{' '}
            では、監視ダッシュボードに載せる <strong>場所</strong> と <strong>デバイス紐付け</strong> を管理します。
          </p>
          <p className="font-medium text-slate-800 dark:text-slate-200">推奨の初回手順</p>
          <ol className="list-decimal list-outside pl-5 space-y-2">
            <li>
              <strong>組織設定</strong>（ダッシュボードのタイトル、テーマ色、ロゴ、必要に応じて BUILDICS API キー）
            </li>
            <li>
              <strong>場所を追加・編集</strong>（監視地点の登録と表示順）
            </li>
            <li>
              <strong>デバイスと紐付け</strong>（BUILDICS の deviceId を場所に結び付け）
            </li>
          </ol>
          <p>
            ヘッダー右の <strong>監視画面を開く</strong> は、ログイン中のユーザーが属する組織の公開ダッシュボードへ遷移します。
          </p>
          <p>
            アカウントが <strong>複数の組織に所属している</strong>場合、ヘッダーに{' '}
            <strong>操作中の組織</strong>
            が表示されます。プルダウンで別の組織に切り替えると、それ以降の場所・台帳・組織設定の対象が切り替わります。「監視画面を開く」も、選択中の組織の公開 URL に合わせて遷移します。切り替えに失敗したときは画面上のエラーを確認し、再試行またはログアウト後のログインを試してください。
          </p>
        </ManualSection>

        <ManualSection id="org-settings" title="3. 組織設定">
          <p>
            メニュー <strong>組織設定</strong>（<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin/org-settings</code>
            ）では、次を設定します。
          </p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>ダッシュボードタイトル・サブタイトル</strong> — 監視画面ヘッダーに表示されます。
            </li>
            <li>
              <strong>テーマ色（アクセント）</strong> — <code className="text-xs">#RRGGBB</code>{' '}
              形式で指定します。カラーピッカーやプリセットが利用できる場合は画面の案内に従います。
            </li>
            <li>
              <strong>ロゴ</strong> — URL の直接入力や、ファイルからアップロードできる場合は画面上の手順で更新します。
            </li>
            <li>
              <strong>BUILDICS API キー（任意）</strong> — 組織単位でキーを登録する運用の場合、入力して保存します。登録済みかどうかはマスク表示や末尾数桁のヒントで確認できることがあります。
            </li>
          </ul>
          <p>入力後は画面の <strong>保存</strong> ボタンでサーバーへ反映します。エラー内容は画面上のメッセージを確認してください。</p>
        </ManualSection>

        <ManualSection id="facilities" title="4. 場所（監視地点）">
          <p>
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin/facilities</code>{' '}
            で、ダッシュボード上のカード単位となる場所を管理します。
          </p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>場所 ID</strong> は数値です。既存のデバイス紐付けと整合する ID を使います。
            </li>
            <li>
              <strong>名前</strong> が監視画面での表示名になります。
            </li>
            <li>
              <strong>表示順</strong> でカードの並びを調整します。
            </li>
            <li>
              <strong>設置区分</strong>（屋外／屋内など）を選べます。公開設定にも含まれ、将来の解析・モデル切替などの参照用です。一覧のプルダウンでもあとから変更できます。
            </li>
            <li>
              <strong>場種</strong>（学校・病院・工場など）を選べます。<strong>設置区分（屋内／屋外）</strong>
              とは別の軸です。公開設定にも含まれ、モデル／AI の条件やレポート区分に利用できます。一覧からも変更できます。
            </li>
            <li>
              <strong>住所</strong> は任意です。
            </li>
            <li>
              <strong>設置写真</strong>（任意）は一覧の <strong>アップロード</strong> で PNG / JPEG / WebP（約 5MB
              まで）を登録できます。Firebase Storage が有効である必要があります。ダッシュボードのカードや詳細にも表示されます。
            </li>
            <li>
              一覧の <strong>無効化／有効化</strong> で、その場所を監視画面から非表示にできます（無効な場所は一覧に出ません）。
            </li>
          </ul>
        </ManualSection>

        <ManualSection id="devices" title="5. デバイス台帳と紐付け">
          <p>
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin/devices</code>{' '}
            で、BUILDICS の <strong>デバイス ID</strong>（6〜24 桁の数字）を <strong>場所 ID</strong> に紐付けます。
          </p>
          <p className="font-medium text-slate-800 dark:text-slate-200">1 件ずつ登録</p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>デバイス ID、紐付け場所、表示名（任意）を入力して登録します。</li>
            <li>
              <strong>QR スキャン</strong> でカメラから ID を入力欄へ取り込めます（HTTPS または localhost、カメラ許可が必要です）。
            </li>
            <li>既存と重複するデバイス ID はエラーになるため、台帳一覧を確認します。</li>
          </ul>
          <p className="font-medium text-slate-800 dark:text-slate-200">一括登録（CSV / JSON）</p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>CSV</strong> タブでは、テンプレートに沿った列（1 行目はヘッダー）を貼り付けるか、ファイルをドロップして取り込みます。
            </li>
            <li>検証エラーがある場合は、画面の指摘リストで行番号と内容を確認して修正します。</li>
            <li>
              <strong>JSON</strong> はオブジェクトの配列形式です。件数が多い場合は自動的に分割送信されることがあります。
            </li>
          </ul>
          <p className="font-medium text-slate-800 dark:text-slate-200">登録済み一覧</p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>紐付け場所</strong> のプルダウンで、有効なデバイスの場所をあとから変更できます。
            </li>
            <li>
              <strong>状態</strong> 列で有効・無効を確認できます。無効なデバイスは監視対象から外れる表示になります。
            </li>
          </ul>
        </ManualSection>

        <ManualSection id="platform" title="6. プラットフォーム（superadmin のみ）">
          <p>
            ロールが <strong>superadmin</strong> の場合のみ、<strong>プラットフォーム：組織の追加</strong>（
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin/platform/orgs</code>
            ）がメニューに表示されます。
          </p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>新しいテナント（組織）の作成と、スラッグなどの基本情報の登録</li>
            <li>
              組織に紐づく管理者ユーザーの登録・編集・削除。ユーザーごとに、所属する複数組織（チェックボックス）や、ログイン直後などに既定とする<strong>操作中の組織</strong>を指定できる場合があります。保存時は画面上の項目に従ってください。
            </li>
            <li>各組織の公開監視 URL の案内表示（環境変数でオリジンが固定されている場合あり）</li>
          </ul>
          <p>権限がないユーザーが URL を直接開いた場合は、拒否メッセージが表示されます。</p>
        </ManualSection>

        <ManualSection id="monitoring-public" title="7. 公開監視画面（エンドユーザー向け・確認）">
          <p>
            ログインなしで閲覧できる監視ページは{' '}
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">
              /tenant/&lt;組織スラッグ&gt;
            </code>{' '}
            で開きます。ダッシュボードでは場所ごとに <strong>現在の WBGT</strong>
            と気象・気温などが表示されます。詳細画面ではグラフや時間軸がある場合があります（環境によりデモ用の項目を含むことがあります）。
          </p>
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>PWA／ホーム画面への追加：</strong>
              Chrome・Edge・Android に近い環境では、画面下部に案内バナーが表示され、アプリとしてインストールできる場合があります。
              iPhone／iPad（Safari）では案内どおり<strong>共有 → ホーム画面に追加</strong>としてください。管理者向けパス{' '}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/admin</code>
              では案内バナーは出ません。
            </li>
            <li>
              「閉じる」を選ぶと、その端末では一定期間（約 30 日）バナーが再表示されないことがあります。
            </li>
            <li>
              <strong>製品ページ</strong> と <strong>管理</strong> へのリンクは監視ヘッダーから利用できます。
            </li>
            <li>フッターのバージョン表記はリリース単位と一致します（更新履歴は /changelog を参照）</li>
          </ul>
        </ManualSection>

        <ManualSection id="troubleshoot" title="8. うまくいかないとき">
          <ul className="list-disc list-outside pl-5 space-y-2">
            <li>
              <strong>401 / 403</strong> や「セッション切れ」の挙動 → ログアウト後に再ログインします。
            </li>
            <li>
              監視画面にデータが出ない → デバイスが正しい <strong>場所 ID</strong> に紐付いているか、場所が無効化されていないかを確認します。
            </li>
            <li>
              BUILDICS 側のデバイス ID や現場構成を変更した場合 → 台帳の ID と突合し、必要なら紐付けを更新します。
            </li>
            <li>
              ブラウザの拡張機能やネットワークフィルタで API がブロックされていないか確認します。
            </li>
          </ul>
        </ManualSection>
      </div>
    </PublicDocsLayout>
  );
}
