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
      // A preferência é apenas uma conveniência visual; o OAuth continua normal.
    }
    window.location.assign(getLoginUrl());
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061A33] text-white">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#18B6B2]/20 blur-3xl" />
      <div className="absolute -bottom-48 -right-24 h-[34rem] w-[34rem] rounded-full bg-[#6D4AFF]/25 blur-3xl" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10 lg:px-12">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-24">
          <section className="hidden lg:block">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-3 shadow-2xl shadow-black/20">
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
                <p className="text-sm font-semibold uppercase tracking-[.28em] text-cyan-200">
                  Systemsat
                </p>
                <p className="mt-1 text-sm text-slate-300">Customer Success</p>
              </div>
            </div>

            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-100/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" /> Central de experiência
            </p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-tight text-white xl:text-6xl">
              Sucesso do cliente começa com uma visão clara.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Acompanhe a jornada, os marcos, a saúde dos clientes e as ações do
              time de CS em um único painel de gestão.
            </p>

            <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-3">
              {[
                ["Acompanhe", "cada etapa"],
                ["Antecipe", "riscos"],
                ["Evolua", "com dados"],
              ].map(([title, text]) => (
                <div key={title} className="border-l border-white/20 pl-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-2.5">
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
                <p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-200">
                  Systemsat
                </p>
                <p className="text-xs text-slate-300">Customer Success</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/[.97] p-7 text-slate-900 shadow-2xl shadow-black/30 sm:p-9">
              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F8F7] text-[#0C8F8B]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0C8F8B]">
                  Bem-vindo ao painel
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#061A33]">
                  Entre para continuar
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Use sua conta Google autorizada para acessar a operação de CS.
                </p>
              </div>

              <button
                type="button"
                onClick={startLogin}
                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#0B5CAD] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0B5CAD]/20 transition hover:bg-[#084B8D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0B5CAD]/25 active:scale-[.99]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0B5CAD]">
                  G
                </span>
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
                <span>Manter conectado</span>
              </label>

              <div className="mt-8 border-t border-slate-200 pt-5 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0C8F8B]" />
                  Acesso protegido e restrito a usuários liberados
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Painel de Gestão CS · Systemsat
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
