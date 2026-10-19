import { useState } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { getLoginUrl } from "@/const";

const LOGO_SRC = "/manus-storage/systemsat-logo-transparent_6314d1c3.png";
const LOGO_FALLBACK =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663388902916/sMtZFYeYnVwpyXZR.png";

export default function LoginScreen() {
  const [keepConnected, setKeepConnected] = useState(() => {
    try {
      return localStorage.getItem("cs-keep-connected") !== "false";
    } catch {
      return true;
    }
  });

  const startLogin = () => {
    try {
      localStorage.setItem("cs-keep-connected", String(keepConnected));
    } catch {
      // A preferência não impede o fluxo OAuth caso o armazenamento esteja bloqueado.
    }
    window.location.assign(getLoginUrl());
  };

  return (
    <main className="login-shell relative min-h-screen overflow-hidden bg-[#061A33] text-white">
      <div className="login-tech-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="login-scanline pointer-events-none absolute inset-x-0 top-0 h-px" aria-hidden="true" />
      <div className="login-orbit login-orbit-one pointer-events-none" aria-hidden="true" />
      <div className="login-orbit login-orbit-two pointer-events-none" aria-hidden="true" />
      <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[#11B8B2]/10 blur-3xl" />
      <div className="absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full bg-[#6D4AFF]/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-8 sm:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-20">
          <section className="hidden lg:block">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-2.5 shadow-lg shadow-black/20">
                <img
                  src={LOGO_SRC}
                  alt="Systemsat"
                  className="max-h-full max-w-full object-contain"
                  onError={event => {
                    event.currentTarget.src = LOGO_FALLBACK;
                  }}
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.25em] text-cyan-200">
                  Systemsat
                </p>
                <p className="mt-0.5 text-sm text-slate-400">Customer Success</p>
              </div>
            </div>
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-cyan-200">
              <Sparkles className="h-4 w-4" /> Gestão de experiência do cliente
            </p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
              Uma visão mais clara para cuidar melhor de cada cliente.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Marcos, Ongoing, saúde da carteira e indicadores de CS em um só lugar.
            </p>
            <div className="mt-8 flex items-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Dados conectados</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" /> Operação integrada</span>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[430px]">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-2.5">
                <img
                  src={LOGO_SRC}
                  alt="Systemsat"
                  className="max-h-full max-w-full object-contain"
                  onError={event => {
                    event.currentTarget.src = LOGO_FALLBACK;
                  }}
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-200">Systemsat</p>
                <p className="text-xs text-slate-400">Customer Success</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white p-7 text-slate-900 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-9">
              <div className="mb-8">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F8F7] text-[#0C8F8B]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0C8F8B]">Painel de Gestão CS</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#061A33]">Bem-vindo de volta</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">Entre com sua conta autorizada para continuar.</p>
              </div>

              <button
                type="button"
                onClick={startLogin}
                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#0B5CAD] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0B5CAD]/20 transition hover:bg-[#084B8D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0B5CAD]/25 active:scale-[.99]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0B5CAD]">G</span>
                Entrar com Google
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={keepConnected}
                  onChange={event => setKeepConnected(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#0B5CAD]"
                />
                Manter conectado
              </label>

              <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0C8F8B]" />
                Acesso protegido para usuários liberados
              </div>
            </div>
            <p className="mt-5 text-center text-[11px] text-slate-500">Systemsat · Customer Success</p>
          </section>
        </div>
      </div>
    </main>
  );
}
