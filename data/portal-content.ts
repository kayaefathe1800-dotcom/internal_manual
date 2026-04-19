import type { Announcement, PortalDocument } from "../types/portal";

export const announcements: Announcement[] = [
  {
    id: "notice-1",
    label: "総務",
    title: "就業規則 2026年4月版を公開しました",
    body: "育児・介護休業、在宅勤務時の申請フロー、通勤費精算の追記を反映しています。",
    publishedAt: "2026-04-18"
  },
  {
    id: "notice-2",
    label: "人事",
    title: "有給休暇の申請期限に関するFAQを更新",
    body: "前日申請が難しいケースの代替手順を追記しました。検索ワードは「有給」「有休」どちらでも見つかります。",
    publishedAt: "2026-04-15"
  },
  {
    id: "notice-3",
    label: "情シス",
    title: "入社時セットアップ手順の PDF 添付を追加",
    body: "スマホでも確認しやすいよう、本文と PDF を並行して閲覧できるようにしました。",
    publishedAt: "2026-04-11"
  }
];

export const popularQueries = [
  "有給の取り方",
  "交通費の精算方法",
  "PCセットアップ",
  "在宅勤務の申請",
  "遅刻したときの連絡"
];

export const portalDocuments: PortalDocument[] = [
  {
    id: "manual-onboarding",
    slug: "employee-onboarding",
    category: "manual",
    title: "入社初日のセットアップ手順",
    summary: "PC の初期設定、社内ツールへのログイン、セキュリティ設定までをまとめた入社マニュアルです。",
    body:
      "入社初日は、貸与 PC の受け取り後にアカウント有効化を行います。最初に Google Workspace と Slack にログインし、次に 1Password と VPN を設定してください。交通費精算や勤怠登録に使う社内ポータルも、このタイミングで初回ログインを済ませます。二段階認証の設定が終わったら、情シスチェックリストに沿ってウイルス対策ソフトと OS 更新を確認します。通勤費の申請が必要な場合は、総務申請メニューから定期区間を登録してください。",
    tags: ["入社", "PC", "セットアップ", "情シス", "通勤費"],
    updatedAt: "2026-04-11",
    attachmentTitle: "入社初日セットアップ資料",
    attachmentUrl: "/samples/onboarding-guide.pdf"
  },
  {
    id: "manual-remote",
    slug: "remote-work-flow",
    category: "manual",
    title: "在宅勤務の申請と当日の流れ",
    summary: "在宅勤務の申請期限、朝会前の連絡、勤怠打刻、備品持ち出しのルールをまとめています。",
    body:
      "在宅勤務を行う場合は、前営業日の 17 時までにワークフローから申請してください。急な事情で当日切り替える場合は、上長とチームチャンネルへの連絡を優先します。始業時には勤怠システムで打刻し、終業時には業務メモを残してください。モニターなどを持ち出す場合は備品貸出申請が必要です。交通費が発生しない日の通勤費は自動で控除されるため、精算は不要です。",
    tags: ["在宅勤務", "申請", "勤怠", "備品", "通勤費"],
    updatedAt: "2026-04-10"
  },
  {
    id: "manual-expense",
    slug: "commuting-expense-claim",
    category: "manual",
    title: "交通費・通勤費の精算方法",
    summary: "通勤費の定期申請、立替交通費の精算、領収書添付ルールを説明します。",
    body:
      "交通費の精算は、定期区間の登録と立替精算で手順が分かれます。毎月の通勤費は総務申請から登録し、ルート変更がある場合は差額の理由を入力してください。出張や顧客訪問などで発生した立替交通費は、経費精算メニューから申請します。IC 利用明細または領収書 PDF を添付し、申請理由に訪問先を記入してください。検索では「交通費」「通勤費」どちらでも同じ内容を見つけられます。",
    tags: ["交通費", "通勤費", "経費", "精算", "領収書"],
    updatedAt: "2026-04-09",
    attachmentTitle: "交通費精算ガイド",
    attachmentUrl: "/samples/expense-guide.pdf"
  },
  {
    id: "rule-paid-leave",
    slug: "paid-leave-policy",
    category: "rule",
    title: "有給休暇の取得ルール",
    summary: "有給休暇の付与日数、申請期限、半日単位利用、当日申請時の連絡方法を掲載しています。",
    body:
      "有給休暇は入社日に応じて付与されます。原則として取得希望日の前営業日までに申請を行ってください。やむを得ない事情で当日申請となる場合は、始業前に上長へ連絡し、その後ワークフローを登録します。半日単位での取得も可能です。本文や検索では有給、有休、休暇申請のいずれでも関連情報がヒットするよう同義語辞書を用意しています。",
    tags: ["有給", "有休", "休暇", "申請", "勤怠"],
    updatedAt: "2026-04-18",
    attachmentTitle: "就業規則 第5章 休暇規程",
    attachmentUrl: "/samples/leave-policy.pdf"
  },
  {
    id: "rule-late-contact",
    slug: "late-arrival-contact",
    category: "rule",
    title: "遅刻・早退時の連絡ルール",
    summary: "遅刻、早退、欠勤時の連絡先、報告タイミング、勤怠修正申請の流れをまとめています。",
    body:
      "遅刻や早退が発生する場合は、始業前または判明時点で上長とチームチャットに連絡してください。欠勤となる場合は、人事にもあわせて連絡します。勤怠打刻に差異が出た場合は、勤怠修正申請を翌営業日までに提出してください。体調不良による休みも本ルールに準じます。",
    tags: ["遅刻", "早退", "欠勤", "勤怠", "連絡"],
    updatedAt: "2026-04-08"
  }
];
