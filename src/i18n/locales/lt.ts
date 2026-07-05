const lt = {
  // Nav
  nav_feed: 'Srautas',
  nav_changelog: 'Atnaujinimai',
  nav_myposts: 'Mano įrašai',
  nav_profile: 'Profilis',
  nav_users: 'Vartotojai',
  nav_signin: 'Prisijungti',
  nav_signout: 'Atsijungti',
  nav_back: 'Atgal',
  nav_about: 'Apie šį puslapį',
  nav_search: 'Vartotojų paieška',
  nav_logged_in_as: (u: string) => `Prisijungta kaip: ${u}`,

  // Home
  home_tagline: 'Centralizuota vieta GD Lietuvos bendruomenei',
  home_freepost_desc: 'Kelk nuotraukas ir kvailiok su draugais.',

  // About
  about_title: 'Apie šį puslapį',
  about_tab_about: 'Apie',
  about_tab_credits: 'Padėkos',
  about_credit_dev: 'Kūrėjas ir programavimas',
  about_credit_icon: 'Svetainės ikona',
  about_credit_ideas: 'Svetainės funkcijų idėjos',
  about_body:
    'GDLT Hub — centralizuota vieta Geometry Dash Lietuvos bendruomenei. Iš čia gali patekti į įvairius bendruomenei sukurtus įrankius ir erdves — pradedant nuo freepost, o daugiau bus netrukus.',

  // User search
  user_search_placeholder: 'Ieškoti vartotojų…',
  user_search_none: (q: string) => `Nėra vartotojų pagal „${q}“`,

  // Site status
  site_frozen_banner: 'Svetainė šiuo metu užšaldyta. Įrašymas ir sąveikos išjungtos.',

  // Common
  loading: 'Kraunama…',
  cancel: 'Atšaukti',
  delete: 'Ištrinti',
  deleting: 'Trinama…',
  edit: 'Redaguoti',
  save: 'Išsaugoti',

  // Feed
  feed_empty: 'Dar nėra įrašų. Būk pirmas!',
  feed_search_placeholder: 'Ieškoti pagal pavadinimą…',
  feed_sort_label: 'Rūšiuoti:',
  feed_sort_new: 'Nauji',
  feed_sort_top: 'Populiarūs',
  feed_video_badge: '▶ video',
  feed_loading_more: 'Kraunama…',
  feed_no_more: 'Daugiau įrašų nėra',
  feed_pin: 'Prisegti',
  feed_unpin: 'Atsegti',
  feed_new_available: '↑ Nauji įrašai — spustelėkite norėdami atnaujinti',

  // Post modal
  post_no_comments: 'Komentarų dar nėra.',
  post_comment_count: (n: number) => {
    if (n % 10 === 1 && n % 100 !== 11) return `${n} komentaras`
    if (n % 10 >= 2 && n % 10 <= 9 && (n % 100 < 10 || n % 100 >= 20)) return `${n} komentarai`
    return `${n} komentarų`
  },
  post_comment_delete: 'Ištrinti',
  post_frozen_comments: 'Svetainė užšaldyta. Komentarai išjungti.',
  post_comment_placeholder: 'Parašykite komentarą…',
  post_comment_posting: 'Siunčiama…',
  post_comment_button: 'Komentuoti',

  // New post modal
  new_post_title: 'Naujas įrašas',
  new_post_drop_hint: 'Paspauskite, kad pasirinktumėte paveikslėlį ar vaizdo įrašą',
  new_post_title_placeholder: 'Pavadinimas',
  new_post_desc_placeholder: 'Aprašymas (neprivaloma)',
  new_post_uploading: 'Įkeliama…',
  new_post_cooldown: (s: number) => `Palaukite ${s}s`,
  new_post_submit: 'Kurti naują įrašą',
  new_post_err_size: 'Failas turi būti ne didesnis nei 15MB.',
  new_post_err_dimensions: 'Paveikslėlis turi būti ne didesnis nei 5000×5000 pikselių.',
  new_post_err_upload: 'Įkėlimas nepavyko',

  // Edit post modal
  edit_post_title: 'Redaguoti įrašą',
  edit_post_saving: 'Išsaugoma…',
  edit_post_save: 'Išsaugoti pakeitimus',
  edit_post_delete: 'Ištrinti įrašą',
  edit_post_confirm: 'Ar tikrai?',
  edit_post_err_update: 'Atnaujinti nepavyko',
  edit_post_err_delete: 'Ištrinti nepavyko',

  // Auth page
  auth_signin_title: 'Prisijungti',
  auth_signup_title: 'Sukurti paskyrą',
  auth_username_placeholder: 'Vartotojo vardas',
  auth_password_placeholder: 'Slaptažodis',
  auth_loading: 'Kraunama…',
  auth_signin_button: 'Prisijungti',
  auth_signup_button: 'Registruotis',
  auth_no_account: 'Neturite paskyros? ',
  auth_has_account: 'Jau turite paskyrą? ',
  auth_go_signup: 'Registruotis',
  auth_go_signin: 'Prisijungti',
  auth_err_generic: 'Kažkas nepavyko',
  auth_err_username_taken: 'Toks vartotojo vardas jau užimtas.',

  // My posts
  myposts_empty: 'Dar nieko nepaskelbėte.',

  // Users page
  users_site_frozen: 'Svetainė užšaldyta',
  users_site_active: 'Svetainė aktyvi',
  users_frozen_desc: 'Neadministratoriai negali sąveikauti su svetaine.',
  users_active_desc: 'Visi vartotojai gali skelbti, komentuoti ir reaguoti.',
  users_unfreeze: 'Atšaldyti',
  users_freeze: 'Užšaldyti svetainę',
  users_count: (n: number) => `${n} paskyra${n === 1 ? '' : n >= 10 && n <= 20 ? '' : n % 10 === 1 ? '' : (n % 10 >= 2 && n % 10 <= 9) ? 'os' : ''}`,
  users_you: '(tu)',
  users_joined: (date: string) => `Prisijungė ${date}`,
  users_ban: 'Užblokuoti',
  users_unban: 'Atblokuoti',
  users_search_placeholder: 'Ieškoti naudotojų pagal vardą…',
  users_roles: 'Rolės',

  // Notifications
  notif_button: '🔔 Pranešimai',
  notif_panel_title: 'Pranešimai',
  notif_mark_read: 'Pažymėti visus skaitytais',
  notif_clear: 'Išvalyti viską',
  notif_empty: 'Pranešimų dar nėra.',
  notif_commented_on: ' pakomentavo įraše ',
  notif_mentioned_in: ' paminėjo jus įraše ',

  // Changelog
  changelog_title: 'Atnaujinimai',
  changelog_current: (v: string) => `dabartinė: ${v}`,

  // Profile
  profile_not_found: 'Vartotojas nerastas.',
  profile_joined: (date: string) => `Prisijungė ${date}`,
  profile_about_title: 'Apie mane',
  profile_no_about: 'Šis vartotojas dar nieko apie save neparašė.',
  profile_about_placeholder: 'Papasakokite apie save…',
  profile_edit_picture: 'Keisti nuotrauką',
  profile_uploading: 'Įkeliama…',
  profile_save: 'Išsaugoti',
  profile_saving: 'Išsaugoma…',
  profile_saved: 'Išsaugota',
  profile_your_profile: 'Tai jūsų profilis',
  profile_name_edit: 'Keisti rodomą vardą',
  profile_preview: 'Peržiūrėti kaip lankytojas',
  profile_preview_exit: 'Baigti peržiūrą',
  profile_preview_hint: 'Pažiūrėkite, kaip jūsų profilį mato kiti.',
  profile_preview_banner: 'Peržiūra — taip jūsų profilį mato lankytojai.',
  profile_posts_title: 'Įrašai',
  profile_posts_empty: 'Įrašų dar nėra.',
  profile_roles_manage: 'Tvarkyti roles',
  profile_roles_hint: 'Tik administratoriui. Spustelėkite rolę, kad ją priskirtumėte ar pašalintumėte šiam naudotojui.',

  // Profile — AREDL statistika
  aredl_title: 'AREDL statistika',
  aredl_view: 'Žiūrėti AREDL',
  aredl_points: 'Taškai',
  aredl_extremes: 'Extreme demonai',
  aredl_global: 'Pasaulyje',
  aredl_country: 'Šalyje',
  aredl_rank_points: 'Taškai',
  aredl_rank_demons: 'Demonai',
  aredl_hardest: 'Sunkiausias demonas',
  aredl_no_records: 'Kol kas nėra įveiktų.',

  // Profile — Geometry Dash statistika
  gd_title: 'Geometry Dash',
  gd_view: 'Žiūrėti GDBrowser',
  gd_stars: 'Žvaigždės',
  gd_moons: 'Mėnuliai',
  gd_demons: 'Demonai',
  gd_secret_coins: 'Slaptos monetos',
  gd_user_coins: 'Vartotojo monetos',
  gd_diamonds: 'Deimantai',
  gd_creator_points: 'Kūrėjo taškai',
  gd_global_rank: 'Vieta pasaulyje',
  gd_username_label: 'GD vartotojo vardas',
  gd_username_placeholder: 'Jūsų žaidimo vartotojo vardas',
  gd_username_hint: 'Susiekite savo Geometry Dash paskyrą pagal žaidimo vartotojo vardą. Jūsų GD profilio socialinėse nuorodose turi būti nurodytas jūsų Discord vardas, kad patvirtintume tapatybę. Palikite tuščią ir išsaugokite, kad atsietumėte.',
  gd_verify_failed: (handle: string) => `Nepavyko patvirtinti tapatybės: šiame GD profilyje nenurodytas jūsų Discord vardas (${handle}). Pridėkite jį GD profilio socialinėse nuorodose ir bandykite dar kartą.`,
  gd_username_invalid: 'Vardą sudaro 1–20 raidžių, skaičių ar tarpų.',
  gd_not_found: (name: string) => `GD vartotojas „${name}“ nerastas.`,
  gd_error: 'Nepavyko užkrauti GD statistikos. Bandykite vėliau.',
  gd_error_detail: (msg: string) => `Nepavyko užkrauti GD statistikos: ${msg}`,
  gd_auto_note: 'Parinkta automatiškai pagal vardą — savininkas gali nustatyti ranka, jei tai ne ta paskyra.',

  // Profile — socialiniai tinklai
  profile_links_title: 'Socialiniai tinklai',
  profile_links_custom_title: 'Pasirinktinės nuorodos',
  profile_links_add: '+ Pridėti nuorodą',
  profile_links_custom_label: 'Pavadinimas',
  profile_links_hint: 'Palikite laukelį tuščią, kad paslėptumėte nuorodą.',
  profile_links_err_url: (name: string) => `Įveskite teisingą ${name} nuorodą.`,
  profile_links_err_incomplete: 'Pasirinktinėms nuorodoms reikia ir pavadinimo, ir nuorodos.',
}

export default lt
