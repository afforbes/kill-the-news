/* Seriousness scoring for headlines. Shared by the GitHub Action (scripts/fetch-headlines.mjs)
   and the game (index.html), so a headline scores the same wherever it is scored.

   Lexicon-based sentiment analysis tuned for UK news headlines rather than general text:
   tiered gravity terms, casualty-count detection, intensifiers, hedges, and a positive
   lexicon for the good-news flag. Returns a 1–6 severity (hits to kill) plus a good flag. */
(function (root) {
  const T = (words, w) => words.map(x => [new RegExp('\\b(?:' + x + ')\\b', 'i'), w]);
  const GRAVITY = [
    ...T(['massacre', 'genocide', 'nuclear', 'famine', 'war', 'warfare', 'air ?strikes?', 'missiles?', 'bombs?', 'bombings?', 'bombed', 'terror', 'terrorists?', 'terrorism',
      'earthquake', 'tsunami', 'pandemic', 'mass shooting', 'murders?', 'murdered', 'kills?', 'killed', 'killing', 'dead', 'deaths?', 'death toll', 'dies', 'died', 'dying',
      'hostages?', 'beheaded', 'slaughter(?:ed)?', 'executed', 'execution', 'atrocit(?:y|ies)', 'war crimes?', 'chemical weapons?', 'ethnic cleansing', 'suicide bomb\\w*'], 4),
    ...T(['attacks?', 'attacked', 'stabbings?', 'stabbed', 'shootings?', 'shot', 'gunman', 'gunmen', 'explosions?', 'blasts?', 'crash(?:es|ed)?', 'collapses?', 'collapsed',
      'wildfires?', 'floods?', 'flooding', 'hurricane', 'cyclone', 'typhoon', 'tornado', 'outbreak', 'epidemic', 'rape', 'raped', 'rapist', 'abuse', 'abused', 'assault(?:ed)?',
      'kidnapp?(?:ed|ing)?', 'abduct(?:ed|ion)', 'missing', 'crisis', 'invasion', 'invades?', 'troops', 'ceasefire', 'refugees?', 'evacuat\\w*', 'drown(?:ed|s|ing)?', 'fatal(?:ly)?',
      'critical condition', 'life-threatening', 'manslaughter', 'overdose', 'paedophile', 'grooming', 'trafficking', 'famine', 'starv\\w+', 'siege', 'shelling', 'drone strikes?',
      'wounded', 'casualt(?:y|ies)', 'bodies', 'body found', 'remains found', 'grief', 'mourn\\w*', 'funeral', 'tragedy', 'tragic', 'horror', 'horrific', 'devastat\\w+', 'deadly', 'lethal'], 3),
    ...T(['arrest(?:ed|s)?', 'charged', 'jailed', 'prison', 'guilty', 'convicted', 'sentenced', 'court', 'trial', 'police', 'inquiry', 'inquest', 'scandal', 'resigns?', 'resignation',
      'sacked', 'strikes?', 'walkout', 'protests?', 'riots?', 'unrest', 'clashes', 'recession', 'inflation', 'unemployment', 'bankrupt\\w*', 'administration', 'redundanc\\w+', 'job (?:cuts|losses)',
      'cuts', 'austerity', 'NHS', 'waiting lists?', 'A&E', 'warns?', 'warning', 'threat(?:s|ens|ened)?', 'sanctions', 'tariffs?', 'climate', 'emergency', 'hospital', 'cancer', 'injured', 'injur(?:y|ies)',
      'hurt', 'victims?', 'suspect', 'probe', 'fraud', 'corruption', 'extremis\\w+', 'far[- ]right', 'racis\\w+', 'hate crime', 'jury', 'knife', 'gun', 'weapons?', 'migrants?', 'asylum', 'small boats?',
      'deport\\w*', 'homeless\\w*', 'poverty', 'food banks?', 'debt', 'default', 'collapse', 'meltdown', 'chaos', 'rampage', 'fears?', 'fear(?:ed|ing)', 'alarm', 'danger\\w*', 'toxic', 'contaminat\\w+'], 2),
    ...T(['ministers?', 'government', 'PM', 'prime minister', 'Starmer', 'Downing Street', 'No ?10', 'parliament', 'MPs?', 'Commons', 'Lords', 'elections?', 'votes?', 'budget', 'tax(?:es)?',
      'prices', 'bills', 'energy', 'mortgages?', 'interest rates?', 'Bank of England', 'councils?', 'row', 'backlash', 'criticis\\w+', 'fury', 'furious', 'slams?', 'blasts?', 'accuses?', 'accused',
      'Reform', 'Tor(?:y|ies)', 'Labour', 'Lib Dems?', 'Farage', 'Badenoch', 'Trump', 'Putin', 'Netanyahu', 'Zelensky', 'Ukraine', 'Russia', 'Gaza', 'Israel', 'Iran', 'China', 'NATO', 'EU', 'Brexit',
      'economy', 'GDP', 'growth', 'markets?', 'FTSE', 'pound', 'shares', 'regulator', 'watchdog', 'ban(?:ned|s)?', 'crackdown', 'reforms?', 'welfare', 'benefits', 'pensions?', 'housing', 'rent'], 1)
  ];
  const POSITIVE = T(['wins?', 'won', 'victory', 'triumph\\w*', 'celebrat\\w+', 'rescued', 'saved', 'reunited', 'cured?', 'breakthrough', 'awards?', 'honou?red', 'joy', 'hope', 'adorable', 'cute',
    'puppy', 'puppies', 'kitten', 'wedding', 'birthday', 'festival', 'bounces? back', 'found (?:safe|alive)', 'safe and well', 'success\\w*', 'record (?:low|number of)', 'cheers?', 'delight\\w*',
    'heartwarming', 'free (?:school )?meals', 'good news', 'thrives?', 'thriving', 'boost', 'surges? in support', 'recover(?:s|ed|y)', 'returns? home', 'jackpot', 'hero(?:es|ic)?', 'lifesaving', 'life-saving'], 1);
  const FLUFF = T(['celebrit(?:y|ies)', 'stars?', 'royals?', 'Strictly', 'Love Island', 'reality', 'TV', 'telly', 'film', 'movie', 'Netflix', 'fashion', 'kebab', 'pub', 'cats?', 'dogs?', 'goose',
    'puffins?', 'this is why', 'the one thing', 'reveals?', 'revealed', "I'?m a Celebrity", 'footballer', 'transfer', 'Premier League', 'Oscars?', 'Bafta', 'glamorous', 'stuns?', 'bikini', 'sizzles?',
    'red carpet', 'recipe', 'dating', 'romance', 'split', 'ex-?(?:wife|husband|boyfriend|girlfriend)', 'influencer', 'TikTok', 'Instagram', 'selfie', 'cuddl\\w+', 'quiz', 'crossword', 'horoscope',
    'pumpkin', 'Halloween', 'Christmas', 'holiday', 'villa', 'garden', 'bake', 'cake', 'tea', 'biscuit'], 1);
  // Figures of speech that borrow violent words: neutralised before scoring.
  const IDIOMS = /\b(war of words|price war|bidding war|war chest|horror (?:film|movie|flick|genre|'s)|horror(?:'s)? greatest|box[- ]office (?:bomb|hit)|killer (?:app|look|outfit|heels)|dead (?:heat|ringer|cert|end)|drop[- ]dead|dying to|to die for|blast from the past|crash course|attack on (?:the )?title|strike (?:rate|partner|gold)|shoot(?:s|ing)? (?:for|a video|a film)|a shot at|crisis talks? over (?:the )?(?:squad|team))\b/gi;
  const INTENSIFIER = /\b(horror|horrific|tragic|devastating|deadly|brutal|bloody|chilling|sickening|shocking|savage|monster|evil)\b/i;
  const HEDGE = /\b(could|may|might|fears|feared|set to|warned|risk|threatens?)\b|\?/i;
  const CASUALTY2 = /\b(kills?|killed|dead|died|die|injures?|injured|wounded|missing)\s+(?:at least\s+|up to\s+|more than\s+|over\s+|nearly\s+|almost\s+)?(\d{1,3}(?:,\d{3})*|dozens|scores|hundreds|thousands|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty)\b/i;
  const CASUALTY = /\b(\d{1,3}(?:,\d{3})*|dozens|scores|hundreds|thousands|several|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty)\s+(?:people\s+|more\s+|others\s+|children\s+|civilians\s+|soldiers\s+)?(?:are\s+|were\s+|been\s+|left\s+)?(dead|killed|die|died|injured|missing|hurt|wounded|feared dead)\b/i;
  const BIG = /\b(hundreds|thousands|\d{3,}|\d{1,3},\d{3})\b/i;

  function scoreHeadline(text) {
    const h = String(text || '').replace(/[\u2018\u2019\u02bc]/g, "'").replace(IDIOMS, ' ');
    let gravity = 0, positive = 0, fluff = 0;
    const hits = [];
    // Each tier counts fully once; repeats in the same tier add only a little, so "dead ... death" isn't double-scored.
    const tierHits = {};
    for (const [re, w] of GRAVITY) { const m = h.match(re); if (m) { tierHits[w] = (tierHits[w] || 0) + 1; hits.push(m[0] + ':+' + w); } }
    for (const w in tierHits) gravity += +w + Math.min(2, tierHits[w] - 1) * (+w * 0.25);
    for (const [re] of POSITIVE) { const m = h.match(re); if (m) { positive += 1; hits.push(m[0] + ':good'); } }
    for (const [re] of FLUFF) { const m = h.match(re); if (m) { fluff += 1; hits.push(m[0] + ':fluff'); } }
    let score = gravity;
    let c = h.match(CASUALTY); let num = c && c[1];
    if (!c) { c = h.match(CASUALTY2); num = c && c[2]; }
    if (c) { score += BIG.test(num) ? 3 : 2; hits.push(c[0] + ':casualties'); }
    if (INTENSIFIER.test(h)) score += 1;
    if (HEDGE.test(h) && gravity < 6) score -= 0.5;
    score -= Math.min(2, fluff) * 1.0;
    score -= Math.min(2, positive) * 0.75;
    // Capital-letter shouting (Mail house style) says nothing about seriousness; ignore it.
    const sev = score <= 0.5 ? 1 : score <= 2 ? 2 : score <= 4 ? 3 : score <= 6.5 ? 4 : score <= 8.5 ? 5 : 6;
    const good = positive > 0 && gravity <= 1 && !c;
    return { sev, good, score: Math.round(score * 100) / 100, hits };
  }
  root.scoreHeadline = scoreHeadline;
  if (typeof module !== 'undefined' && module.exports) module.exports = { scoreHeadline };
})(typeof globalThis !== 'undefined' ? globalThis : this);
