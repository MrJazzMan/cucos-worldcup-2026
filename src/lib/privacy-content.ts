export type PrivacySection = {
  heading: string;
  paragraphs: string[];
};

export type PrivacyContent = {
  title: string;
  updated: string;
  intro: string;
  sections: PrivacySection[];
  contact: string;
};

export const PRIVACY: Record<"pt" | "en", PrivacyContent> = {
  pt: {
    title: "Política de Privacidade",
    updated: "Última actualização: 16 de Junho de 2026",
    intro:
      "O Cucos WC26 (wc26.pt) respeita a tua privacidade. Esta política explica que dados recolhemos, para que fins e quais os teus direitos ao abrigo do RGPD.",
    sections: [
      {
        heading: "Responsável pelo tratamento",
        paragraphs: [
          "Responsável: Miguel Garcia (Cuco Enterprise).",
          "Contacto: miguelopesgarcia@gmail.com",
          "Site: https://wc26.pt",
        ],
      },
      {
        heading: "Dados que recolhemos",
        paragraphs: [
          "Conta Google: ao iniciares sessão, recebemos o teu e-mail, nome e foto de perfil via Google OAuth (gerido pelo Supabase Auth).",
          "Perfil: nome de exibição e localização que introduzes voluntariamente.",
          "Preferências: equipas favoritas, definições de notificações e tema/idioma/fuso horário.",
          "Técnicos: dados de sessão (cookies) necessários para manter o login.",
          "Estatísticas: se aceitares cookies, o Google Analytics regista páginas visitadas, dispositivo e localização aproximada (anonimizada).",
          "Publicidade: se aceitares cookies, o Google AdSense pode usar cookies para mostrar anúncios relevantes.",
        ],
      },
      {
        heading: "Finalidade e base legal",
        paragraphs: [
          "Prestação do serviço (jogos, TV, favoritos, notificações) — execução de contrato / interesse legítimo.",
          "Autenticação — execução de contrato.",
          "Analytics e publicidade — consentimento (banner de cookies). Podes recusar sem perder acesso ao site.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "Essenciais: sessão de login (Supabase), preferências de tema e consentimento.",
          "Opcionais (só com consentimento): Google Analytics (_ga, _gid…) e Google AdSense.",
          "Podes alterar a escolha apagando o item «cucos-cookie-consent» no armazenamento local do browser e recarregando a página.",
        ],
      },
      {
        heading: "Subcontratantes",
        paragraphs: [
          "Supabase — base de dados e autenticação (UE/US, conforme política Supabase).",
          "Vercel — alojamento e analytics de performance.",
          "Google — Analytics, AdSense e OAuth.",
          "API-Football — dados públicos de jogos (sem dados pessoais teus).",
        ],
      },
      {
        heading: "Conservação",
        paragraphs: [
          "Dados de conta: enquanto mantiveres conta activa. Podes pedir eliminação.",
          "Logs e analytics: conforme políticas Google/Vercel (tipicamente 14–26 meses).",
        ],
      },
      {
        heading: "Os teus direitos (RGPD)",
        paragraphs: [
          "Tens direito a aceder, rectificar, apagar, limitar, opor-te e portar os teus dados.",
          "Podes retirar o consentimento para cookies a qualquer momento.",
          "Para exercer direitos: miguelopesgarcia@gmail.com",
          "Podes apresentar reclamação à CNPD (www.cnpd.pt).",
        ],
      },
    ],
    contact:
      "Dúvidas sobre privacidade? Escreve para miguelopesgarcia@gmail.com",
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: 16 June 2026",
    intro:
      "Cucos WC26 (wc26.pt) respects your privacy. This policy explains what data we collect, why, and your rights under GDPR.",
    sections: [
      {
        heading: "Data controller",
        paragraphs: [
          "Controller: Miguel Garcia (Cuco Enterprise).",
          "Contact: miguelopesgarcia@gmail.com",
          "Website: https://wc26.pt",
        ],
      },
      {
        heading: "Data we collect",
        paragraphs: [
          "Google account: when you sign in, we receive your email, name and profile photo via Google OAuth (Supabase Auth).",
          "Profile: display name and location you provide voluntarily.",
          "Preferences: favourite teams, notification settings, and theme/language/time zone.",
          "Technical: session cookies required to keep you logged in.",
          "Analytics: if you accept cookies, Google Analytics records pages visited, device and approximate location (anonymised).",
          "Advertising: if you accept cookies, Google AdSense may use cookies to show relevant ads.",
        ],
      },
      {
        heading: "Purpose and legal basis",
        paragraphs: [
          "Service delivery (matches, TV, favourites, notifications) — contract / legitimate interest.",
          "Authentication — contract.",
          "Analytics and advertising — consent (cookie banner). You can decline without losing access.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "Essential: login session (Supabase), theme and consent preferences.",
          "Optional (with consent only): Google Analytics (_ga, _gid…) and Google AdSense.",
          "You can change your choice by clearing «cucos-cookie-consent» in browser local storage and reloading.",
        ],
      },
      {
        heading: "Processors",
        paragraphs: [
          "Supabase — database and authentication.",
          "Vercel — hosting and performance analytics.",
          "Google — Analytics, AdSense and OAuth.",
          "API-Football — public match data (no personal data).",
        ],
      },
      {
        heading: "Retention",
        paragraphs: [
          "Account data: while your account is active. You may request deletion.",
          "Logs and analytics: per Google/Vercel policies (typically 14–26 months).",
        ],
      },
      {
        heading: "Your rights (GDPR)",
        paragraphs: [
          "You have the right to access, rectify, erase, restrict, object and port your data.",
          "You may withdraw cookie consent at any time.",
          "To exercise rights: miguelopesgarcia@gmail.com",
          "You may lodge a complaint with your supervisory authority.",
        ],
      },
    ],
    contact:
      "Privacy questions? Email miguelopesgarcia@gmail.com",
  },
};
