import React from 'react';

export default function RuleBook({ isOpen, onClose, language = 'en' }) {
  if (!isOpen) return null;

  const t = {
    en: {
      title: "Lit Elite Rules",
      toc: "Table of Contents",
      close: "Close",
      sections: {
        overview: "1. Game Overview",
        cardTypes: "2. Card Types",
        draft: "3. Draft Phase",
        deck: "4. Deck Building",
        turn: "5. Turn Structure",
        limits: "6. Play Limits",
        normal: "7. Normal Card Powers",
        sickness: "8. Summoning Sickness",
        elite: "9. Elite Card Abilities",
        underlay: "10. Ace Underlay System",
        combat: "11. Combat",
        special: "12. Special Mechanics",
        forbidden: "13. Forbidden Turn Restrictions",
        victory: "14. Victory Conditions",
        defeated: "15. Defeated Pile"
      }
    },
    bg: {
      title: "ПРАВИЛА НА Lit Elite",
      toc: "Съдържание",
      close: "Затвори",
      sections: {
        overview: "1. Общ преглед на играта",
        cardTypes: "2. Типове карти",
        draft: "3. Драфт фаза",
        deck: "4. Създаване на тесте",
        turn: "5. Структура на хода",
        limits: "6. Лимити за изиграване",
        normal: "7. Сили на нормалните карти",
        sickness: "8. Треска от призоваване",
        elite: "9. Способности на елитните карти",
        underlay: "10. Система за подлагане на Аса",
        combat: "11. Бойна система",
        special: "12. Специални механики",
        forbidden: "13. Ограничения за забранени карти",
        victory: "14. Условия за победа",
        defeated: "15. Купчина с победени карти"
      }
    }
  }[language === 'bg' ? 'bg' : 'en'];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const suitStyle = (suit) => {
    const colors = {
      diamonds: '#f59e0b',
      hearts: '#ef4444',
      spades: '#6366f1',
      clubs: '#10b981'
    };
    return { color: colors[suit], fontWeight: '700' };
  };

  return (
    <div 
      className="rulebook-overlay" 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.9)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="rulebook-container glass-panel"
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0b0f19',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '40px',
          position: 'relative',
          color: '#f8fafc',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '1.5rem',
            cursor: 'pointer',
            transition: 'color 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => e.target.style.color = '#ef4444'}
          onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
          title={t.close}
        >
          &times;
        </button>

        {/* Header */}
        <h1 style={{ 
          fontSize: '2.2rem', 
          fontWeight: '800', 
          marginBottom: '20px', 
          textAlign: 'center',
          background: 'linear-gradient(to right, #f59e0b, #ef4444, #6366f1, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {t.title}
        </h1>

        {/* Table of Contents */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '40px'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '12px', color: '#94a3b8' }}>{t.toc}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
            {Object.keys(t.sections).map((key) => (
              <span 
                key={key} 
                onClick={() => scrollToSection(key)}
                style={{ 
                  color: '#6366f1', 
                  cursor: 'pointer', 
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#a5b4fc'}
                onMouseLeave={(e) => e.target.style.color = '#6366f1'}
              >
                {t.sections[key]}
              </span>
            ))}
          </div>
        </div>

        {/* Sections Content */}
        <div className="rulebook-content" style={{ display: 'flex', flexDirection: 'column', gap: '40px', textAlign: 'left' }}>
          
          {/* Section 1: Overview */}
          <section id="overview">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.overview}</h2>
            {language === 'bg' ? (
              <div>
                <p><strong>Lit Elite</strong> е стратегическа игра с карти за 2 играчи (1 срещу 1). Целта ви е да свалите жизнените точки (LP) на опонента до 0.</p>
                <ul>
                  <li><strong>Начални жизнени точки (LP):</strong> 150 (максимум 150, може да бъде увеличен чрез Асо Купа).</li>
                  <li><strong>Режими на игра:</strong> Локален (Hotseat), Срещу компютър (AI) и Онлайн мултиплейър.</li>
                </ul>
              </div>
            ) : (
              <div>
                <p><strong>Lit Elite</strong> is a strategic 1v1 card battle game. Your goal is to reduce your opponent's Life Points (LP) to 0.</p>
                <ul>
                  <li><strong>Starting LP:</strong> 150 (max LP: 150, can be increased via Ace of Hearts).</li>
                  <li><strong>Game Modes:</strong> Pass & Play (Hotseat), vs AI, and Online Multiplayer.</li>
                </ul>
              </div>
            )}
          </section>

          {/* Section 2: Card Types */}
          <section id="cardTypes">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.cardTypes}</h2>
            {language === 'bg' ? (
              <div>
                <p>В играта има два основни типа карти:</p>
                <h3 style={{ margin: '12px 0 6px 0', fontSize: '1.1rem' }}>Нормални карти (36 общо)</h3>
                <p>4 бои (♦ Каро, ♥ Купа, ♠ Пика, ♣ Спатия) × 9 стойности (от 2 до 10).</p>
                <ul>
                  <li><strong>Статистики:</strong> Атака (ATK) и Живот (HP) на картата са равни на нейната числена стойност при изиграване (например: 7 Каро има 7 ATK / 7 HP).</li>
                </ul>
                <h3 style={{ margin: '12px 0 6px 0', fontSize: '1.1rem' }}>Елитни карти (16 общо)</h3>
                <p>4 бои × 4 ранга:</p>
                <ul>
                  <li><strong>Вале (J):</strong> 12 ATK / 12 HP.</li>
                  <li><strong>Дама (Q):</strong> 13 ATK / 13 HP.</li>
                  <li><strong>Поп (K):</strong> 14 ATK / 14 HP.</li>
                  <li><strong>Асо (A):</strong> 0 ATK / 0 HP (Специална поддържаща карта, която не се поставя на полето директно, а се изхвърля или се използва като подложка).</li>
                </ul>
              </div>
            ) : (
              <div>
                <p>There are two main types of cards in the game:</p>
                <h3 style={{ margin: '12px 0 6px 0', fontSize: '1.1rem' }}>Normal Cards (36 total)</h3>
                <p>4 suits (♦ Diamonds, ♥ Hearts, ♠ Spades, ♣ Clubs) × 9 values (from 2 to 10).</p>
                <ul>
                  <li><strong>Stats:</strong> ATK (Attack) and HP (Health) are equal to the card's face value (e.g., a 7 of Diamonds has 7 ATK / 7 HP).</li>
                </ul>
                <h3 style={{ margin: '12px 0 6px 0', fontSize: '1.1rem' }}>Elite Cards (16 total)</h3>
                <p>4 suits × 4 ranks:</p>
                <ul>
                  <li><strong>Jack (J):</strong> 12 ATK / 12 HP.</li>
                  <li><strong>Queen (Q):</strong> 13 ATK / 13 HP.</li>
                  <li><strong>King (K):</strong> 14 ATK / 14 HP.</li>
                  <li><strong>Ace (A):</strong> 0 ATK / 0 HP (Special support card. It does not enter the board directly; it is discarded after resolving or attached as an underlay).</li>
                </ul>
              </div>
            )}
          </section>

          {/* Section 3: Draft Phase */}
          <section id="draft">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.draft}</h2>
            {language === 'bg' ? (
              <div>
                <p>Преди битката играчите избират картите си в две драфт фази:</p>
                <ol>
                  <li><strong>Нормален Драфт (4 рунда):</strong> Избират се подсекции от нормални карти (четни и нечетни от всяка боя). Модел на избор: Играч 1 избира 1 подсекция → Играч 2 избира 2 подсекции → Последната се приписва автоматично на Играч 1.</li>
                  <li><strong>Елитен Драфт (4 рунда):</strong> Избират се елитни карти. Всеки рунд един от играчите избира боя/ранг категория, опонентът взема 2 карти от нея, а останалата отива при избиращия.</li>
                  <li><strong>Краен избор на Елити:</strong> От 8-те си драфтнати елити, всеки играч трябва да избере точно 4 (по един от всеки ранг: J, Q, K, A) за своето тесте.</li>
                </ol>
              </div>
            ) : (
              <div>
                <p>Before the battle, players build their hands using two draft phases:</p>
                <ol>
                  <li><strong>Normal Draft (4 rounds):</strong> Select subsections of normal cards (odd and even groups of each suit). Selection pattern: Player 1 picks 1 subsection → Player 2 picks 2 subsections → Player 1 receives the remaining subsection.</li>
                  <li><strong>Elite Draft (4 rounds):</strong> Select elite cards. Each round, one player picks a rank category, the opponent drafts 2 cards from it, and the selector receives the last remaining card.</li>
                  <li><strong>Final Elite Selection:</strong> From the 8 drafted elites, each player must choose exactly 4 (one of each rank: J, Q, K, A) to put into their deck.</li>
                </ol>
              </div>
            )}
          </section>

          {/* Section 4: Deck Building */}
          <section id="deck">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.deck}</h2>
            {language === 'bg' ? (
              <div>
                <p>Тестето се състои от 26 карти, които се подреждат по специфичен модел:</p>
                <ul>
                  <li>Най-отгоре се поставят 6 разбъркани нормални карти (които се теглят за начална ръка).</li>
                  <li>Останалите карти се редуват по следния модел: Нормална, Нормална, Елитна, Нормална, Елитна.</li>
                </ul>
              </div>
            ) : (
              <div>
                <p>The deck consists of 26 cards arranged in a specific spacing pattern:</p>
                <ul>
                  <li>The top 6 cards are shuffled normal cards (drawn as the starting hand).</li>
                  <li>The remaining cards follow a repeated spacing pattern: Normal, Normal, Elite, Normal, Elite.</li>
                </ul>
              </div>
            )}
          </section>

          {/* Section 5: Turn Structure */}
          <section id="turn">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.turn}</h2>
            {language === 'bg' ? (
              <div>
                <ol>
                  <li><strong>Начало на хода:</strong> Връща се броячът на изиграни карти, нулира се статусът на атака на картите на полето. Тегли се 1 карта от тестето (освен ако не е активен бафът за 10 карти в ръката).</li>
                  <li><strong>Фаза на действие:</strong> Изиграване на карти, атакуване с карти на полето, активиране на способности.</li>
                  <li><strong>Край на хода:</strong> Всички карти на полето възстановяват живота си до базовата стойност (изчистват се временни бафове на живот), броячите на стън намаляват с 1, ходът се предава на другия играч.</li>
                </ol>
              </div>
            ) : (
              <div>
                <ol>
                  <li><strong>Start of Turn:</strong> Reset cards played counter, reset attack status of friendly board cards. Draw 1 card from the deck (unless the 10-card hand buff is active).</li>
                  <li><strong>Action Phase:</strong> Play cards, attack with friendly board cards, use abilities.</li>
                  <li><strong>End of Turn:</strong> Reset all board cards' HP to base values (temporary HP increases are cleared), decrement stun counters, swap active player.</li>
                </ol>
              </div>
            )}
          </section>

          {/* Section 6: Play Limits */}
          <section id="limits">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.limits}</h2>
            {language === 'bg' ? (
              <div>
                <p>Броят карти, които можете да изиграете от ръката си за един ход, зависи от текущите ви жизнени точки (LP):</p>
                <ul>
                  <li><strong>LP &gt; 100:</strong> Максимум 1 карта на ход.</li>
                  <li><strong>LP между 51 и 100:</strong> Максимум 2 карти на ход.</li>
                  <li><strong>LP ≤ 50:</strong> Максимум 3 карти на ход.</li>
                  <li><strong>Активен баф за 10 карти в ръката:</strong> Максимум 3 карти на ход (независимо от LP).</li>
                </ul>
              </div>
            ) : (
              <div>
                <p>The number of cards you can play from your hand in a single turn depends on your current Life Points (LP):</p>
                <ul>
                  <li><strong>LP &gt; 100:</strong> Play up to 1 card per turn.</li>
                  <li><strong>LP 51 to 100:</strong> Play up to 2 cards per turn.</li>
                  <li><strong>LP ≤ 50:</strong> Play up to 3 cards per turn.</li>
                  <li><strong>10-Card Hand Buff Active:</strong> Play up to 3 cards per turn (regardless of LP).</li>
                </ul>
              </div>
            )}
          </section>

          {/* Section 7: Normal Card Powers */}
          <section id="normal">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.normal}</h2>
            {language === 'bg' ? (
              <div>
                <p>Когато изигравате нормална карта, избирате една от двете сили на нейната боя:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <div>
                    <span style={suitStyle('diamonds')}>♦ Каро:</span>
                    <br />• <strong>Набиране (Recruit):</strong> Изтеглете 1 карта от тестето си.
                    <br />• <strong>Берсерк (Berserk/Haste):</strong> Картата може да атакува в същия ход, в който е изиграна.
                  </div>
                  <div>
                    <span style={suitStyle('hearts')}>♥ Купа:</span>
                    <br />• <strong>Захранване (Feed/Heal):</strong> Излекувайте приятелска карта на полето или вашите LP със стойността на изиграната карта. <em>Овърхийл (Overheal):</em> Ако лекувате LP над 150, излишното лечение се нанася като щета на опонента!
                    <br />• <strong>Източване (Sap):</strong> Нанесете директна щета на опонента равна на стойността на картата.
                  </div>
                  <div>
                    <span style={suitStyle('spades')}>♠ Пика:</span>
                    <br />• <strong>Бастион (Bulwark/Tank):</strong> Картата става Танк. Враговете трябва задължително да атакуват Танковете преди да могат да атакуват други карти или вас директно.
                    <br />• <strong>Нокаут (Knock Out/Stun):</strong> Зашеметете 1 вражеска нормална карта за 1 ход.
                  </div>
                  <div>
                    <span style={suitStyle('clubs')}>♣ Спатия:</span>
                    <br />• <strong>Камикадзе (Kamikaze/AOE):</strong> Нанесете щета на ВСИЧКИ вражески карти на полето, равна на стойността на картата. Вашата карта се самоунищожава незабавно.
                    <br />• <strong>Детонация (Detonate):</strong> Нанесете щета на една вражеска карта равна на стойността на изиграната карта. Вашата карта остава на полето.
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p>When playing a normal card, you choose one of two abilities based on its suit:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <div>
                    <span style={suitStyle('diamonds')}>♦ Diamonds:</span>
                    <br />• <strong>Recruit:</strong> Draw 1 card from your deck.
                    <br />• <strong>Berserk (Haste):</strong> The card can attack on the same turn it is played.
                  </div>
                  <div>
                    <span style={suitStyle('hearts')}>♥ Hearts:</span>
                    <br />• <strong>Feed (Heal):</strong> Heal a friendly board card or your LP by the played card's value. <em>Overheal:</em> If healing LP beyond the maximum, the excess heal is dealt to the opponent's LP as direct damage!
                    <br />• <strong>Sap:</strong> Deal direct damage to opponent's LP equal to the played card's value.
                  </div>
                  <div>
                    <span style={suitStyle('spades')}>♠ Spades:</span>
                    <br />• <strong>Bulwark (Tank):</strong> The card becomes a Tank. Enemies must target Tanks before attacking any other cards or your LP directly.
                    <br />• <strong>Knock Out (Stun):</strong> Stun one enemy normal card for 1 turn.
                  </div>
                  <div>
                    <span style={suitStyle('clubs')}>♣ Clubs:</span>
                    <br />• <strong>Kamikaze (AOE):</strong> Deal damage to all enemy board cards equal to the card's value. The card self-destructs and goes directly to the Defeated pile.
                    <br />• <strong>Detonate:</strong> Deal damage to one enemy board card equal to the card's value. The card remains on the board.
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 8: Summoning Sickness */}
          <section id="sickness">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.sickness}</h2>
            {language === 'bg' ? (
              <p>Всички карти изпитват треска при призоваване. Те не могат да атакуват в хода, в който влизат на полето, освен ако нямат способността <strong>Берсерк (Haste)</strong>.</p>
            ) : (
              <p>All newly summoned cards suffer from summoning sickness. They cannot attack on the turn they enter the board unless they have the <strong>Berserk (Haste)</strong> ability.</p>
            )}
          </section>

          {/* Section 9: Elite Card Abilities */}
          <section id="elite">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.elite}</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>{language === 'bg' ? 'Карта' : 'Card'}</th>
                    <th style={{ padding: '8px' }}>{language === 'bg' ? 'Способност 1' : 'Ability 1'}</th>
                    <th style={{ padding: '8px' }}>{language === 'bg' ? 'Способност 2' : 'Ability 2'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}><span style={suitStyle('diamonds')}>♦ J, Q, K</span></td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Haste + Теглене на 1/2/3 карти' : 'Haste + Draw 1/2/3 cards'}</td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Вземане на щит (Shield)' : 'Gain a Shield bubble'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}><span style={suitStyle('diamonds')}>♦ A</span></td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Подложка (Underlay)' : 'Underlay (Attach under board Elite)'}</td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Двамата играчи теглят по 4 карти' : 'Both players draw 4 cards'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}><span style={suitStyle('hearts')}>♥ J, Q, K</span></td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Контрол на ума над опонентска карта с ATK ≤ 12/13/14' : 'Mind Control enemy card with ATK ≤ 12/13/14'}</td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Лекува приятелските с 12/13/14 и нанася 12/13/14 на врага' : 'Heal all friendly by 12/13/14 and deal 12/13/14 direct damage to opponent'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}><span style={suitStyle('hearts')}>♥ A</span></td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Подложка (Underlay)' : 'Underlay'}</td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Двамата играчи: +50 макс LP и +50 текущи LP' : 'Both players: maxLP += 50, LP += 50'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}><span style={suitStyle('spades')}>♠ J, Q, K</span></td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Става Танк + Стън на вражеското поле за 1/2/3 хода' : 'Become Tank + Stun all enemy board for 1/2/3 turns'}</td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Търси в тестето/гробището Елитна карта (до ранг J/Q/K)' : 'Search deck/defeated for Elite (rank up to J/Q/K) & draw it'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}><span style={suitStyle('spades')}>♠ A</span></td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Подложка (Underlay)' : 'Underlay'}</td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Зашеметява ЦЯЛОТО поле за 4 хода (и двете страни)' : 'Stun ENTIRE board (all cards, both sides) for 4 turns'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}><span style={suitStyle('clubs')}>♣ J, Q, K</span></td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Нанася 12/13/14 щета на цялото вражеско поле' : 'Deal 12/13/14 damage to all enemy board'}</td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Призовава 2/3/4 убити нормални Спатии (стойност < 12/13/14)' : 'Summon 2/3/4 defeated normal Clubs (value < 12/13/14)'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}><span style={suitStyle('clubs')}>♣ A</span></td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'Подложка (Underlay)' : 'Underlay'}</td>
                    <td style={{ padding: '8px' }}>{language === 'bg' ? 'БОРД УАЙП: Разрушава всички карти на полето' : 'BOARD WIPE: Destroy all cards on both sides'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 10: Ace Underlay System */}
          <section id="underlay">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.underlay}</h2>
            {language === 'bg' ? (
              <div>
                <p>Асата имат уникална механика — могат да бъдат подложени под Елитна карта на вашето поле, вместо да се използват за тяхната втора способност:</p>
                <ul>
                  <li><strong>Ограничения:</strong> Не можете да подлагате под зашеметен (Stunned) елит. Асото трябва да е от различна боя от елитната карта.</li>
                  <li><strong>Ефект:</strong> Прикаченото Асо активира бонуса на своята боя върху елитната карта (например: Асо Каро дава способността на Каро на онова Елитно).</li>
                  <li>Асата подложки или тези, използвани за втора способност, отиват в купчината с победени карти след използване (те никога не се изиграват директно като самостоятелни единици на полето).</li>
                </ul>
              </div>
            ) : (
              <div>
                <p>Aces have a unique mechanic: they can be attached under an Elite card on your board instead of using their second ability.</p>
                <ul>
                  <li><strong>Rules:</strong> Cannot attach under a stunned Elite. The Ace's suit must differ from the target Elite's suit.</li>
                  <li><strong>Effect:</strong> The Ace grants its suit ability to the target Elite (e.g., Diamond Ace under a Spades Elite grants it Diamond powers).</li>
                  <li>Aces used as underlays or for their second ability go to the Defeated pile after resolve (they never stand on the board as independent units).</li>
                </ul>
              </div>
            )}
          </section>

          {/* Section 11: Combat */}
          <section id="combat">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.combat}</h2>
            {language === 'bg' ? (
              <div>
                <ul>
                  <li><strong>Задължително нападане на Танкове:</strong> Ако опонентът има активни, незашеметени Танкове на полето, вие сте длъжни да атакувате един от тях. Не можете да атакувате други единици или играча директно.</li>
                  <li><strong>Зашеметени защитници:</strong> Зашеметените защитници нанасят 0 контра-щета по време на битка.</li>
                  <li><strong>Щитове (Shield):</strong> Щитът абсорбира изцяло щетите от следващата атака. Ако нанесената щета е равна или по-голяма от текущите HP на защитника, щитът се пука и изчезва. Ако щетата е по-малка от HP на защитника, щитът остава.</li>
                  <li><strong>Преливаща щета (Excess Damage):</strong> Ако атакуващата карта има по-голяма ATK от защитника, разликата между атаката и текущия живот на защитника се нанася като щета директно върху жизнените точки на защитника. Ако защитникът има по-голяма ATK, разликата се нанася върху вашите собствени LP.</li>
                  <li><strong>Директна атака:</strong> Можете да атакувате опонента директно само ако той няма незашеметени Танкове на полето.</li>
                </ul>
              </div>
            ) : (
              <div>
                <ul>
                  <li><strong>Tank Forcing:</strong> If your opponent has active, non-stunned Tanks on the board, you MUST attack one of them. You cannot attack other units or target their LP directly.</li>
                  <li><strong>Stunned Defenders:</strong> Stunned cards deal 0 counter-damage during combat.</li>
                  <li><strong>Shield Logic:</strong> A Shield bubble absorbs the damage of the next hit. If incoming damage is greater than or equal to the defender's current HP, the shield pops (disappears). If damage is strictly lower than the defender's current HP, the shield remains intact.</li>
                  <li><strong>Excess Damage:</strong> If the attacker's ATK exceeds the defender's current HP, the surplus damage (ATK minus defender's HP) is dealt directly to the defender player's LP. If the defender's ATK is higher than the attacker's, the excess damage goes to the attacker player's LP instead.</li>
                  <li><strong>Direct Attack:</strong> You can only attack the opponent directly if they have no active, non-stunned Tanks on the board.</li>
                </ul>
              </div>
            )}
          </section>

          {/* Section 12: Special Mechanics */}
          <section id="special">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.special}</h2>
            {language === 'bg' ? (
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: '12px 0 6px 0' }}>Баф при 10 карти в ръката</h3>
                <p>Активира се, когато имате точно 10 карти в ръката.</p>
                <ul>
                  <li>Лимитът за изиграване на карти става 3.</li>
                  <li>Активират се едновременно и двете сили на нормалните карти при изиграване (двойна активация).</li>
                  <li>Фазата на теглене в началото на хода се блокира (не теглите карта).</li>
                  <li>Деактивира се в края на хода, ако имате 6 или по-малко карти в ръката.</li>
                </ul>
                <h3 style={{ fontSize: '1.1rem', margin: '12px 0 6px 0' }}>Баф на Бордовата бариера</h3>
                <p>Активира се, когато имате 10 или повече карти на полето. Всички ваши карти получават щит. Деактивира се, когато броят на картите ви на полето спадне до 6 или по-малко.</p>
                <h3 style={{ fontSize: '1.1rem', margin: '12px 0 6px 0' }}>Теглене при умора (Fatigue Draw)</h3>
                <p>Ако тестето ви се изпразни, започвате да теглите от общата купчина с победени карти (FIFO ред). Всеки път, когато теглите карта при умора, получавате прогресивно нарастваща щета (1 за първата, 2 за втората и т.н.).</p>
                <h3 style={{ fontSize: '1.1rem', margin: '12px 0 6px 0' }}>Овърхийл (Overheal)</h3>
                <p>Когато лекувате своите LP и превишите максимума (обикновено 150), излишъкът се пренасочва като щета по опонента. Това може да доведе до победа!</p>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: '12px 0 6px 0' }}>10-Card Hand Buff</h3>
                <p>Activates when your hand size reaches exactly 10 cards.</p>
                <ul>
                  <li>Your play limit becomes 3 cards per turn.</li>
                  <li>Both normal card powers trigger simultaneously upon playing (Dual Activation).</li>
                  <li>Your starting draw step is frozen (you skip drawing a card).</li>
                  <li>Deactivates at the end of a turn if your hand drops to 6 cards or fewer.</li>
                </ul>
                <h3 style={{ fontSize: '1.1rem', margin: '12px 0 6px 0' }}>Board Barrier Buff</h3>
                <p>Activates when you control 10 or more cards on the board. All friendly board cards gain a Shield bubble. Deactivates if your board presence drops to 6 cards or fewer.</p>
                <h3 style={{ fontSize: '1.1rem', margin: '12px 0 6px 0' }}>Fatigue Draw</h3>
                <p>If your deck is empty, you must draw from the shared Defeated pile in FIFO order. Each fatigue draw deals escalating damage to your LP (1st draw deals 1, 2nd deals 2, 3rd deals 3, etc.).</p>
                <h3 style={{ fontSize: '1.1rem', margin: '12px 0 6px 0' }}>Overheal</h3>
                <p>When healing your LP past your maximum capacity, the excess healing amount is converted into damage dealt directly to the opponent's LP. This damage can win you the game!</p>
              </div>
            )}
          </section>

          {/* Section 13: Forbidden Turn Restrictions */}
          <section id="forbidden">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.forbidden}</h2>
            {language === 'bg' ? (
              <div>
                <p>За да се предотврати твърде бързото приключване на играта, са въведени забрани за изиграни карти според номера на хода:</p>
                <ul>
                  <li><strong>Ход 1:</strong> Забранени са нормалните карти със стойност 10, както и елитите J, Q, K.</li>
                  <li><strong>Ход 2:</strong> Забранени са елитните карти J, Q, K.</li>
                  <li><strong>Ход 3:</strong> Забранени са елитните карти Q, K.</li>
                  <li><strong>Ход 4:</strong> Забранени са елитните карти K.</li>
                  <li><strong>Ход 5+:</strong> Няма никакви ограничения.</li>
                  <li><em>Асата (А) никога не са ограничени и могат да се играят по всяко време.</em></li>
                </ul>
              </div>
            ) : (
              <div>
                <p>To slow down initial pacing, certain card restrictions apply based on the current turn number:</p>
                <ul>
                  <li><strong>Turn 1:</strong> Cannot play normal cards with value 10, and elite cards J, Q, K.</li>
                  <li><strong>Turn 2:</strong> Cannot play elite cards J, Q, K.</li>
                  <li><strong>Turn 3:</strong> Cannot play elite cards Q, K.</li>
                  <li><strong>Turn 4:</strong> Cannot play elite cards K.</li>
                  <li><strong>Turn 5+:</strong> No turn restrictions apply.</li>
                  <li><em>Aces (A) are never restricted and can be played at any time.</em></li>
                </ul>
              </div>
            )}
          </section>

          {/* Section 14: Victory Conditions */}
          <section id="victory">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.victory}</h2>
            {language === 'bg' ? (
              <p>Играта приключва веднага щом един от играчите остане с 0 или по-малко жизнени точки (LP). Другият играч печели играта. Свалянето на LP може да стане чрез директни атаки, бойна преливаща щета, източване (Sap), умора от празно тесте, овърхийл или симетричния взрив на елитни Купи.</p>
            ) : (
              <p>The game ends immediately when a player's Life Points (LP) drop to 0 or below. The other player is declared the winner. LP can be reduced via direct attacks, combat excess damage, Sap abilities, fatigue draw damage, overheal excess, or symmetrical Heart elite bursts.</p>
            )}
          </section>

          {/* Section 15: Defeated Pile */}
          <section id="defeated">
            <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>{t.sections.defeated}</h2>
            {language === 'bg' ? (
              <p>Всички унищожени, изиграни или изхвърлени карти отиват в общата купчина с победени карти. Тя се използва за теглене при изчерпано тесте (умора) или за призоваване от гробището (способности на елитни Спатии).</p>
            ) : (
              <p>All destroyed, played, or discarded cards enter a shared Defeated pile. This pile acts as a source for fatigue draws when decks are empty and can be resurrected from using Club elite abilities.</p>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
