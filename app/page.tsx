<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Duuniharava | CV:t, työpaikat ja hakemukset yhdessä</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --teal: #00C4A7;
            --teal-glow: rgba(0,196,167,0.18);
            --orange: #FF6A35;
            --bg: #08090D;
            --bg2: #0E1018;
            --bg3: #13151E;
            --border: rgba(255,255,255,0.08);
            --border-teal: rgba(0,196,167,0.3);
            --text: #FFFFFF;
            --muted: #8A8FA8;
            --card: rgba(255,255,255,0.025);
        }

        html { scroll-behavior: smooth; }

        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--bg);
            color: var(--text);
            overflow-x: hidden;
            line-height: 1.6;
        }

        h1, h2, h3, h4, .logo-text {
            font-family: 'Syne', sans-serif;
        }

        /* ─── GLOBAL AMBIENT GLOW ─── */
        body::before {
            content: '';
            position: fixed;
            top: -20%;
            left: -10%;
            width: 60%;
            height: 60%;
            background: radial-gradient(ellipse, rgba(0,196,167,0.07) 0%, transparent 65%);
            pointer-events: none;
            z-index: 0;
        }
        body::after {
            content: '';
            position: fixed;
            bottom: -20%;
            right: -10%;
            width: 50%;
            height: 50%;
            background: radial-gradient(ellipse, rgba(255,106,53,0.06) 0%, transparent 65%);
            pointer-events: none;
            z-index: 0;
        }

        /* ─── FALLING PARTICLES ─── */
        .particle {
            position: fixed;
            top: -2%;
            width: 10px;
            height: 10px;
            border-radius: 2px 8px;
            pointer-events: none;
            z-index: 0;
            opacity: 0;
            animation: fall linear infinite;
        }
        @keyframes fall {
            0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
            8%   { opacity: 0.35; }
            92%  { opacity: 0.2; }
            100% { transform: translateY(108vh) rotate(540deg) translateX(60px); opacity: 0; }
        }

        /* ─── NAV ─── */
        nav {
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 100;
            background: rgba(8,9,13,0.8);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--border);
        }
        .nav-inner {
            max-width: 1280px;
            margin: 0 auto;
            padding: 14px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            text-decoration: none;
        }
        .logo-icon {
            width: 36px; height: 36px;
            background: rgba(0,196,167,0.1);
            border: 1px solid var(--border-teal);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
        }
        .logo-text {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.04em;
        }
        .logo-text span:first-child { color: var(--teal); }
        .logo-text span:last-child { color: var(--orange); }

        .nav-links {
            display: none;
            gap: 32px;
            list-style: none;
        }
        @media (min-width: 1024px) { .nav-links { display: flex; } }
        .nav-links a {
            color: var(--muted);
            text-decoration: none;
            font-size: 14px;
            transition: color .2s;
        }
        .nav-links a:hover { color: #fff; }

        .nav-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .lang-wrap {
            display: flex;
            gap: 6px;
            border-right: 1px solid var(--border);
            padding-right: 14px;
        }
        .lang-btn {
            font-family: 'DM Sans', sans-serif;
            font-size: 11px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--muted);
            cursor: pointer;
            transition: all .2s;
            display: flex; align-items: center; gap: 5px;
        }
        .lang-btn.active {
            border-color: var(--border-teal);
            background: rgba(0,196,167,0.1);
            color: var(--teal);
        }
        .btn-login {
            font-family: 'DM Sans', sans-serif;
            font-size: 12px;
            font-weight: 700;
            padding: 8px 18px;
            border-radius: 10px;
            border: 1px solid var(--border-teal);
            background: rgba(0,196,167,0.08);
            color: var(--teal);
            cursor: pointer;
            transition: all .2s;
            letter-spacing: 0.05em;
        }
        .btn-login:hover { background: rgba(0,196,167,0.18); }

        /* ─── SECTIONS ─── */
        section { position: relative; z-index: 1; }
        .container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 24px;
        }

        /* ─── HERO ─── */
        #hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            padding: 100px 24px 60px;
        }
        .hero-grid {
            max-width: 1280px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr;
            gap: 48px;
            align-items: center;
        }
        @media (min-width: 1024px) {
            .hero-grid { grid-template-columns: 1fr 1fr; }
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 999px;
            border: 1px solid rgba(0,196,167,0.25);
            background: rgba(0,196,167,0.08);
            font-size: 11px;
            font-weight: 700;
            color: var(--teal);
            letter-spacing: 0.18em;
            text-transform: uppercase;
            margin-bottom: 24px;
        }
        .badge-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: var(--teal);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%,100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.7); }
        }

        h1 {
            font-size: clamp(40px, 5.5vw, 80px);
            font-weight: 800;
            line-height: 1.0;
            letter-spacing: -0.045em;
            margin-bottom: 24px;
        }
        .hero-desc {
            color: var(--muted);
            font-size: 18px;
            line-height: 1.75;
            max-width: 560px;
            margin-bottom: 36px;
        }
        .hero-btns {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 28px;
        }
        .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: 'Syne', sans-serif;
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 0.04em;
            padding: 14px 28px;
            border-radius: 14px;
            background: linear-gradient(135deg, var(--teal), var(--orange));
            color: #000;
            border: none;
            cursor: pointer;
            transition: transform .2s, box-shadow .2s;
            text-decoration: none;
        }
        .btn-primary:hover { transform: scale(1.03); box-shadow: 0 0 24px rgba(0,196,167,0.35); }
        .btn-ghost {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: 'DM Sans', sans-serif;
            font-weight: 600;
            font-size: 14px;
            padding: 14px 28px;
            border-radius: 14px;
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.03);
            color: #fff;
            cursor: pointer;
            transition: background .2s, border-color .2s;
            text-decoration: none;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.2); }

        .hero-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .hero-tag {
            font-size: 12px;
            color: var(--muted);
            padding: 4px 12px;
            border-radius: 999px;
            border: 1px solid var(--border);
            background: var(--card);
        }

        /* ─── HERO CARD ─── */
        .hero-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 28px;
            padding: 28px;
            backdrop-filter: blur(12px);
        }
        .hero-card-header {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 24px;
        }
        .hero-card-inner {
            background: rgba(0,0,0,0.35);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 20px;
            padding: 20px;
        }
        .inner-label {
            font-size: 14px;
            font-weight: 600;
            color: var(--teal);
            margin-bottom: 4px;
        }
        .inner-sub {
            font-size: 12px;
            color: var(--muted);
            margin-bottom: 20px;
        }

        /* Dashboard mockup */
        .dash-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }
        .dash-stat {
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 14px;
        }
        .dash-stat-label {
            font-size: 11px;
            color: var(--muted);
            margin-bottom: 6px;
        }
        .dash-stat-val {
            font-family: 'Syne', sans-serif;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.04em;
        }
        .dash-stat-val.teal { color: var(--teal); }
        .dash-stat-val.orange { color: var(--orange); }

        .dash-bar-wrap { margin-bottom: 16px; }
        .dash-bar-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }
        .dash-bar-label { font-size: 11px; color: var(--muted); width: 70px; flex-shrink: 0; }
        .dash-bar-track {
            flex: 1;
            height: 6px;
            background: rgba(255,255,255,0.06);
            border-radius: 4px;
            overflow: hidden;
        }
        .dash-bar-fill {
            height: 100%;
            border-radius: 4px;
            background: linear-gradient(90deg, var(--teal), var(--orange));
        }
        .dash-bar-pct { font-size: 11px; color: var(--muted); width: 30px; text-align: right; }

        .dash-cols {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            text-align: center;
            margin-top: 16px;
        }
        .dash-col-label { font-size: 11px; color: var(--muted); }

        /* ─── BADGE SECTION ─── */
        .section-badge {
            display: inline-block;
            margin-bottom: 16px;
        }

        /* ─── GENERIC SECTION HEADER ─── */
        .section-head {
            text-align: center;
            margin-bottom: 56px;
        }
        .section-head h2 {
            font-size: clamp(32px, 4vw, 56px);
            font-weight: 800;
            letter-spacing: -0.04em;
            margin-bottom: 16px;
        }
        .section-head p {
            color: var(--muted);
            font-size: 17px;
            max-width: 620px;
            margin: 0 auto;
            line-height: 1.7;
        }

        /* ─── GLASS CARD ─── */
        .glass-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 28px;
            transition: transform .3s cubic-bezier(.34,1.56,.64,1), border-color .3s;
        }
        .glass-card:hover {
            transform: translateY(-6px);
            border-color: rgba(0,196,167,0.3);
        }

        /* ─── SERVICES ─── */
        #palvelut { padding: 96px 24px; }
        .services-grid {
            display: grid;
            gap: 20px;
            grid-template-columns: 1fr;
        }
        @media (min-width: 768px) { .services-grid { grid-template-columns: repeat(3,1fr); } }

        .svc-icon { font-size: 28px; margin-bottom: 16px; }
        .svc-title {
            font-family: 'Syne', sans-serif;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.02em;
        }
        .svc-title.teal { color: var(--teal); }
        .svc-title.orange { color: var(--orange); }
        .svc-desc { color: var(--muted); font-size: 15px; line-height: 1.7; }

        /* ─── WHY US ─── */
        #miksi { padding: 96px 24px; }
        .why-wrap {
            background: var(--card);
            border: 1px solid var(--border);
            border-top: 2px solid var(--teal);
            border-radius: 32px;
            padding: 56px 48px;
        }
        @media (max-width: 640px) { .why-wrap { padding: 36px 24px; } }
        .why-grid {
            display: grid;
            gap: 40px;
            grid-template-columns: 1fr;
            margin-top: 48px;
        }
        @media (min-width: 768px) { .why-grid { grid-template-columns: repeat(3,1fr); } }
        .why-item { text-align: center; }
        .why-emoji { font-size: 40px; margin-bottom: 16px; }
        .why-title {
            font-family: 'Syne', sans-serif;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.02em;
        }
        .why-desc { color: var(--muted); font-size: 15px; line-height: 1.7; }

        /* ─── TESTIMONIALS ─── */
        #kokemuksia { padding: 96px 24px; }
        .testimonials-grid {
            display: grid;
            gap: 20px;
            grid-template-columns: 1fr;
        }
        @media (min-width: 768px) { .testimonials-grid { grid-template-columns: repeat(3,1fr); } }
        .testi-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 28px;
            transition: transform .3s cubic-bezier(.34,1.56,.64,1), border-color .3s;
        }
        .testi-card:hover { transform: translateY(-6px); border-color: rgba(0,196,167,0.3); }
        .testi-card.featured { border-top: 2px solid var(--orange); }
        .testi-quote {
            color: var(--muted);
            font-style: italic;
            font-size: 15px;
            line-height: 1.75;
            margin-bottom: 20px;
        }
        .testi-author { font-size: 13px; font-weight: 700; color: var(--teal); }
        .testi-card.featured .testi-author { color: var(--orange); }

        /* ─── PRICING ─── */
        #hinnasto { padding: 96px 24px; }
        .pricing-grid {
            display: grid;
            gap: 20px;
            grid-template-columns: 1fr;
            max-width: 960px;
            margin: 0 auto;
        }
        @media (min-width: 768px) { .pricing-grid { grid-template-columns: repeat(3,1fr); } }

        .price-card {
            position: relative;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 28px;
            padding: 32px;
            transition: transform .3s;
        }
        .price-card:hover { transform: translateY(-4px); }
        .price-card.featured {
            border-color: rgba(0,196,167,0.4);
            background: linear-gradient(180deg, rgba(0,196,167,0.08) 0%, var(--card) 100%);
        }
        .featured-badge {
            position: absolute;
            top: -13px; left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            padding: 4px 16px;
            border-radius: 999px;
            background: var(--teal);
            color: #000;
        }
        .price-name {
            font-family: 'Syne', sans-serif;
            font-size: 22px;
            font-weight: 800;
            margin-bottom: 16px;
            letter-spacing: -0.03em;
        }
        .price-name.teal { color: var(--teal); }
        .price-amount {
            font-family: 'Syne', sans-serif;
            font-size: 44px;
            font-weight: 800;
            letter-spacing: -0.05em;
            margin-bottom: 24px;
        }
        .price-amount span {
            font-size: 14px;
            font-weight: 400;
            color: var(--muted);
            margin-left: 4px;
            font-family: 'DM Sans', sans-serif;
        }
        .price-list { list-style: none; space-y: 10px; margin-bottom: 28px; }
        .price-list li {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 14px;
            color: var(--muted);
            margin-bottom: 10px;
        }
        .price-list li::before {
            content: '';
            display: inline-block;
            width: 8px; height: 8px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--teal), var(--orange));
            margin-top: 6px;
            flex-shrink: 0;
        }

        .btn-choose {
            display: block;
            width: 100%;
            text-align: center;
            font-family: 'DM Sans', sans-serif;
            font-weight: 700;
            font-size: 13px;
            padding: 13px;
            border-radius: 14px;
            cursor: pointer;
            transition: all .2s;
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.04);
            color: #fff;
        }
        .btn-choose:hover { background: rgba(255,255,255,0.09); }
        .btn-choose.primary {
            background: linear-gradient(135deg, var(--teal), var(--orange));
            border: none;
            color: #000;
        }
        .btn-choose.primary:hover { opacity: 0.9; transform: scale(1.02); }

        /* ─── FAQ ─── */
        #faq { padding: 96px 24px; }
        .faq-list { max-width: 720px; margin: 0 auto; }
        details {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            margin-bottom: 12px;
            overflow: hidden;
            transition: border-color .2s;
        }
        details:hover { border-color: rgba(0,196,167,0.3); }
        summary {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 22px;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
            list-style: none;
            color: var(--teal);
        }
        summary::-webkit-details-marker { display: none; }
        .faq-arrow { transition: transform .3s; font-size: 12px; color: var(--muted); }
        details[open] .faq-arrow { transform: rotate(180deg); }
        .faq-body {
            padding: 0 22px 18px;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.75;
        }

        /* ─── AUTH ─── */
        #auth-section { padding: 48px 24px 96px; }
        .auth-card {
            max-width: 420px;
            margin: 0 auto;
            background: var(--card);
            border: 1px solid var(--border-teal);
            border-top: 2px solid var(--teal);
            border-radius: 28px;
            padding: 40px;
        }
        .auth-card h2 {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.03em;
            text-align: center;
            margin-bottom: 28px;
        }
        .form-group { margin-bottom: 16px; }
        .form-label {
            display: block;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 8px;
        }
        .form-input {
            width: 100%;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 13px 16px;
            color: #fff;
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            outline: none;
            transition: border-color .2s;
        }
        .form-input:focus { border-color: var(--border-teal); }
        .form-input::placeholder { color: rgba(255,255,255,0.2); }
        .btn-submit {
            display: block;
            width: 100%;
            font-family: 'Syne', sans-serif;
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 0.06em;
            padding: 15px;
            border-radius: 14px;
            background: linear-gradient(135deg, var(--teal), var(--orange));
            color: #000;
            border: none;
            cursor: pointer;
            margin-top: 24px;
            transition: transform .2s, box-shadow .2s;
        }
        .btn-submit:hover { transform: scale(1.02); box-shadow: 0 0 24px rgba(0,196,167,0.3); }
        .auth-note { text-align: center; font-size: 11px; color: var(--muted); margin-top: 14px; }

        /* ─── CTA ─── */
        #cta { padding: 0 24px 96px; }
        .cta-inner {
            max-width: 1280px;
            margin: 0 auto;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 32px;
            padding: 64px 48px;
            text-align: center;
        }
        @media (max-width: 640px) { .cta-inner { padding: 40px 24px; } }
        .cta-inner h2 {
            font-size: clamp(28px, 4vw, 52px);
            font-weight: 800;
            letter-spacing: -0.04em;
            max-width: 700px;
            margin: 0 auto 16px;
        }
        .cta-inner p { color: var(--muted); font-size: 17px; max-width: 560px; margin: 0 auto 36px; }
        .cta-btns { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }

        /* ─── FOOTER ─── */
        footer {
            border-top: 1px solid var(--border);
            padding: 28px 24px;
            text-align: center;
            font-size: 13px;
            color: var(--muted);
        }

        /* ─── REVEAL ANIMATION ─── */
        .reveal {
            opacity: 0;
            transform: translateY(28px);
            transition: opacity .7s ease-out, transform .7s ease-out;
        }
        .reveal.visible { opacity: 1; transform: none; }

        /* ─── MOBILE MENU ─── */
        @media (max-width: 1023px) {
            .hero-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

<!-- Falling particles -->
<script>
    const particleColors = ['#00C4A7','#FF6A35','rgba(255,255,255,0.3)'];
    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = (Math.random() * 100) + 'vw';
        p.style.animationDuration = (Math.random() * 6 + 8) + 's';
        p.style.animationDelay = (Math.random() * 8) + 's';
        p.style.background = particleColors[Math.floor(Math.random() * particleColors.length)];
        p.style.width = p.style.height = (Math.random() * 8 + 6) + 'px';
        document.body.appendChild(p);
    }
</script>

<!-- NAV -->
<nav>
    <div class="nav-inner">
        <a class="logo" onclick="window.scrollTo({top:0,behavior:'smooth'})">
            <div class="logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C4A7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 11V20M12 11V20M19 11V20M5 11H19M12 4V11"/>
                </svg>
            </div>
            <span class="logo-text"><span>DUUNI</span><span>HARAVA</span></span>
        </a>

        <ul class="nav-links">
            <li><a href="#hero" data-i18n="nav-home">Etusivu</a></li>
            <li><a href="#palvelut" data-i18n="nav-services">Palvelut</a></li>
            <li><a href="#miksi" data-i18n="nav-value">Miksi me</a></li>
            <li><a href="#kokemuksia" data-i18n="nav-testimonials">Kokemuksia</a></li>
            <li><a href="#hinnasto" data-i18n="nav-pricing">Hinnasto</a></li>
            <li><a href="#faq" data-i18n="nav-faq">FAQ</a></li>
        </ul>

        <div class="nav-right">
            <div class="lang-wrap">
                <button class="lang-btn active" id="lang-fi" onclick="changeLang('fi')">🇫🇮 FI</button>
                <button class="lang-btn" id="lang-en" onclick="changeLang('en')">🇬🇧 EN</button>
            </div>
            <button class="btn-login" data-i18n="nav-login" onclick="showAuth()">KIRJAUDU</button>
        </div>
    </div>
</nav>

<main>

<!-- HERO -->
<section id="hero">
    <div class="hero-grid">
        <div>
            <div class="badge"><div class="badge-dot"></div><span data-i18n="badge">Duuniharava</span></div>
            <h1 data-i18n="hero-title">Säästä aikaa työnhaussa ja rakenna vahvempi vaikutelma.</h1>
            <p class="hero-desc" data-i18n="hero-desc">Duuniharava auttaa tekemään paremman CV:n, seuraamaan työpaikkoja ja kirjoittamaan kohdistettuja hakemuksia yhdestä selkeästä työtilasta.</p>
            <div class="hero-btns">
                <button class="btn-primary" onclick="showAuth()" data-i18n="hero-cta">Aloita nyt →</button>
                <button class="btn-ghost" onclick="document.getElementById('palvelut').scrollIntoView({behavior:'smooth'})" data-i18n="btn-more">Katso miten toimii</button>
            </div>
            <div class="hero-tags">
                <span class="hero-tag" data-i18n="tag1">CV-generaattori</span>
                <span class="hero-tag" data-i18n="tag2">Työpaikkaseuranta</span>
                <span class="hero-tag" data-i18n="tag3">Hakemukset</span>
                <span class="hero-tag" data-i18n="tag4">PDF + DOCX</span>
            </div>
        </div>

        <!-- Dashboard card -->
        <div class="hero-card">
            <div class="hero-card-header">
                <div class="logo-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C4A7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 11V20M12 11V20M19 11V20M5 11H19M12 4V11"/>
                    </svg>
                </div>
                <span class="logo-text"><span>DUUNI</span><span>HARAVA</span></span>
            </div>
            <div class="hero-card-inner">
                <p class="inner-label" data-i18n="dash-title">Työnhaun työtila</p>
                <p class="inner-sub" data-i18n="dash-sub">Kaikki yhdessä näkymässä</p>

                <!-- Stats -->
                <div class="dash-grid">
                    <div class="dash-stat">
                        <div class="dash-stat-label" data-i18n="stat1-label">Hakemukset</div>
                        <div class="dash-stat-val teal">12</div>
                    </div>
                    <div class="dash-stat">
                        <div class="dash-stat-label" data-i18n="stat2-label">Haastattelut</div>
                        <div class="dash-stat-val orange">3</div>
                    </div>
                </div>

                <!-- Progress bars -->
                <div class="dash-bar-wrap">
                    <div class="dash-bar-row">
                        <div class="dash-bar-label" data-i18n="bar1">CV-laatu</div>
                        <div class="dash-bar-track"><div class="dash-bar-fill" style="width:82%"></div></div>
                        <div class="dash-bar-pct">82%</div>
                    </div>
                    <div class="dash-bar-row">
                        <div class="dash-bar-label" data-i18n="bar2">Osuvuus</div>
                        <div class="dash-bar-track"><div class="dash-bar-fill" style="width:67%"></div></div>
                        <div class="dash-bar-pct">67%</div>
                    </div>
                    <div class="dash-bar-row">
                        <div class="dash-bar-label" data-i18n="bar3">Aktiivisuus</div>
                        <div class="dash-bar-track"><div class="dash-bar-fill" style="width:91%"></div></div>
                        <div class="dash-bar-pct">91%</div>
                    </div>
                </div>

                <div class="dash-cols">
                    <div class="dash-col-label" data-i18n="col1">CV</div>
                    <div class="dash-col-label" data-i18n="col2">Työpaikat</div>
                    <div class="dash-col-label" data-i18n="col3">Hakemukset</div>
                    <div class="dash-col-label" data-i18n="col4">Seuranta</div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- PALVELUT -->
<section id="palvelut" class="reveal">
    <div class="container">
        <div class="section-head">
            <div class="badge section-badge" data-i18n="s-badge1">Palvelut</div>
            <h2 data-i18n="features-title">Kenelle ja mitä tarjoamme</h2>
            <p data-i18n="features-desc">Palvelu on rakennettu niin, että myös ensimmäistä kertaa hakeva ymmärtää mitä tehdä seuraavaksi.</p>
        </div>
        <div class="services-grid">
            <div class="glass-card">
                <div class="svc-icon">📄</div>
                <div class="svc-title teal" data-i18n="svc1-title">CV-analyysi ja rakentaminen</div>
                <p class="svc-desc" data-i18n="svc1-desc">Luo uusi CV tai paranna nykyistä. Tee sisällöstä vahvempi ja pidä ulkoasu siistinä ilman turhaa säätöä.</p>
            </div>
            <div class="glass-card">
                <div class="svc-icon">🎯</div>
                <div class="svc-title orange" data-i18n="svc2-title">Työpaikkojen kohdistus</div>
                <p class="svc-desc" data-i18n="svc2-desc">Seuraa kiinnostavia työpaikkoja, deadlineja ja prioriteetteja yhdestä näkymästä.</p>
            </div>
            <div class="glass-card">
                <div class="svc-icon">✍️</div>
                <div class="svc-title teal" data-i18n="svc3-title">Hakemukset valmiiksi nopeammin</div>
                <p class="svc-desc" data-i18n="svc3-desc">Tee työpaikkaan sopiva hakemus ja tarvittaessa myös erillinen CV-versio samasta työtilasta.</p>
            </div>
        </div>
    </div>
</section>

<!-- MIKSI ME -->
<section id="miksi" class="reveal">
    <div class="container">
        <div class="why-wrap">
            <div class="section-head" style="margin-bottom:0">
                <div class="badge section-badge" data-i18n="s-badge2">Miksi me</div>
                <h2 data-i18n="why-title">Enemmän kuin vain yksi työkalu</h2>
                <p data-i18n="why-desc">Duuniharava kokoaa työnhaun tärkeimmät osat yhteen — ei pelkkä CV-editori, vaan kokonainen työtila.</p>
            </div>
            <div class="why-grid">
                <div class="why-item">
                    <div class="why-emoji">🇫🇮</div>
                    <div class="why-title" data-i18n="why1-title">Suomen työnhakuun sopiva</div>
                    <p class="why-desc" data-i18n="why1-desc">Rakennettu nimenomaan siihen, miltä työnhaku Suomessa tuntuu ja mitä siinä yleensä tarvitaan.</p>
                </div>
                <div class="why-item">
                    <div class="why-emoji">⚙️</div>
                    <div class="why-title" data-i18n="why2-title">Selkeä prosessi</div>
                    <p class="why-desc" data-i18n="why2-desc">Käyttäjä ymmärtää vaihe vaiheelta mitä tehdä seuraavaksi, vaikka ei olisi käyttänyt vastaavaa palvelua aiemmin.</p>
                </div>
                <div class="why-item">
                    <div class="why-emoji">💎</div>
                    <div class="why-title" data-i18n="why3-title">Premium-ilme</div>
                    <p class="why-desc" data-i18n="why3-desc">Luottamusta herättävä, moderni ja myyvä käyttöliittymä tekee tuotteesta aidosti valmiin tuntuisen.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- KOKEMUKSIA -->
<section id="kokemuksia" class="reveal">
    <div class="container">
        <div class="section-head">
            <div class="badge section-badge" data-i18n="s-badge3">Kokemuksia</div>
            <h2 data-i18n="testi-title">Mitä käyttäjät sanovat</h2>
        </div>
        <div class="testimonials-grid">
            <div class="testi-card">
                <p class="testi-quote" data-i18n="testi1">"Sain viisi haastattelukutsua viikossa CV-optimoinnin jälkeen. Uskomaton työkalu!"</p>
                <span class="testi-author" data-i18n="testi1-author">— Mikko S., Ohjelmistokehittäjä</span>
            </div>
            <div class="testi-card featured">
                <p class="testi-quote" data-i18n="testi2">"Automaattinen haku säästi minulta kymmeniä tunteja aikaa. Suosittelen kaikille!"</p>
                <span class="testi-author" data-i18n="testi2-author">— Elena V., Markkinointi</span>
            </div>
            <div class="testi-card">
                <p class="testi-quote" data-i18n="testi3">"LinkedIn-profiilini hionta toi heti rekrytoijia viestittelemään minulle suoraan."</p>
                <span class="testi-author" data-i18n="testi3-author">— Joonas K., Myyntipäällikkö</span>
            </div>
        </div>
    </div>
</section>

<!-- HINNASTO -->
<section id="hinnasto" class="reveal">
    <div class="container">
        <div class="section-head">
            <div class="badge section-badge" data-i18n="s-badge4">Hinnasto</div>
            <h2 data-i18n="pricing-title">Hinnasto</h2>
            <p data-i18n="pricing-desc">Valitse sinulle sopiva paketti ja aloita työnhaku heti.</p>
        </div>
        <div class="pricing-grid">
            <div class="price-card">
                <div class="price-name" data-i18n="plan1-name">Starter</div>
                <div class="price-amount">12,49€<span data-i18n="per-month">/ kk</span></div>
                <ul class="price-list">
                    <li data-i18n="plan1-f1">CV-analyysi</li>
                    <li data-i18n="plan1-f2">Perusmuokkaukset</li>
                    <li data-i18n="plan1-f3">Kevyt aloitus työnhakuun</li>
                </ul>
                <button class="btn-choose" onclick="showAuth()" data-i18n="btn-choose">Valitse</button>
            </div>
            <div class="price-card featured">
                <div class="featured-badge" data-i18n="popular">Suosituin</div>
                <div class="price-name teal" data-i18n="plan2-name">Pro</div>
                <div class="price-amount">29,99€<span data-i18n="per-month">/ kk</span></div>
                <ul class="price-list">
                    <li data-i18n="plan2-f1">Rajattomammat työnhakutyökalut</li>
                    <li data-i18n="plan2-f2">Hakemusten teko nopeammin</li>
                    <li data-i18n="plan2-f3">Työpaikkaseuranta samassa näkymässä</li>
                </ul>
                <button class="btn-choose primary" onclick="showAuth()" data-i18n="btn-choose">Valitse</button>
            </div>
            <div class="price-card">
                <div class="price-name" data-i18n="plan3-name">Ura-tuki</div>
                <div class="price-amount">99€<span data-i18n="per-month">/ kk</span></div>
                <ul class="price-list">
                    <li data-i18n="plan3-f1">Kaikki Pro-ominaisuudet</li>
                    <li data-i18n="plan3-f2">Syvempi sparraus</li>
                    <li data-i18n="plan3-f3">Laajempi henkilökohtainen tuki</li>
                </ul>
                <button class="btn-choose" onclick="showAuth()" data-i18n="btn-choose">Valitse</button>
            </div>
        </div>
    </div>
</section>

<!-- FAQ -->
<section id="faq" class="reveal">
    <div class="container">
        <div class="section-head">
            <div class="badge section-badge" data-i18n="s-badge5">FAQ</div>
            <h2 data-i18n="faq-title">Usein kysyttyä</h2>
        </div>
        <div class="faq-list">
            <details>
                <summary>
                    <span data-i18n="faq1-q">Saanko tällä paremman CV:n?</span>
                    <span class="faq-arrow">▼</span>
                </summary>
                <p class="faq-body" data-i18n="faq1-a">Kyllä. Tavoitteena on tehdä CV:n kirjoittamisesta, muokkaamisesta ja viimeistelystä huomattavasti helpompaa.</p>
            </details>
            <details>
                <summary>
                    <span data-i18n="faq2-q">Voinko seurata työpaikkoja samassa paikassa?</span>
                    <span class="faq-arrow">▼</span>
                </summary>
                <p class="faq-body" data-i18n="faq2-a">Kyllä. Duuniharava yhdistää CV:n, työpaikat ja hakemukset yhden näkymän alle.</p>
            </details>
            <details>
                <summary>
                    <span data-i18n="faq3-q">Voiko tätä käyttää ilman aiempaa kokemusta?</span>
                    <span class="faq-arrow">▼</span>
                </summary>
                <p class="faq-body" data-i18n="faq3-a">Kyllä. Koko rakenne on tehty niin, että käyttäjä ymmärtää helposti mitä pitää tehdä seuraavaksi.</p>
            </details>
            <details>
                <summary>
                    <span data-i18n="faq4-q">Mitä tiedostomuotoja saan ladattua?</span>
                    <span class="faq-arrow">▼</span>
                </summary>
                <p class="faq-body" data-i18n="faq4-a">CV:n voi ladata sekä PDF- että DOCX-muodossa, jolloin se sopii kaikkiin hakujärjestelmiin.</p>
            </details>
        </div>
    </div>
</section>

<!-- AUTH -->
<section id="auth-section" class="hidden">
    <div class="auth-card">
        <h2 data-i18n="login-title">Kirjaudu sisään</h2>
        <form id="auth-form">
            <div class="form-group">
                <label class="form-label" data-i18n="login-email">Sähköposti</label>
                <input type="email" id="email" class="form-input" placeholder="matti@esimerkki.fi" required>
            </div>
            <div class="form-group">
                <label class="form-label" data-i18n="login-pass">Salasana</label>
                <input type="password" id="password" class="form-input" placeholder="••••••••" required>
            </div>
            <button type="submit" id="auth-btn" class="btn-submit" data-i18n="login-btn">KIRJAUDU SISÄÄN →</button>
            <p class="auth-note" data-i18n="login-note">Jos sinulla ei ole vielä tiliä, se luodaan automaattisesti ensikirjautumisen yhteydessä.</p>
        </form>
    </div>
</section>

<!-- CTA -->
<section id="cta" class="reveal">
    <div class="cta-inner">
        <div class="badge" style="margin-bottom:20px" data-i18n="cta-badge">Aloita nyt</div>
        <h2 data-i18n="cta-title">Valmis tekemään työnhausta selkeämpää?</h2>
        <p data-i18n="cta-desc">Avaa Duuniharava ja rakenna CV, työpaikkaseuranta ja hakemukset yhteen paikkaan.</p>
        <div class="cta-btns">
            <button class="btn-primary" onclick="showAuth()" data-i18n="cta-btn1">Luo tili →</button>
            <button class="btn-ghost" onclick="document.getElementById('palvelut').scrollIntoView({behavior:'smooth'})" data-i18n="cta-btn2">Avaa studio</button>
        </div>
    </div>
</section>

</main>

<footer>© 2026 Duuniharava. Kaikki oikeudet pidätetään.</footer>

<script>
    // SUPABASE
    const SUPABASE_URL = 'https://zxtnhitxachrudrcrotk.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dG5oaXR4YWNocnVkcmNyb3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyODEwOTUsImV4cCI6MjA4Nzg1NzA5NX0.DPXJlYDI2L8oLYo6ofyPJzQDTbXAhreJx7VsqhV7VdI';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    function showAuth() {
        const s = document.getElementById('auth-section');
        s.classList.remove('hidden');
        s.scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('auth-btn');
        const orig = btn.innerText;
        btn.disabled = true;
        btn.innerText = 'KÄSITELLÄÄN...';
        try {
            const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (signInError && (signInError.message.includes('Invalid login credentials') || signInError.status === 400)) {
                const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({ email, password });
                if (signUpError) throw signUpError;
                if (signUpData.user) {
                    await supabaseClient.from('profiles').insert([{ id: signUpData.user.id, email, customer_group: 'paid_customer' }]);
                }
                alert('Tili luotu onnistuneesti!');
                window.location.href = 'dashboard.html';
                return;
            }
            if (signInError) throw signInError;
            if (signInData.user) window.location.href = 'dashboard.html';
        } catch (err) {
            alert('Virhe: ' + err.message);
            btn.disabled = false;
            btn.innerText = orig;
        }
    });

    // TRANSLATIONS
    const translations = {
        fi: {
            "nav-home":"Etusivu","nav-services":"Palvelut","nav-value":"Miksi me","nav-testimonials":"Kokemuksia","nav-pricing":"Hinnasto","nav-faq":"FAQ","nav-login":"KIRJAUDU",
            "badge":"Duuniharava",
            "hero-title":"Säästä aikaa työnhaussa ja rakenna vahvempi vaikutelma.",
            "hero-desc":"Duuniharava auttaa tekemään paremman CV:n, seuraamaan työpaikkoja ja kirjoittamaan kohdistettuja hakemuksia yhdestä selkeästä työtilasta.",
            "hero-cta":"Aloita nyt →","btn-more":"Katso miten toimii",
            "tag1":"CV-generaattori","tag2":"Työpaikkaseuranta","tag3":"Hakemukset","tag4":"PDF + DOCX",
            "dash-title":"Työnhaun työtila","dash-sub":"Kaikki yhdessä näkymässä",
            "stat1-label":"Hakemukset","stat2-label":"Haastattelut",
            "bar1":"CV-laatu","bar2":"Osuvuus","bar3":"Aktiivisuus",
            "col1":"CV","col2":"Työpaikat","col3":"Hakemukset","col4":"Seuranta",
            "s-badge1":"Palvelut","features-title":"Kenelle ja mitä tarjoamme",
            "features-desc":"Palvelu on rakennettu niin, että myös ensimmäistä kertaa hakeva ymmärtää mitä tehdä seuraavaksi.",
            "svc1-title":"CV-analyysi ja rakentaminen","svc1-desc":"Luo uusi CV tai paranna nykyistä. Tee sisällöstä vahvempi ja pidä ulkoasu siistinä ilman turhaa säätöä.",
            "svc2-title":"Työpaikkojen kohdistus","svc2-desc":"Seuraa kiinnostavia työpaikkoja, deadlineja ja prioriteetteja yhdestä näkymästä.",
            "svc3-title":"Hakemukset valmiiksi nopeammin","svc3-desc":"Tee työpaikkaan sopiva hakemus ja tarvittaessa myös erillinen CV-versio samasta työtilasta.",
            "s-badge2":"Miksi me","why-title":"Enemmän kuin vain yksi työkalu","why-desc":"Duuniharava kokoaa työnhaun tärkeimmät osat yhteen — ei pelkkä CV-editori, vaan kokonainen työtila.",
            "why1-title":"Suomen työnhakuun sopiva","why1-desc":"Rakennettu nimenomaan siihen, miltä työnhaku Suomessa tuntuu ja mitä siinä yleensä tarvitaan.",
            "why2-title":"Selkeä prosessi","why2-desc":"Käyttäjä ymmärtää vaihe vaiheelta mitä tehdä seuraavaksi, vaikka ei olisi käyttänyt vastaavaa palvelua aiemmin.",
            "why3-title":"Premium-ilme","why3-desc":"Luottamusta herättävä, moderni ja myyvä käyttöliittymä tekee tuotteesta aidosti valmiin tuntuisen.",
            "s-badge3":"Kokemuksia","testi-title":"Mitä käyttäjät sanovat",
            "testi1":"\"Sain viisi haastattelukutsua viikossa CV-optimoinnin jälkeen. Uskomaton työkalu!\"","testi1-author":"— Mikko S., Ohjelmistokehittäjä",
            "testi2":"\"Automaattinen haku säästi minulta kymmeniä tunteja aikaa. Suosittelen kaikille!\"","testi2-author":"— Elena V., Markkinointi",
            "testi3":"\"LinkedIn-profiilini hionta toi heti rekrytoijia viestittelemään minulle suoraan.\"","testi3-author":"— Joonas K., Myyntipäällikkö",
            "s-badge4":"Hinnasto","pricing-title":"Hinnasto","pricing-desc":"Valitse sinulle sopiva paketti ja aloita työnhaku heti.",
            "per-month":"/ kk","popular":"Suosituin","btn-choose":"Valitse",
            "plan1-name":"Starter","plan1-f1":"CV-analyysi","plan1-f2":"Perusmuokkaukset","plan1-f3":"Kevyt aloitus työnhakuun",
            "plan2-name":"Pro","plan2-f1":"Rajattomammat työnhakutyökalut","plan2-f2":"Hakemusten teko nopeammin","plan2-f3":"Työpaikkaseuranta samassa näkymässä",
            "plan3-name":"Ura-tuki","plan3-f1":"Kaikki Pro-ominaisuudet","plan3-f2":"Syvempi sparraus","plan3-f3":"Laajempi henkilökohtainen tuki",
            "s-badge5":"FAQ","faq-title":"Usein kysyttyä",
            "faq1-q":"Saanko tällä paremman CV:n?","faq1-a":"Kyllä. Tavoitteena on tehdä CV:n kirjoittamisesta, muokkaamisesta ja viimeistelystä huomattavasti helpompaa.",
            "faq2-q":"Voinko seurata työpaikkoja samassa paikassa?","faq2-a":"Kyllä. Duuniharava yhdistää CV:n, työpaikat ja hakemukset yhden näkymän alle.",
            "faq3-q":"Voiko tätä käyttää ilman aiempaa kokemusta?","faq3-a":"Kyllä. Koko rakenne on tehty niin, että käyttäjä ymmärtää helposti mitä pitää tehdä seuraavaksi.",
            "faq4-q":"Mitä tiedostomuotoja saan ladattua?","faq4-a":"CV:n voi ladata sekä PDF- että DOCX-muodossa, jolloin se sopii kaikkiin hakujärjestelmiin.",
            "login-title":"Kirjaudu sisään","login-email":"Sähköposti","login-pass":"Salasana","login-btn":"KIRJAUDU SISÄÄN →","login-note":"Jos sinulla ei ole vielä tiliä, se luodaan automaattisesti ensikirjautumisen yhteydessä.",
            "cta-badge":"Aloita nyt","cta-title":"Valmis tekemään työnhausta selkeämpää?","cta-desc":"Avaa Duuniharava ja rakenna CV, työpaikkaseuranta ja hakemukset yhteen paikkaan.","cta-btn1":"Luo tili →","cta-btn2":"Avaa studio"
        },
        en: {
            "nav-home":"Home","nav-services":"Services","nav-value":"Why us","nav-testimonials":"Stories","nav-pricing":"Pricing","nav-faq":"FAQ","nav-login":"LOGIN",
            "badge":"Duuniharava",
            "hero-title":"Save time in your job search and build a stronger impression.",
            "hero-desc":"Duuniharava helps you build a better CV, track job listings, and write targeted applications from one clear workspace.",
            "hero-cta":"Get started →","btn-more":"See how it works",
            "tag1":"CV generator","tag2":"Job tracking","tag3":"Applications","tag4":"PDF + DOCX",
            "dash-title":"Job search workspace","dash-sub":"Everything in one view",
            "stat1-label":"Applications","stat2-label":"Interviews",
            "bar1":"CV quality","bar2":"Relevance","bar3":"Activity",
            "col1":"CV","col2":"Jobs","col3":"Applications","col4":"Tracking",
            "s-badge1":"Services","features-title":"Who we help and how",
            "features-desc":"Built so that even a first-time job seeker understands exactly what to do next.",
            "svc1-title":"CV analysis & building","svc1-desc":"Create a new CV or improve your current one. Make the content stronger and keep the layout clean without extra hassle.",
            "svc2-title":"Job targeting","svc2-desc":"Track interesting job listings, deadlines, and priorities from one view.",
            "svc3-title":"Applications ready faster","svc3-desc":"Write a job-specific application and a separate CV version if needed — all from the same workspace.",
            "s-badge2":"Why us","why-title":"More than just one tool","why-desc":"Duuniharava brings the most important parts of job searching together — not just a CV editor, but a complete workspace.",
            "why1-title":"Built for Finland","why1-desc":"Designed specifically for what job searching in Finland looks and feels like.",
            "why2-title":"Clear process","why2-desc":"Users understand step by step what to do next, even without prior experience with similar tools.",
            "why3-title":"Premium feel","why3-desc":"A trustworthy, modern interface that makes the product feel genuinely ready.",
            "s-badge3":"Stories","testi-title":"What users say",
            "testi1":"\"I got five interview invitations per week after CV optimization. Incredible tool!\"","testi1-author":"— Mikko S., Software Developer",
            "testi2":"\"The automated search saved me dozens of hours. I recommend it to everyone!\"","testi2-author":"— Elena V., Marketing",
            "testi3":"\"LinkedIn profile polish brought recruiters messaging me directly right away.\"","testi3-author":"— Joonas K., Sales Manager",
            "s-badge4":"Pricing","pricing-title":"Pricing","pricing-desc":"Choose the plan that fits you and start your job search today.",
            "per-month":"/ mo","popular":"Most popular","btn-choose":"Choose",
            "plan1-name":"Starter","plan1-f1":"CV analysis","plan1-f2":"Basic edits","plan1-f3":"Light job search start",
            "plan2-name":"Pro","plan2-f1":"Unlimited job search tools","plan2-f2":"Faster application writing","plan2-f3":"Job tracking in the same view",
            "plan3-name":"Career support","plan3-f1":"All Pro features","plan3-f2":"Deeper career coaching","plan3-f3":"Extended personal support",
            "s-badge5":"FAQ","faq-title":"Frequently asked",
            "faq1-q":"Will this get me a better CV?","faq1-a":"Yes. The goal is to make writing, editing, and finishing your CV significantly easier.",
            "faq2-q":"Can I track jobs in the same place?","faq2-a":"Yes. Duuniharava brings your CV, jobs, and applications under one view.",
            "faq3-q":"Can I use this without prior experience?","faq3-a":"Yes. The whole structure is built so that users easily understand what to do next.",
            "faq4-q":"What file formats can I download?","faq4-a":"You can download your CV in both PDF and DOCX format, making it compatible with all application systems.",
            "login-title":"Log in","login-email":"Email","login-pass":"Password","login-btn":"LOG IN →","login-note":"If you don't have an account yet, one will be created automatically on first login.",
            "cta-badge":"Get started","cta-title":"Ready to make job searching clearer?","cta-desc":"Open Duuniharava and build your CV, job tracker, and applications in one place.","cta-btn1":"Create account →","cta-btn2":"Open studio"
        }
    };

    function changeLang(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key] !== undefined) el.innerText = translations[lang][key];
        });
        document.getElementById('lang-fi').classList.toggle('active', lang === 'fi');
        document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    }

    // SCROLL REVEAL
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.1 });
    revealEls.forEach(el => observer.observe(el));
</script>

</body>
</html>