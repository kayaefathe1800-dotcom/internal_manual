import { LoginForm } from "../../components/login-form";

type Props = {
  searchParams: Promise<{
    redirect?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/";

  return (
    <main className="portal-shell login-shell">
      <section className="login-card">
        <p className="eyebrow">社員ログイン</p>
        <h1>社内ナレッジポータルにログイン</h1>
        <p>管理者は資料のアップロード・閲覧・削除を行えます。一般社員は検索と閲覧のみ利用できます。</p>

        <LoginForm redirectTo={redirectTo} />

        <div className="login-hints">
          <div className="hint-box">
            <strong>一般社員</strong>
            <p className="form-help">employee@example.co.jp / employee123</p>
          </div>
          <div className="hint-box">
            <strong>管理者</strong>
            <p className="form-help">admin@example.co.jp / admin123</p>
          </div>
        </div>
      </section>
    </main>
  );
}
