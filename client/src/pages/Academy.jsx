import { useState } from 'react';

// ─── Books & Novels Library ───────────────────────────────────────────────────
const BOOKS = [
  // ── Investing classics ─────────────────────────────────────────────────────
  { id: 1,  col: '#00e5ff', title: 'The Intelligent Investor',            author: 'Benjamin Graham',      year: 1949, pages: 640, genre: ['Value Investing','Classic'],       cover: 'II',  link: 'https://www.google.com/search?q=The+Intelligent+Investor+Benjamin+Graham+book+summary', summary: 'The definitive book on value investing. Graham\'s philosophy of "Mr. Market" and margin of safety has guided generations of investors including Warren Buffett. Learn to distinguish between investing and speculating, and how to build a portfolio that weathers any market.' },
  { id: 2,  col: '#00d68f', title: 'Rich Dad Poor Dad',                   author: 'Robert Kiyosaki',      year: 1997, pages: 207, genre: ['Personal Finance','Mindset'],      cover: 'RD',  link: 'https://www.google.com/search?q=Rich+Dad+Poor+Dad+Kiyosaki+book+review+lessons', summary: 'Kiyosaki contrasts the financial philosophies of his educated but financially struggling father (Poor Dad) and his friend\'s entrepreneurial father (Rich Dad). A paradigm-shifting read about assets, liabilities, and building wealth through financial education.' },
  { id: 3,  col: '#f0a500', title: 'A Random Walk Down Wall Street',      author: 'Burton Malkiel',       year: 1973, pages: 464, genre: ['Index Investing','Theory'],        cover: 'RW',  link: 'https://www.google.com/search?q=A+Random+Walk+Down+Wall+Street+Malkiel+summary', summary: 'Malkiel argues that stock prices are essentially random and that active management rarely beats passive index investing. A compelling case for low-cost index funds backed by decades of market data and academic research.' },
  { id: 4,  col: '#7c6af7', title: 'One Up On Wall Street',               author: 'Peter Lynch',          year: 1989, pages: 304, genre: ['Stock Picking','Beginner'],        cover: 'OW',  link: 'https://www.google.com/search?q=One+Up+On+Wall+Street+Peter+Lynch+book', summary: 'Lynch explains how ordinary investors can outperform Wall Street professionals by investing in what they know. Packed with real stories from his legendary run managing the Magellan Fund at Fidelity.' },
  { id: 5,  col: '#f06292', title: 'Security Analysis',                   author: 'Graham & Dodd',        year: 1934, pages: 725, genre: ['Value Investing','Advanced'],       cover: 'SA',  link: 'https://www.google.com/search?q=Security+Analysis+Graham+Dodd+book+summary', summary: 'The foundational text of fundamental analysis. Graham and Dodd laid the intellectual groundwork for modern investing, teaching how to evaluate bonds, preferred stocks, and common stocks with rigorous financial scrutiny.' },
  { id: 6,  col: '#fb923c', title: 'The Little Book of Common Sense Investing', author: 'John Bogle',   year: 2007, pages: 216, genre: ['Index Investing','Beginner'],       cover: 'LB',  link: 'https://www.google.com/search?q=The+Little+Book+of+Common+Sense+Investing+Bogle', summary: 'Vanguard founder Bogle makes a passionate case for index fund investing. Cost-efficient, tax-advantaged, and proven to outperform most active managers over long periods — the core message is simple and powerful.' },
  { id: 7,  col: '#34d399', title: 'Market Wizards',                      author: 'Jack Schwager',        year: 1988, pages: 464, genre: ['Trading','Interviews'],             cover: 'MW',  link: 'https://www.google.com/search?q=Market+Wizards+Jack+Schwager+book+review', summary: 'Schwager interviews the world\'s greatest traders — from Paul Tudor Jones to Michael Marcus — uncovering the techniques, mindsets, and disciplines behind extraordinary trading success. Essential reading for aspiring traders.' },
  // ── Business novels / narratives ─────────────────────────────────────────
  { id: 8,  col: '#f472b6', title: 'Flash Boys',                          author: 'Michael Lewis',        year: 2014, pages: 288, genre: ['HFT','Novel','Finance'],            cover: 'FB',  link: 'https://www.google.com/search?q=Flash+Boys+Michael+Lewis+book+summary', summary: 'Lewis exposes the world of high-frequency trading and how a small group of Wall Street insiders rigged the stock market. Reads like a thriller — a gripping look at how technology transformed modern markets.' },
  { id: 9,  col: '#60a5fa', title: 'The Big Short',                       author: 'Michael Lewis',        year: 2010, pages: 266, genre: ['Crisis','Novel','Finance'],         cover: 'BS',  link: 'https://www.google.com/search?q=The+Big+Short+Michael+Lewis+book+review', summary: 'The true story of a small group of investors who saw the 2008 financial crisis coming and bet against the housing market. A brilliantly written narrative about greed, delusion, and the mortgage bond industry.' },
  { id: 10, col: '#a78bfa', title: 'Liar\'s Poker',                       author: 'Michael Lewis',        year: 1989, pages: 249, genre: ['Wall Street','Novel','Memoir'],      cover: 'LP',  link: 'https://www.google.com/search?q=Liars+Poker+Michael+Lewis+book+Wall+Street', summary: 'Lewis\'s memoir of life as a bond salesman at Salomon Brothers in the 1980s. A funny, devastating portrait of Wall Street excess and the birth of the mortgage bond market that would later cause the 2008 crisis.' },
  { id: 11, col: '#fbbf24', title: 'Thinking, Fast and Slow',             author: 'Daniel Kahneman',      year: 2011, pages: 499, genre: ['Behavioural Finance','Psychology'],   cover: 'TF',  link: 'https://www.google.com/search?q=Thinking+Fast+and+Slow+Kahneman+book+summary', summary: 'Nobel laureate Kahneman explores the two systems that drive thinking — intuitive System 1 and deliberate System 2. Essential for understanding cognitive biases that affect investment decision-making.' },
  { id: 12, col: '#10b981', title: 'The Psychology of Money',             author: 'Morgan Housel',        year: 2020, pages: 256, genre: ['Behavioural Finance','Modern'],       cover: 'PM',  link: 'https://www.google.com/search?q=The+Psychology+of+Money+Morgan+Housel+book+lessons', summary: 'Housel shares 19 short stories about the strange ways people think about money. A refreshing, modern take on the roles that luck, greed, fear, and compounding play in building (or destroying) wealth.' },
  { id: 13, col: '#ef4444', title: 'When Genius Failed',                  author: 'Roger Lowenstein',     year: 2000, pages: 264, genre: ['Hedge Funds','Crisis','Novel'],       cover: 'WG',  link: 'https://www.google.com/search?q=When+Genius+Failed+Lowenstein+LTCM+book', summary: 'The story of Long-Term Capital Management and how a hedge fund staffed by Nobel laureates and Wall Street legends nearly collapsed the global financial system in 1998. A masterclass in risk management — and its limits.' },
  { id: 14, col: '#06b6d4', title: 'Reminiscences of a Stock Operator',  author: 'Edwin Lefèvre',        year: 1923, pages: 299, genre: ['Trading','Classic','Novel'],          cover: 'RS',  link: 'https://www.google.com/search?q=Reminiscences+of+a+Stock+Operator+Lefevre+review', summary: 'A thinly veiled biography of legendary trader Jesse Livermore. Despite being 100 years old, its lessons on speculation, market psychology, and discipline remain as relevant as ever. A must-read for traders.' },
  { id: 15, col: '#84cc16', title: 'The Essays of Warren Buffett',        author: 'Lawrence Cunningham',  year: 1997, pages: 336, genre: ['Value Investing','Classic'],          cover: 'EB',  link: 'https://www.google.com/search?q=The+Essays+of+Warren+Buffett+Cunningham+book', summary: 'A curated collection of Buffett\'s legendary annual shareholder letters, organized thematically. Covers corporate governance, accounting, valuation, and the principles behind Berkshire Hathaway\'s success.' },
  { id: 16, col: '#f97316', title: 'Fooled by Randomness',                author: 'Nassim Taleb',         year: 2001, pages: 316, genre: ['Probability','Philosophy'],           cover: 'FR',  link: 'https://www.google.com/search?q=Fooled+by+Randomness+Nassim+Taleb+book+summary', summary: 'Taleb explores the role of luck and randomness in markets and life. A profound challenge to the notion that success is purely the result of skill — essential reading for anyone who analyses financial outcomes.' },
  { id: 17, col: '#8b5cf6', title: 'The Black Swan',                      author: 'Nassim Taleb',         year: 2007, pages: 444, genre: ['Probability','Philosophy'],           cover: 'BK',  link: 'https://www.google.com/search?q=The+Black+Swan+Nassim+Taleb+book+explained', summary: 'Taleb introduces the concept of "Black Swan" events — rare, high-impact events that are nearly impossible to predict. The book fundamentally changed how investors and risk managers think about tail risk.' },
  { id: 18, col: '#14b8a6', title: 'Barbarians at the Gate',              author: 'Burrough & Helyar',    year: 1989, pages: 541, genre: ['M&A','Novel','Classic'],             cover: 'BG',  link: 'https://www.google.com/search?q=Barbarians+at+the+Gate+RJR+Nabisco+book+review', summary: 'The definitive account of the leveraged buyout of RJR Nabisco, the largest in history at the time. A gripping narrative about corporate greed, ego, and the high-stakes world of private equity and deal-making.' },
  { id: 19, col: '#ec4899', title: 'Too Big to Fail',                     author: 'Andrew Ross Sorkin',   year: 2009, pages: 600, genre: ['Crisis','Novel','Finance'],         cover: 'TBF', link: 'https://www.google.com/search?q=Too+Big+to+Fail+Andrew+Ross+Sorkin+book+2008+crisis', summary: 'Sorkin\'s day-by-day account of the 2008 financial crisis from inside the boardrooms of Lehman Brothers, Goldman Sachs, and the US Treasury. The most comprehensive narrative of the crash that shook the world.' },
  { id: 20, col: '#6366f1', title: 'The Quants',                          author: 'Scott Patterson',      year: 2010, pages: 352, genre: ['Quant','Novel','Finance'],           cover: 'TQ',  link: 'https://www.google.com/search?q=The+Quants+Scott+Patterson+book+Wall+Street+algorithms', summary: 'How a small group of math wizards took over Wall Street and nearly destroyed it. An accessible look at quantitative investing, algorithmic trading, and the personalities behind the "quant revolution".' },
  { id: 21, col: '#22d3ee', title: 'Den of Thieves',                      author: 'James B. Stewart',     year: 1991, pages: 493, genre: ['Insider Trading','Novel'],           cover: 'DT',  link: 'https://www.google.com/search?q=Den+of+Thieves+James+Stewart+book+insider+trading', summary: 'The definitive account of the 1980s insider trading scandal featuring Ivan Boesky and Michael Milken. A page-turning investigation into one of the greatest financial frauds in Wall Street history.' },
  { id: 22, col: '#fb7185', title: 'Beating the Street',                  author: 'Peter Lynch',          year: 1993, pages: 338, genre: ['Stock Picking','Practical'],        cover: 'BTS', link: 'https://www.google.com/search?q=Beating+the+Street+Peter+Lynch+book+summary', summary: 'Lynch\'s follow-up to One Up on Wall Street — a practical guide to researching and selecting individual stocks. Features detailed walkthroughs of real investment decisions made during his Magellan Fund tenure.' },
  // ── Business novels & startup stories ────────────────────────────────────
  { id: 23, col: '#0ea5e9', title: 'Shoe Dog',                            author: 'Phil Knight',          year: 2016, pages: 386, genre: ['Startup','Novel','Memoir'],         cover: 'SD',  link: 'https://www.google.com/search?q=Shoe+Dog+Phil+Knight+Nike+memoir+book', summary: 'Nike founder Phil Knight\'s memoir reads like a gripping novel. From selling Japanese shoes out of a car boot to building a global empire, it\'s a raw and honest story of obsession, debt, failure, and triumph. One of the best business narratives ever written.' },
  { id: 24, col: '#d97706', title: 'The Everything Store',                author: 'Brad Stone',           year: 2013, pages: 384, genre: ['Startup','Novel','Tech'],            cover: 'ES',  link: 'https://www.google.com/search?q=The+Everything+Store+Brad+Stone+Amazon+Bezos+book', summary: 'The definitive account of Amazon and Jeff Bezos. Stone traces the company from a garage in Seattle to the world\'s largest retailer, revealing the ruthless ambition, obsessive customer focus, and near-death moments that shaped the everything store.' },
  { id: 25, col: '#16a34a', title: 'The Goal',                            author: 'Eliyahu Goldratt',     year: 1984, pages: 384, genre: ['Business Novel','Manufacturing'],     cover: 'TG',  link: 'https://www.google.com/search?q=The+Goal+Eliyahu+Goldratt+business+novel+theory+of+constraints', summary: 'Written entirely as a business novel, The Goal follows plant manager Alex Rogo as he fights to save his failing factory in 90 days. Through a fictional narrative, Goldratt teaches the Theory of Constraints — one of the most influential ideas in operations management.' },
  { id: 26, col: '#7f1d1d', title: 'Who Moved My Cheese?',               author: 'Spencer Johnson',      year: 1998, pages: 96, genre: ['Fable','Business Novel','Mindset'],   cover: 'WC',  link: 'https://www.google.com/search?q=Who+Moved+My+Cheese+Spencer+Johnson+book+lessons', summary: 'A timeless parable about two mice and two tiny people navigating a maze in search of cheese — a metaphor for change in work and life. Despite its brevity, this little fable has guided millions through corporate restructurings, career pivots, and personal reinvention.' },
  { id: 27, col: '#0284c7', title: 'Zero to One',                         author: 'Peter Thiel',          year: 2014, pages: 224, genre: ['Startup','Philosophy','Tech'],        cover: 'ZO',  link: 'https://www.google.com/search?q=Zero+to+One+Peter+Thiel+book+startup+lessons', summary: 'PayPal co-founder Thiel argues that true innovation means going from zero to one — creating something new, not copying. A controversial but essential read for entrepreneurs that challenges conventional startup wisdom and celebrates monopoly-building businesses.' },
  { id: 28, col: '#059669', title: 'The Lean Startup',                    author: 'Eric Ries',            year: 2011, pages: 336, genre: ['Startup','Methodology'],             cover: 'LS',  link: 'https://www.google.com/search?q=The+Lean+Startup+Eric+Ries+book+summary+methodology', summary: 'Ries introduces the Build-Measure-Learn feedback loop and the concept of the Minimum Viable Product (MVP). The Lean Startup has changed how entrepreneurs and corporate innovators build products, test hypotheses, and pivot before burning all their cash.' },
  { id: 29, col: '#7c3aed', title: 'Good to Great',                       author: 'Jim Collins',          year: 2001, pages: 320, genre: ['Business Strategy','Leadership'],     cover: 'GG',  link: 'https://www.google.com/search?q=Good+to+Great+Jim+Collins+book+concepts+hedgehog', summary: 'Collins and his team studied 1,435 companies over 40 years to find what makes great companies. The result: the Hedgehog Concept, Level 5 Leadership, and the Flywheel effect — concepts that remain the gold standard of corporate strategy thinking.' },
  { id: 30, col: '#b45309', title: 'The Hard Thing About Hard Things',    author: 'Ben Horowitz',         year: 2014, pages: 304, genre: ['Startup','Leadership','Memoir'],      cover: 'HH',  link: 'https://www.google.com/search?q=The+Hard+Thing+About+Hard+Things+Ben+Horowitz+book', summary: 'a16z co-founder Horowitz gives a brutally honest account of what it actually feels like to run a startup: laying off employees, running out of money, rivals threatening to destroy you, and the lonely process of making decisions with no good answers.' },
  { id: 31, col: '#0e7490', title: 'Business Adventures',                 author: 'John Brooks',          year: 1969, pages: 408, genre: ['Short Stories','Classic','Business'], cover: 'BA',  link: 'https://www.google.com/search?q=Business+Adventures+John+Brooks+book+Bill+Gates+Warren+Buffett', summary: 'Twelve classic stories of American business — from the collapse of the Ford Edsel to the great stock market plunge of 1962. Both Bill Gates and Warren Buffett call it the best business book ever written. Each chapter reads like a standalone short story.' },
  { id: 32, col: '#be185d', title: 'Principles',                          author: 'Ray Dalio',            year: 2017, pages: 592, genre: ['Philosophy','Leadership','Mindset'],  cover: 'PR',  link: 'https://www.google.com/search?q=Principles+Ray+Dalio+book+summary+life+work', summary: 'Bridgewater founder Dalio shares the unconventional life and work principles that enabled him to build the world\'s largest hedge fund. An extraordinarily candid account of failure, learning, and the radical transparency culture that defines Bridgewater.' },
  { id: 33, col: '#2563eb', title: 'Start With Why',                      author: 'Simon Sinek',          year: 2009, pages: 256, genre: ['Leadership','Business Strategy'],     cover: 'SW',  link: 'https://www.google.com/search?q=Start+With+Why+Simon+Sinek+book+Golden+Circle', summary: 'Sinek\'s Golden Circle model — Why → How → What — explains why some leaders and companies inspire exceptional loyalty while others don\'t. He argues that people don\'t buy what you do, they buy why you do it. Packed with examples from Apple, Southwest Airlines, and Martin Luther King.' },
  { id: 34, col: '#dc2626', title: 'Never Split the Difference',          author: 'Chris Voss',           year: 2016, pages: 288, genre: ['Negotiation','Business','Practical'],  cover: 'NS',  link: 'https://www.google.com/search?q=Never+Split+the+Difference+Chris+Voss+negotiation+book', summary: 'Former FBI hostage negotiator Voss reveals that the same techniques used to negotiate with terrorists apply to business deals, salary talks, and everyday life. Tactical empathy, mirroring, the "Black Swan" information gap — this is negotiation retaught from scratch.' },
  { id: 35, col: '#4f46e5', title: 'The $100 Startup',                    author: 'Chris Guillebeau',     year: 2012, pages: 304, genre: ['Startup','Entrepreneurship','Practical'], cover: '$1', link: 'https://www.google.com/search?q=The+100+Startup+Chris+Guillebeau+book+summary', summary: 'Guillebeau profiles 50 ordinary people who turned simple skills into thriving businesses with minimal starting capital. Proof that you don\'t need venture capital, an MBA, or decades of experience to build a profitable lifestyle business.' },
  { id: 36, col: '#065f46', title: 'The Innovator\'s Dilemma',           author: 'Clayton Christensen',  year: 1997, pages: 288, genre: ['Business Strategy','Tech','Classic'],   cover: 'ID',  link: 'https://www.google.com/search?q=The+Innovators+Dilemma+Clayton+Christensen+book+disruptive+innovation', summary: 'Christensen\'s masterwork explains why well-managed companies consistently fail when new disruptive technologies emerge. The book coined "disruptive innovation" — arguably the most influential business concept of the last 30 years.' },
  { id: 37, col: '#92400e', title: 'Steve Jobs',                          author: 'Walter Isaacson',      year: 2011, pages: 656, genre: ['Biography','Novel','Tech'],           cover: 'SJ',  link: 'https://www.google.com/search?q=Steve+Jobs+Walter+Isaacson+biography+book', summary: 'The authorised biography of Apple\'s co-founder, based on 40 interviews with Jobs himself. Isaacson presents a man who was equal parts visionary and tyrant, revealing how his relentless perfectionism, showmanship, and reality distortion field shaped the iPhone era.' },
];

// ─── Short Stories & Business Fables ─────────────────────────────────────────
const STORIES = [
  {
    id: 1, col: '#00e5ff', title: 'The Merchant and the Mirror',
    type: 'Parable', readTime: 4, link: 'https://www.google.com/search?q=business+parables+about+diversification',
    story: `A prosperous merchant in ancient Babylon carried all his gold in one chest on a single ship. His neighbour, a simple fisherman, kept small amounts of silver buried in five different places: under the olive tree, beneath the well, inside the old barn, behind the market, and with his brother in the next village.

One stormy night, the merchant\'s ship sank. He woke bankrupt. The fisherman, hearing the news, said: "I once lost the silver under the olive tree to thieves, and the silver by the well to flood. But never once did I lose everything in a single night."

The merchant rebuilt slowly, this time spreading his gold across many ships, many cities, many traders. Years later he was richer than before — and he kept above his fireplace a mirror with a single word carved into the frame: *Diversify*.`,
    lesson: 'Never put all your wealth in one place. Diversification is the oldest risk management tool known to mankind.',
  },
  {
    id: 2, col: '#00d68f', title: 'The Boy Who Counted Compound Interest',
    type: 'Fable', readTime: 5, link: 'https://www.google.com/search?q=compounding+interest+story+power+of+compounding',
    story: `A young boy named Arjun once asked his grandfather: "If I give you ₹1 every day for 30 days, or if I give you 1 paisa doubled every day for 30 days, which would you prefer?" The grandfather laughed and said, "₹30 is fine, thank you."

Arjun smiled and opened his notebook. Day 1: 1 paisa. Day 5: 16 paise. Day 10: ₹5.12. Day 15: ₹163. Day 20: ₹5,243. Day 25: ₹1.67 lakh. Day 30: ₹53.7 lakh.

The grandfather stared at the notebook in silence for a long time. Then he said quietly: "You have just shown me the most powerful force in the universe. I wasted forty years not understanding this." Arjun tore out the page and pinned it above his grandfather\'s desk. The old man looked at it every morning until he died — and left his family seven times what they expected.`,
    lesson: 'Compounding works silently. The earlier you start, the more dramatic the result. Time is the one ingredient that cannot be bought.',
  },
  {
    id: 3, col: '#f0a500', title: 'The South Sea Bubble — A Short History',
    type: 'Historical', readTime: 6, link: 'https://www.google.com/search?q=South+Sea+Bubble+1720+story+history+explained',
    story: `In 1711, the South Sea Company was founded in London with a spectacular promise: it held an exclusive monopoly to trade with South America. The catch was that Spain controlled South America and had no intention of sharing it. But in the fever of 1720, nobody cared about facts.

Share prices rose from £100 to over £1,000 in less than a year. Members of Parliament, dukes, bishops and street vendors all rushed to buy in. A company was even formed — with a stated purpose of "carrying on an undertaking of great advantage, but nobody to know what it is" — and sold out in five hours.

In September 1720, the bubble burst. Parliament called it fraud. Fortunes built over decades disappeared overnight. Sir Isaac Newton, who had sold early at a profit and then bought back in near the top, reportedly said: "I can calculate the movement of stars, but not the madness of men." He lost £20,000 — about £3 million in today\'s money.`,
    lesson: 'When everyone is getting rich from something nobody fully understands, history suggests it is time to be afraid.',
  },
  {
    id: 4, col: '#7c6af7', title: 'The Pivot',
    type: 'Short Story', readTime: 7, link: 'https://www.google.com/search?q=startup+pivot+stories+famous+examples',
    story: `Priya had burned through ₹28 lakhs building Groceroo — an app that let users pre-order specific grocery items from local kirana stores. Eighteen months in, she had 1,200 users and zero revenue. Her co-founder had quit. Her lead investor had stopped replying to emails. She had enough cash for six more weeks.

She almost shut it down the night she noticed something in the user logs. Her 1,200 users weren't searching for groceries. They were searching for medicine. Paracetamol. Insulin. A specific brand of antacid. They were using her store-locator feature to find pharmacies that had medicine in stock — something no app had solved.

With five weeks of runway left, Priya pivoted entirely. She cold-called 40 pharmacies in Bengaluru. 12 agreed to list their real-time inventory. She went live in nine days. In month one: 600 medicine orders. Month three: ₹4 lakh GMV. Month six: Series A term sheet. Today, MedLocate serves 14 cities.`,
    lesson: 'Your users\' actual behaviour is the truest market research you will ever get. Listen to what they do, not what they say.',
  },
  {
    id: 5, col: '#f472b6', title: 'Warren\'s First Investment',
    type: 'True Story', readTime: 4, link: 'https://www.google.com/search?q=Warren+Buffett+first+investment+Cities+Service+story',
    story: `In 1941, an eleven-year-old boy from Omaha spent his entire savings — $114.75, accumulated from selling chewing gum door to door and collecting lost golf balls — on three shares of Cities Service Preferred stock at $38 each. He persuaded his older sister Doris to buy three as well.

Almost immediately, the stock fell to $27. Doris, who checked prices every day, said nothing to Warren but her expression said everything. He held on, convinced the business was sound. When it finally climbed back to $40, he sold — locking in a modest $5 gain. The stock then rose to $202.

Warren would later call this one of the most important lessons of his life: not the mistake of selling early, but the weight of responsibility he felt when his sister\'s money was down. "It taught me that before I made an investment, I needed to be certain I understood the business well enough to hold through the pain."`,
    lesson: 'The ability to hold a good investment through temporary price drops is one of the rarest and most profitable skills in finance.',
  },
  {
    id: 6, col: '#34d399', title: 'The Kirana and the App',
    type: 'Short Story', readTime: 5, link: 'https://www.google.com/search?q=Indian+kirana+stores+vs+ecommerce+retail+disruption',
    story: `Rajan had run his kirana store in Pune for 31 years. When a large e-commerce platform launched same-day delivery in his area in 2018, his sales dropped 22% in six months. A BCom student who came to buy cigarettes one evening said, casually: "You should just become their warehouse, uncle."

Rajan laughed. Then he thought about it for three days. He applied to become a dark store microfulfillment partner. By 2020, the platform was routing 300 orders a day through his store. His margin per order was small, but the volume made him ₹80,000/month extra — more than his original shop earned. He hired two people. He stopped worrying about the big platform as a threat and started treating it as a channel.

Today he runs three fulfilment points across Pune. The student who gave him the idea is now his operations manager.`,
    lesson: 'The incumbent\'s greatest advantage is location, trust, and speed. Disruption only wins when incumbents refuse to adapt.',
  },
  {
    id: 7, col: '#fb923c', title: 'The Ant and the Grasshopper — a Business Retelling',
    type: 'Fable', readTime: 3, link: 'https://www.google.com/search?q=ant+and+grasshopper+business+financial+savings+lesson',
    story: `Two friends graduated from the same MBA programme in the same year, with the same salary at the same firm — ₹12 lakh per annum.

The Grasshopper spent freely: a new phone every year, restaurant dinners three nights a week, an upgrade to a larger flat. He lived fully, joyfully, expensively. "I\'ll save later," he told the Ant. "Life is meant to be enjoyed."

The Ant automated a ₹15,000/month SIP into an index fund and almost forgot about it. She took fewer holidays than the Grasshopper. She drove an older car. At 48, after 22 years, the Ant\'s portfolio was worth ₹2.1 crore. The Grasshopper had ₹3 lakhs — just enough to cover three months of his current lifestyle.

The story does not end with the Ant refusing to help. She helped. But the Grasshopper spent the rest of his working life trying to undo 22 years of compound math that had worked, silently and mercilessly, against him.`,
    lesson: 'Saving is not about deprivation. It is about buying future freedom with present restraint.',
  },
  {
    id: 8, col: '#60a5fa', title: 'The Valuation That Broke a Bank',
    type: 'Historical', readTime: 5, link: 'https://www.google.com/search?q=WeWork+valuation+collapse+story+Adam+Neumann',
    story: `In January 2019, a company that rented desks in shared office spaces was valued at $47 billion. Its lead investor had called its founder "the greatest entrepreneur of our time." Its revenue was growing 100% year on year. The world\'s largest venture fund had poured $10 billion into it.

Nine months later, the same company tried to go public. Analysts read the filing. The numbers told a very different story: it was losing $219,000 per hour. Its CEO had borrowed money from the company, sold it real estate he personally owned, and trademarked the word "We" — then charged the company $5.9 million for the trademark.

The IPO was withdrawn. The CEO resigned. The company had to be rescued at a valuation of $8 billion — an 83% collapse in three months. Thousands of employees lost jobs. The lead investor wrote down $9 billion.

Growth is a number. Profit is reality. The gap between them is where bubbles live.`,
    lesson: 'Revenue growth without a path to profitability is not a business model. It is a loan from future investors.',
  },
];

// ─── Web Resources ────────────────────────────────────────────────────────────
const WEBLINKS = [
  {
    id: 1,  col: '#4285f4', title: 'Google Finance',          desc: 'Real-time stock prices, charts, news, and portfolio tracking. Best starting point for market data.',                                                       tag: 'Markets',       url: 'https://finance.google.com' },
  { id: 2,  col: '#00b4d8', title: 'Investopedia',            desc: 'The world\'s largest financial education website. Definitions, tutorials, simulators, and in-depth articles on every finance concept.',                        tag: 'Education',     url: 'https://www.google.com/search?q=site:investopedia.com+finance+tutorials' },
  { id: 3,  col: '#f0a500', title: 'Zerodha Varsity',         desc: 'India\'s best free stock market course — from equities to futures to options. Written by Zerodha\'s team. Highly practical for Indian markets.',              tag: 'India · Free',  url: 'https://zerodha.com/varsity/' },
  { id: 4,  col: '#00d68f', title: 'NSE India',               desc: 'Official website of the National Stock Exchange of India. Live charts, F&O data, indices, corporate results, and regulatory filings.',                         tag: 'India · NSE',   url: 'https://www.nseindia.com' },
  { id: 5,  col: '#ef4444', title: 'BSE India',               desc: 'Bombay Stock Exchange — the oldest exchange in Asia. Listed companies, announcement filings, sensex data, and IPO information.',                               tag: 'India · BSE',   url: 'https://www.bseindia.com' },
  { id: 6,  col: '#8b5cf6', title: 'SEBI Official',           desc: 'Securities and Exchange Board of India. Regulatory circulars, investor grievance portal, mutual fund statistics, and market surveillance data.',               tag: 'India · Regulator', url: 'https://www.sebi.gov.in' },
  { id: 7,  col: '#f97316', title: 'Economic Times Markets',  desc: 'India\'s leading financial newspaper online. Live market data, commodity prices, expert analysis, and breaking business news.',                                tag: 'News',          url: 'https://economictimes.indiatimes.com/markets' },
  { id: 8,  col: '#fb7185', title: 'Harvard Business Review', desc: 'The gold standard of business strategy and management research. Long-form case studies, leadership articles, and seminal frameworks (Blue Ocean, Porter\'s Five Forces…)', tag: 'Strategy', url: 'https://hbr.org' },
  { id: 9,  col: '#34d399', title: 'Khan Academy Finance',    desc: 'Free world-class finance and economics courses. Core concepts, banking, money, interest, inflation — taught from scratch with interactive exercises.',           tag: 'Education · Free', url: 'https://www.khanacademy.org/economics-finance-domain' },
  { id: 10, col: '#06b6d4', title: 'Moneycontrol',            desc: 'India\'s most popular financial portal. Live stock prices, mutual fund screener, personal finance tools, and real-time commodity data.',                        tag: 'India · Finance', url: 'https://www.moneycontrol.com' },
  { id: 11, col: '#fbbf24', title: 'CFA Institute',           desc: 'Official body for CFA certification. Free research, code of ethics, ESG standards, and the Investment Foundations Programme (free certification).',             tag: 'Professional',  url: 'https://www.cfainstitute.org' },
  { id: 12, col: '#a78bfa', title: 'MIT OpenCourseWare',      desc: 'Free MIT finance lectures — from introductory Corporate Finance to advanced Derivatives. Full lecture notes, problem sets, and readings available.',           tag: 'Education · Free', url: 'https://ocw.mit.edu/search/?q=finance' },
  { id: 13, col: '#10b981', title: 'Groww Learn',             desc: 'Simple, jargon-free explanations of Indian mutual funds, SIPs, ETFs, and direct stocks. Great for first-time investors who want to start small.',               tag: 'India · Beginner', url: 'https://groww.in/p/learn' },
  { id: 14, col: '#ec4899', title: 'Google Trends — Finance', desc: 'See which finance topics are trending globally. Useful for understanding retail investor sentiment, identifying emerging sectors, and research timing.',          tag: 'Research',      url: 'https://trends.google.com/trends/explore?cat=7' },
];

// ─── Flashcard Decks ──────────────────────────────────────────────────────────
const FLASHCARD_DECKS = [
  {
    id: 'basics', col: '#00e5ff', title: 'Market Basics', count: 12,
    cards: [
      { front: 'What is a Bull Market?',           back: 'A market condition where prices are rising or expected to rise. Typically defined as a 20%+ gain from recent lows. Associated with investor optimism and strong economic growth.' },
      { front: 'What is a Bear Market?',           back: 'A market condition where prices fall 20% or more from recent highs over a sustained period. Associated with widespread pessimism and economic slowdown.' },
      { front: 'What is Market Capitalisation?',   back: 'Total market value of a company\'s outstanding shares. Calculated as: Share Price × Total Shares Outstanding. Used to classify companies as Small-cap (<$2B), Mid-cap ($2–10B), Large-cap (>$10B).' },
      { front: 'What is a Dividend?',              back: 'A portion of a company\'s earnings distributed to shareholders, usually quarterly. Expressed as dividend per share or as dividend yield (annual dividend ÷ share price × 100%).' },
      { front: 'What is an IPO?',                  back: 'Initial Public Offering. The first time a private company offers shares to the public on a stock exchange. Allows the company to raise capital while giving early investors an exit.' },
      { front: 'What is Liquidity?',               back: 'The ease with which an asset can be converted to cash without significantly affecting its price. Highly liquid assets (cash, major stocks) can be sold instantly; illiquid assets (real estate) may take months.' },
      { front: 'What is Volatility?',              back: 'A statistical measure of the dispersion of returns for a given asset. Higher volatility = greater risk and potential reward. Often measured by standard deviation or the VIX (Volatility Index) for the S&P 500.' },
      { front: 'What is a Stock Exchange?',        back: 'An organised marketplace where buyers and sellers trade securities. Major exchanges: NYSE (New York), NASDAQ, BSE (Bombay), NSE (National Stock Exchange India), LSE (London).' },
      { front: 'What is Short Selling?',           back: 'Borrowing shares and selling them, hoping to repurchase at a lower price later. Profit = sale price − repurchase price − borrowing costs. Carries unlimited theoretical loss if the price rises.' },
      { front: 'What is a Blue-Chip Stock?',       back: 'Shares of a large, well-established, financially stable company with a long track record of reliable performance. Examples: Apple (AAPL), TCS, Reliance Industries. Generally considered lower risk.' },
      { front: 'What is an ETF?',                  back: 'Exchange-Traded Fund. A basket of securities that trades on an exchange like a single stock. Offers diversification at low cost. An S&P 500 ETF holds all 500 constituent stocks proportionally.' },
      { front: 'What is a Hedge Fund?',            back: 'A private investment fund that pools capital from accredited investors and uses sophisticated strategies (leverage, short selling, derivatives) to generate returns uncorrelated with the broader market.' },
    ]
  },
  {
    id: 'technical', col: '#00d68f', title: 'Technical Analysis', count: 12,
    cards: [
      { front: 'What is RSI?',                     back: 'Relative Strength Index (0–100). Above 70 = overbought (potential sell signal), below 30 = oversold (potential buy signal). Measures the speed and change of price movements over a set period (default 14 days).' },
      { front: 'What is MACD?',                    back: 'Moving Average Convergence Divergence. Measures momentum using two EMAs. A bullish signal occurs when the MACD line crosses above the signal line; bearish when it crosses below.' },
      { front: 'What is a Moving Average?',        back: 'An average of a security\'s price over a specific number of periods, updated as new data arrives. Smooths out price fluctuations. SMA = Simple Moving Average; EMA = Exponential Moving Average (weights recent data more).' },
      { front: 'What is a Golden Cross?',          back: 'A bullish signal when a short-term moving average (50-day) crosses above a long-term moving average (200-day). Considered a strong buy signal and potential start of a new uptrend.' },
      { front: 'What is a Death Cross?',           back: 'A bearish signal when the 50-day moving average crosses below the 200-day moving average. Opposite of the Golden Cross — historically precedes periods of extended losses.' },
      { front: 'What are Bollinger Bands?',        back: 'Three lines: SMA (middle), SMA+2SD (upper), SMA−2SD (lower). Price touching the upper band suggests overbought conditions; lower band suggests oversold. Bands widen during volatility, narrow during calm periods.' },
      { front: 'What is Support?',                 back: 'A price level where a downtrend pauses due to increased buying interest. Think of it as a "floor" — the market has repeatedly struggled to fall below this price.' },
      { front: 'What is Resistance?',              back: 'A price level where an uptrend stalls due to selling pressure. Think of it as a "ceiling" — the market has repeatedly struggled to break above this price.' },
      { front: 'What is a Candlestick Chart?',     back: 'A chart type showing open, high, low, and close prices for each time period. Green/white candles indicate price rose; red/black indicate price fell. Patterns like Doji, Hammer, and Engulfing signal potential reversals.' },
      { front: 'What is Volume?',                  back: 'The number of shares traded in a given period. High volume confirms a price trend; low volume suggests the move may not be sustainable. Volume spikes often accompany major news or breakouts.' },
      { front: 'What is a Head and Shoulders?',    back: 'A reversal chart pattern with three peaks: a higher middle peak (head) and two shorter outer peaks (shoulders). When the "neckline" support breaks, it signals a potential trend reversal from bullish to bearish.' },
      { front: 'What is the VIX?',                 back: 'CBOE Volatility Index — often called the "fear gauge". Measures expected 30-day volatility of the S&P 500. VIX above 30 = high fear; below 20 = complacency. Tends to spike during market sell-offs.' },
    ]
  },
  {
    id: 'valuation', col: '#f0a500', title: 'Valuation Ratios', count: 10,
    cards: [
      { front: 'What is the P/E Ratio?',           back: 'Price-to-Earnings ratio = Share Price ÷ Earnings Per Share. Measures how much investors pay per dollar of earnings. High P/E suggests growth expectations; low P/E may indicate undervaluation or declining business.' },
      { front: 'What is the P/B Ratio?',           back: 'Price-to-Book ratio = Market Cap ÷ Book Value. Book value = total assets minus intangible assets and liabilities. P/B below 1 suggests the stock may be trading below its intrinsic value.' },
      { front: 'What is EPS?',                     back: 'Earnings Per Share = Net Income ÷ Total Shares Outstanding. A key measure of company profitability on a per-share basis. Rising EPS over time typically leads to a rising stock price.' },
      { front: 'What is EBITDA?',                  back: 'Earnings Before Interest, Taxes, Depreciation, and Amortisation. Used as a proxy for operating cash flow and to compare companies across different capital structures and tax environments.' },
      { front: 'What is the EV/EBITDA Multiple?',  back: 'Enterprise Value ÷ EBITDA. A popular valuation metric that accounts for a company\'s debt. Lower multiples suggest relative undervaluation. Often used in M&A to compare acquisition targets.' },
      { front: 'What is Free Cash Flow?',          back: 'Cash generated after capital expenditure: Operating Cash Flow − CapEx. Represents cash available for dividends, buybacks, or paying down debt. A crucial metric of financial health.' },
      { front: 'What is ROE?',                     back: 'Return on Equity = Net Income ÷ Shareholder Equity. Measures how efficiently a company uses equity to generate profit. Buffett targets ROE above 15%. High consistent ROE often indicates a competitive moat.' },
      { front: 'What is the Dividend Yield?',      back: 'Annual Dividend Per Share ÷ Stock Price × 100%. A $50 stock paying $2/year = 4% yield. High yield can signal income or distress (falling price). Sustainable yield growth is more important than a high static yield.' },
      { front: 'What is DCF Analysis?',            back: 'Discounted Cash Flow: a valuation method projecting future free cash flows and discounting them to present value using a discount rate (usually WACC). If intrinsic value > current price → potentially undervalued.' },
      { front: 'What is the PEG Ratio?',           back: 'P/E Ratio ÷ Earnings Growth Rate (%). Adjusts P/E for growth. PEG < 1 is often considered undervalued; > 2 potentially overvalued. Useful for comparing high-growth companies where standard P/E looks stretched.' },
    ]
  },
  {
    id: 'risk', col: '#7c6af7', title: 'Risk & Portfolio', count: 10,
    cards: [
      { front: 'What is the Sharpe Ratio?',        back: '(Portfolio Return − Risk-Free Rate) ÷ Standard Deviation. Measures risk-adjusted return. Sharpe > 1 = good; > 2 = very good; > 3 = excellent. Negative Sharpe means you\'re better off in T-bills.' },
      { front: 'What is Value at Risk (VaR)?',     back: 'The maximum expected loss over a given time period at a specified confidence level. "95% daily VaR of 2%" means there is a 5% chance of losing more than 2% in a single day.' },
      { front: 'What is Beta?',                    back: 'Measures a stock\'s volatility relative to the market. Beta of 1 = moves with the market; >1 = more volatile; <1 = less volatile; negative = moves inversely. GIFT\'s C++ engine calculates portfolio beta in real-time.' },
      { front: 'What is Alpha?',                   back: 'Excess return relative to a benchmark after adjusting for beta. Alpha of +3% means the portfolio outperformed by 3% beyond what beta alone would predict. A positive alpha is the goal of active management.' },
      { front: 'What is Diversification?',         back: 'Spreading investments across uncorrelated assets to reduce unsystematic (company-specific) risk without proportionally reducing expected return. "Don\'t put all your eggs in one basket."' },
      { front: 'What is Correlation?',             back: 'Ranges from −1 (perfect inverse) to +1 (perfect positive). Portfolio risk is minimised by combining assets with low or negative correlations. This is the mathematical basis of diversification.' },
      { front: 'What is Systematic Risk?',         back: 'Market-wide risk that cannot be diversified away — e.g., recessions, interest rate changes, geopolitical events. Also called "market risk" or "non-diversifiable risk". Measured by beta.' },
      { front: 'What is the Efficient Frontier?',  back: 'A set of optimal portfolios offering the highest expected return for a given level of risk (or lowest risk for a given return). Developed by Harry Markowitz in Modern Portfolio Theory (MPT).' },
      { front: 'What is Rebalancing?',             back: 'Periodically buying/selling assets to restore a portfolio to its target allocation. If stocks rally and now represent 70% vs your 60% target, you sell stocks and buy bonds to rebalance.' },
      { front: 'What is a Stop-Loss?',             back: 'An order to sell a security when it reaches a specified lower price. Protects against large losses by automating the exit at a predetermined risk threshold. E.g., buy at ₹100, stop-loss at ₹90 limits downside to 10%.' },
    ]
  },
  {
    id: 'crypto', col: '#fb923c', title: 'Crypto & DeFi', count: 8,
    cards: [
      { front: 'What is Blockchain?',              back: 'A distributed, immutable digital ledger recording transactions in chronological "blocks" chained together cryptographically. No single entity controls it — copies exist across thousands of nodes worldwide.' },
      { front: 'What is DeFi?',                    back: 'Decentralised Finance: financial services (lending, borrowing, trading) built on blockchain smart contracts without intermediaries. Key protocols include Uniswap, Aave, and Compound on Ethereum.' },
      { front: 'What is a Smart Contract?',        back: 'Self-executing code stored on a blockchain that automatically enforces agreement terms when predetermined conditions are met. No intermediary needed — code is law.' },
      { front: 'What is Market Cap in Crypto?',    back: 'Circulating Supply × Current Price. Bitcoin\'s dominance is its market cap as a % of total crypto market cap. Large-cap cryptos (BTC, ETH) are generally less volatile than small-cap altcoins.' },
      { front: 'What is Yield Farming?',           back: 'Providing liquidity to DeFi protocols in exchange for interest and governance token rewards. High potential returns but subject to smart contract risk, impermanent loss, and token price volatility.' },
      { front: 'What is a Stablecoin?',            back: 'A cryptocurrency pegged to a stable asset, usually the US dollar (USDT, USDC) or algorithmic. Used as a safe haven in crypto and for DeFi transactions without exposure to crypto volatility.' },
      { front: 'What is Mining?',                  back: 'The process of validating blockchain transactions by solving complex cryptographic puzzles (Proof of Work). Miners are rewarded with newly created cryptocurrency. Highly energy-intensive — Bitcoin consumes ~150 TWh/year.' },
      { front: 'What is a Hardware Wallet?',       back: 'A physical device (like Ledger or Trezor) that stores private keys offline, protecting crypto assets from online hacks. "Not your keys, not your coins" — essential for large crypto holdings.' },
    ]
  },
];

// ─── Course Modules ───────────────────────────────────────────────────────────
const MODS = [
  {
    id: 1, col: '#00e5ff', title: 'Market Fundamentals', desc: 'Core concepts every investor needs', lessons: 10, done: 10, locked: false,
    quiz: [
      { q: 'P/E ratio compares a company\'s stock price to:', opts: ['Total assets', 'Earnings per share', 'Revenue growth', 'Dividend yield'], ans: 1 },
      { q: 'A bear market is defined as a drop of at least:', opts: ['5%', '10%', '15%', '20%'], ans: 3 },
      { q: 'Market capitalisation equals:', opts: ['Total debt', 'Stock price × shares outstanding', 'Annual profit', 'Total revenue'], ans: 1 },
      { q: 'Which is a leading economic indicator?', opts: ['GDP', 'Consumer Price Index', 'Unemployment rate', 'Building permits'], ans: 3 },
    ]
  },
  {
    id: 2, col: '#00d68f', title: 'Technical Analysis', desc: 'Chart patterns and price action', lessons: 14, done: 9, locked: false,
    quiz: [
      { q: 'RSI stands for:', opts: ['Relative Strength Index', 'Real Stock Indicator', 'Risk Scale Index', 'Rapid Signal Indicator'], ans: 0 },
      { q: 'A "Golden Cross" is when:', opts: ['Price hits ATH', '50-day MA crosses above 200-day MA', 'Volume surges 200%', 'P/E exceeds 50'], ans: 1 },
      { q: 'Bollinger Bands primarily measure:', opts: ['Momentum', 'Trend direction', 'Volatility', 'Volume'], ans: 2 },
      { q: 'MACD is used to identify:', opts: ['Support levels', 'Trend changes and momentum', 'Dividend dates', 'Earnings beats'], ans: 1 },
    ]
  },
  {
    id: 3, col: '#f0a500', title: 'Fundamental Analysis', desc: 'Valuation and financial statements', lessons: 12, done: 4, locked: false,
    quiz: [
      { q: 'EBITDA stands for:', opts: ['Earnings Before Interest, Taxes, Depreciation & Amortization', 'Estimated Baseline Income Tax Analysis', 'Enterprise Book Interest Deficit', 'None of the above'], ans: 0 },
      { q: 'Free cash flow equals:', opts: ['Net income', 'Operating cash flow minus capex', 'Revenue minus COGS', 'EBITDA minus taxes'], ans: 1 },
      { q: 'A low Price/Book ratio may indicate:', opts: ['Overvaluation', 'Undervaluation or distress', 'High growth', 'Strong margins'], ans: 1 },
      { q: 'Return on Equity (ROE) measures:', opts: ['Asset efficiency', 'Profit relative to shareholder equity', 'Debt coverage', 'Revenue growth'], ans: 1 },
    ]
  },
  {
    id: 4, col: '#7c6af7', title: 'Portfolio Management', desc: 'Risk, allocation, and rebalancing', lessons: 11, done: 2, locked: false,
    quiz: [
      { q: 'Diversification primarily reduces:', opts: ['Systematic risk', 'Unsystematic risk', 'Market risk', 'Inflation risk'], ans: 1 },
      { q: 'Sharpe ratio measures:', opts: ['Total return', 'Risk-adjusted return per unit of risk', 'Volatility alone', 'Beta'], ans: 1 },
      { q: 'Rebalancing a portfolio means:', opts: ['Selling all positions', 'Restoring target asset allocation', 'Adding only new stocks', 'Reducing fees'], ans: 1 },
      { q: 'The efficient frontier represents:', opts: ['Maximum return portfolios', 'Optimal risk-return combinations', 'Zero-risk portfolios', 'Government bonds only'], ans: 1 },
    ]
  },
  {
    id: 5, col: '#f06292', title: 'Entrepreneurship', desc: 'Startups, pivots, and building a business', lessons: 13, done: 3, locked: false,
    quiz: [
      { q: 'The Lean Startup\'s core feedback loop is:', opts: ['Plan-Execute-Review', 'Build-Measure-Learn', 'Ideate-Build-Ship', 'Research-Develop-Launch'], ans: 1 },
      { q: 'A Minimum Viable Product (MVP) is designed to:', opts: ['Maximise features', 'Test a core hypothesis with minimal effort', 'Beat the competition on launch day', 'Raise maximum funding'], ans: 1 },
      { q: 'According to Peter Thiel, the best companies:', opts: ['Copy proven models', 'Enter competitive markets', 'Go from Zero to One by creating new things', 'Grow slowly and steadily'], ans: 2 },
      { q: 'Pivoting in a startup means:', opts: ['Adding more features', 'Changing the business model or direction based on learnings', 'Firing the CEO', 'Doing an IPO'], ans: 1 },
    ]
  },
  {
    id: 6, col: '#fbbf24', title: 'Business Strategy', desc: 'Competitive moats, frameworks, and leadership', lessons: 12, done: 1, locked: false,
    quiz: [
      { q: 'Jim Collins\' Hedgehog Concept is the intersection of:', opts: ['Revenue, profit, cash flow', 'What you are passionate about, best at, and drives your economic engine', 'Vision, mission, values', 'People, process, product'], ans: 1 },
      { q: 'Clayton Christensen\'s \'disruptive innovation\' describes when:', opts: ['A company improves its best product', 'A new entrant attacks from the low end and eventually displaces incumbents', 'A monopoly is broken up by government', 'A startup raises a billion-dollar funding round'], ans: 1 },
      { q: 'Simon Sinek\'s Golden Circle starts with:', opts: ['What', 'How', 'Why', 'Who'], ans: 2 },
      { q: 'The Theory of Constraints (Goldratt) focuses on:', opts: ['Cutting all costs simultaneously', 'Identifying and removing the single bottleneck limiting throughput', 'Maximising headcount', 'Raising prices'], ans: 1 },
    ]
  },
  { id: 7, col: '#34d399', title: 'Derivatives & Options', desc: 'Calls, puts, and hedging strategies', lessons: 16, done: 0, locked: true, quiz: [] },
  { id: 8, col: '#06b6d4', title: 'Crypto & DeFi', desc: 'Blockchain assets and protocols', lessons: 13, done: 0, locked: true, quiz: [] },
  { id: 9, col: '#a78bfa', title: 'Macro Economics', desc: 'Central banks, cycles and policy', lessons: 10, done: 0, locked: true, quiz: [] },
  { id: 10, col: '#fb7185', title: 'Risk Management', desc: 'Hedging, stop-loss, and position sizing', lessons: 9, done: 0, locked: true, quiz: [] },
];

const S = {
  sl:   { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#3a5068' },
  card: { background: 'rgba(9,15,30,.9)', border: '1px solid #182236', borderRadius: 14, backdropFilter: 'blur(20px)' },
  mono: { fontFamily: "'JetBrains Mono',monospace" },
};

const ALL_GENRES = [...new Set(BOOKS.flatMap(b => b.genre))].sort();
const STORY_TYPES   = ['All', ...new Set(STORIES.map(s => s.type))];
const LINK_TAGS     = ['All', ...new Set(WEBLINKS.map(l => l.tag))];

// ─── Flashcard component ──────────────────────────────────────────────────────
function Flashcards() {
  const [deckId, setDeckId]   = useState(FLASHCARD_DECKS[0].id);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen]       = useState(new Set());

  const deck  = FLASHCARD_DECKS.find(d => d.id === deckId);
  const card  = deck.cards[cardIdx];
  const total = deck.cards.length;
  const pct   = Math.round((seen.size / total) * 100);

  const go = (dir) => {
    const next = (cardIdx + dir + total) % total;
    setCardIdx(next);
    setFlipped(false);
    setSeen(prev => new Set([...prev, cardIdx]));
  };

  const switchDeck = (id) => { setDeckId(id); setCardIdx(0); setFlipped(false); setSeen(new Set()); };

  return (
    <div>
      {/* Deck selector */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 26 }}>
        {FLASHCARD_DECKS.map(d => (
          <button key={d.id} onClick={() => switchDeck(d.id)}
            style={{ padding: '7px 16px', borderRadius: 9, border: `1px solid ${deckId === d.id ? d.col : '#182236'}`, background: deckId === d.id ? `${d.col}15` : 'transparent', color: deckId === d.id ? d.col : '#3a5068', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
            {d.title}
            <span style={{ marginLeft: 7, fontSize: 11, opacity: .7 }}>{d.count}</span>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ flex: 1, maxWidth: 320, height: 4, borderRadius: 99, background: '#0c1424', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: deck.col, transition: 'width .4s ease' }} />
        </div>
        <span style={{ fontSize: 12, color: '#3a5068' }}>{seen.size}/{total} seen · {pct}%</span>
        <button onClick={() => { setCardIdx(0); setFlipped(false); setSeen(new Set()); }}
          style={{ padding: '4px 12px', borderRadius: 7, border: '1px solid #182236', background: 'transparent', color: '#3a5068', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
          Reset
        </button>
      </div>

      {/* Flip card */}
      <div style={{ perspective: '1200px', maxWidth: 560, margin: '0 auto 20px' }}>
        <div onClick={() => setFlipped(f => !f)}
          style={{ position: 'relative', height: 280, transformStyle: 'preserve-3d', transition: 'transform .55s cubic-bezier(.4,0,.2,1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', cursor: 'pointer' }}>
          {/* Front */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', ...S.card, border: `1px solid ${deck.col}40`, borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 36px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: deck.col, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16, opacity: .8 }}>
              Card {cardIdx + 1} of {total} · {deck.title}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#c8d8e8', lineHeight: 1.4 }}>{card.front}</div>
            <div style={{ marginTop: 24, fontSize: 11, color: '#3a5068' }}>Click to reveal answer</div>
          </div>
          {/* Back */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: `linear-gradient(135deg, ${deck.col}18, rgba(9,15,30,.95))`, border: `1px solid ${deck.col}50`, borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 36px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: deck.col, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 14, opacity: .8 }}>Answer</div>
            <div style={{ fontSize: 14.5, color: '#c8d8e8', lineHeight: 1.65, maxWidth: 440 }}>{card.back}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
        <button onClick={() => go(-1)}
          style={{ padding: '9px 22px', borderRadius: 9, border: '1px solid #182236', background: 'transparent', color: '#7090a8', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600 }}>
          ← Prev
        </button>
        <div style={{ display: 'flex', gap: 5 }}>
          {deck.cards.map((_, i) => (
            <div key={i} onClick={() => { setCardIdx(i); setFlipped(false); setSeen(prev => new Set([...prev, cardIdx])); }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: i === cardIdx ? deck.col : seen.has(i) ? `${deck.col}50` : '#182236', cursor: 'pointer', transition: 'all .2s' }} />
          ))}
        </div>
        <button onClick={() => go(1)}
          style={{ padding: '9px 22px', borderRadius: 9, border: '1px solid #182236', background: 'transparent', color: '#7090a8', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600 }}>
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Books Library component ──────────────────────────────────────────────────
function BooksLibrary() {
  const [subTab, setSubTab]     = useState('books');
  const [search, setSearch]     = useState('');
  const [genre, setGenre]       = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [storyType, setStoryType] = useState('All');
  const [linkTag, setLinkTag]   = useState('All');

  const subTabs = [
    { id: 'books',     label: 'Books Library',   badge: `${BOOKS.length}` },
    { id: 'stories',   label: 'Stories & Fables', badge: `${STORIES.length}` },
    { id: 'resources', label: 'Web Resources',   badge: `${WEBLINKS.length}` },
  ];

  const filtered = BOOKS.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const matchGenre  = genre === 'All' || b.genre.includes(genre);
    return matchSearch && matchGenre;
  });

  const filteredStories = STORIES.filter(s => storyType === 'All' || s.type === storyType);
  const filteredLinks   = WEBLINKS.filter(l => linkTag === 'All' || l.tag === linkTag);

  const btnStyle = (active, col = '#00e5ff') => ({
    padding: '6px 13px', borderRadius: 8,
    border: `1px solid ${active ? col : '#182236'}`,
    background: active ? `${col}18` : 'transparent',
    color: active ? col : '#3a5068',
    fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all .15s',
  });

  return (
    <div>
      {/* Sub-tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, borderBottom: '1px solid #182236', paddingBottom: 0 }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => { setSubTab(t.id); setExpanded(null); }}
            style={{ padding: '8px 16px', borderRadius: '8px 8px 0 0', border: `1px solid ${subTab === t.id ? '#182236' : 'transparent'}`, borderBottom: subTab === t.id ? '1px solid #090f1e' : 'none', background: subTab === t.id ? '#0c1424' : 'transparent', color: subTab === t.id ? '#00e5ff' : '#3a5068', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', display: 'flex', gap: 7, alignItems: 'center', position: 'relative', top: 1 }}>
            {t.label}
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: subTab === t.id ? 'rgba(0,229,255,.12)' : 'rgba(255,255,255,.05)', color: subTab === t.id ? '#00e5ff' : '#2a4060', fontWeight: 700 }}>{t.badge}</span>
          </button>
        ))}
      </div>

      {/* ── BOOKS ── */}
      {subTab === 'books' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books or authors…"
              style={{ flex: 1, minWidth: 200, maxWidth: 300, padding: '9px 14px', borderRadius: 9, border: '1px solid #182236', background: '#0c1424', color: '#c8d8e8', fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['All','Classic','Novel','Startup','Fable','Business Novel','Strategy'].map(g => (
                <button key={g} onClick={() => setGenre(g)} style={btnStyle(genre === g)}>{g}</button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#3a5068', marginLeft: 'auto' }}>{filtered.length} books</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {filtered.map(b => (
              <div key={b.id} style={{ ...S.card, border: `1px solid ${expanded === b.id ? b.col + '60' : '#182236'}`, transition: 'all .2s' }}>
                <div style={{ height: 100, borderRadius: '12px 12px 0 0', background: `linear-gradient(135deg, ${b.col}28, ${b.col}08)`, borderBottom: `1px solid ${b.col}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 9, background: b.col, opacity: .6, borderRadius: '12px 0 0 0' }} />
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 900, color: b.col, opacity: .8 }}>{b.cover}</div>
                </div>
                <div style={{ padding: '13px 15px 15px' }}>
                  <div onClick={() => setExpanded(expanded === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#c8d8e8', lineHeight: 1.35, marginBottom: 4 }}>{b.title}</div>
                    <div style={{ fontSize: 11.5, color: '#3a5068', marginBottom: 8 }}>{b.author} · {b.year} · {b.pages}p</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {b.genre.map(g => (<span key={g} style={{ fontSize: 9.5, padding: '1px 7px', borderRadius: 4, background: `${b.col}12`, color: b.col, fontWeight: 700, border: `1px solid ${b.col}22` }}>{g}</span>))}
                    </div>
                    {expanded === b.id && (
                      <div style={{ fontSize: 12.5, color: '#7090a8', lineHeight: 1.65, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${b.col}20` }}>{b.summary}</div>
                    )}
                    <div style={{ marginTop: 9, fontSize: 11, color: b.col, fontWeight: 600 }}>{expanded === b.id ? '▲ Show less' : '▼ About this book'}</div>
                  </div>
                  <a href={b.link} target="_blank" rel="noopener noreferrer"
                    style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#3a5068', border: '1px solid #182236', borderRadius: 6, padding: '4px 10px', textDecoration: 'none', fontWeight: 600, transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = b.col; e.currentTarget.style.color = b.col; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#182236'; e.currentTarget.style.color = '#3a5068'; }}>
                    ↗ Search on Google
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STORIES ── */}
      {subTab === 'stories' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            {STORY_TYPES.map(t => (<button key={t} onClick={() => setStoryType(t)} style={btnStyle(storyType === t, '#f472b6')}>{t}</button>))}
            <span style={{ fontSize: 12, color: '#3a5068', marginLeft: 'auto' }}>{filteredStories.length} stories</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredStories.map(s => (
              <div key={s.id} style={{ ...S.card, border: `1px solid ${expanded === `s${s.id}` ? s.col + '50' : '#182236'}`, padding: 0, overflow: 'hidden' }}>
                {/* Story header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', borderBottom: expanded === `s${s.id}` ? `1px solid ${s.col}25` : 'none' }}
                  onClick={() => setExpanded(expanded === `s${s.id}` ? null : `s${s.id}`)  }>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.col}18`, border: `1px solid ${s.col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {s.type === 'Fable' ? '🐜' : s.type === 'Historical' ? '🏛️' : s.type === 'True Story' ? '⭐' : s.type === 'Parable' ? '📜' : '✍️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#c8d8e8', marginBottom: 3 }}>{s.title}</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 5, background: `${s.col}15`, color: s.col, fontWeight: 700, border: `1px solid ${s.col}25` }}>{s.type}</span>
                      <span style={{ fontSize: 11, color: '#3a5068' }}>{s.readTime} min read</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: s.col, fontWeight: 600, flexShrink: 0 }}>{expanded === `s${s.id}` ? '▲' : '▼'}</div>
                </div>
                {/* Story body */}
                {expanded === `s${s.id}` && (
                  <div style={{ padding: '18px 22px 20px' }}>
                    {s.story.split('\n\n').map((para, i) => (
                      <p key={i} style={{ fontSize: 14, color: '#8098b0', lineHeight: 1.78, margin: '0 0 14px', fontFamily: "'DM Sans',sans-serif" }}
                        dangerouslySetInnerHTML={{ __html: para.replace(/\*([^*]+)\*/g, '<em style="color:#c8d8e8;font-style:italic">$1</em>') }} />
                    ))}
                    <div style={{ marginTop: 16, padding: '12px 16px', background: `${s.col}10`, border: `1px solid ${s.col}30`, borderRadius: 9 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.col, letterSpacing: '.08em' }}>KEY LESSON — </span>
                      <span style={{ fontSize: 13, color: '#7090a8' }}>{s.lesson}</span>
                    </div>
                    <a href={s.link} target="_blank" rel="noopener noreferrer"
                      style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#3a5068', border: '1px solid #182236', borderRadius: 7, padding: '6px 14px', textDecoration: 'none', fontWeight: 600, transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = s.col; e.currentTarget.style.color = s.col; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#182236'; e.currentTarget.style.color = '#3a5068'; }}>
                      ↗ Explore more on Google
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── WEB RESOURCES ── */}
      {subTab === 'resources' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            {LINK_TAGS.map(t => (<button key={t} onClick={() => setLinkTag(t)} style={btnStyle(linkTag === t, '#34d399')}>{t}</button>))}
            <span style={{ fontSize: 12, color: '#3a5068', marginLeft: 'auto' }}>{filteredLinks.length} resources</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {filteredLinks.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                style={{ ...S.card, padding: 20, textDecoration: 'none', display: 'block', transition: 'all .2s', border: '1px solid #182236' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = l.col; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#182236'; e.currentTarget.style.transform = ''; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 11 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, background: `${l.col}18`, border: `1px solid ${l.col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: l.col }}>
                    {l.id}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#c8d8e8', marginBottom: 3 }}>{l.title}</div>
                    <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 4, background: `${l.col}15`, color: l.col, fontWeight: 700, border: `1px solid ${l.col}22` }}>{l.tag}</span>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 16, color: '#3a5068' }}>↗</div>
                </div>
                <div style={{ fontSize: 12.5, color: '#4a6880', lineHeight: 1.6 }}>{l.desc}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Courses + Quiz component ─────────────────────────────────────────────────
function CoursesTab() {
  const [sel, setSel] = useState(null);
  const [ans, setAns] = useState({});
  const [sub, setSub] = useState(false);

  const score       = sel ? sel.quiz.filter((q, i) => ans[i] === q.ans).length : 0;
  const totalDone   = MODS.reduce((a, m) => a + m.done, 0);
  const totalLessons = MODS.reduce((a, m) => a + m.lessons, 0);

  if (sel && !sub) return (
    <div style={{ ...S.card, maxWidth: 680, padding: 30 }}>
      <button onClick={() => setSel(null)} style={{ background: 'transparent', border: '1px solid #1e2d45', color: '#7090a8', fontFamily: "'DM Sans',sans-serif", borderRadius: 9, cursor: 'pointer', padding: '6px 14px', fontSize: 13, marginBottom: 22 }}>← Modules</button>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 26 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: `${sel.col}15`, border: `1px solid ${sel.col}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, ...S.mono, fontWeight: 700, color: sel.col }}>
          {sel.id}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 3 }}>{sel.title}</div>
          <div style={{ color: '#3a5068', fontSize: 13 }}>{sel.quiz.length}-question assessment</div>
        </div>
      </div>
      {sel.quiz.map((q, qi) => (
        <div key={qi} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: `${sel.col}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: sel.col, flexShrink: 0 }}>{qi + 1}</span>
            {q.q}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.opts.map((opt, oi) => (
              <div key={oi} onClick={() => setAns({ ...ans, [qi]: oi })}
                style={{ padding: '10px 15px', borderRadius: 9, border: `1px solid ${ans[qi] === oi ? sel.col : '#1e2d45'}`, background: ans[qi] === oi ? `${sel.col}0c` : '#090f1e', cursor: 'pointer', fontSize: 13.5, transition: 'all .15s', color: ans[qi] === oi ? sel.col : '#7090a8', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${ans[qi] === oi ? sel.col : '#1e2d45'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {ans[qi] === oi && <div style={{ width: 8, height: 8, borderRadius: '50%', background: sel.col }} />}
                </div>
                {opt}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => Object.keys(ans).length === sel.quiz.length && setSub(true)}
        disabled={Object.keys(ans).length < sel.quiz.length}
        style={{ padding: '12px 28px', fontSize: 14, background: 'linear-gradient(135deg,#00b8d4,#00e5ff)', color: '#030711', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, opacity: Object.keys(ans).length < sel.quiz.length ? .5 : 1 }}>
        Submit Assessment
      </button>
    </div>
  );

  if (sel && sub) return (
    <div style={{ ...S.card, maxWidth: 540, padding: 36, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: `${sel.col}18`, border: `1px solid ${sel.col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 28, color: sel.col, ...S.mono, fontWeight: 900 }}>
        {score >= sel.quiz.length ? 'A+' : score >= sel.quiz.length / 2 ? 'B' : 'C'}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, color: sel.col, ...S.mono }}>{score} / {sel.quiz.length}</div>
      <div style={{ color: '#3a5068', marginBottom: 24 }}>
        {score === sel.quiz.length ? 'Perfect score — excellent mastery!' : score >= sel.quiz.length / 2 ? 'Good work — review missed concepts' : "Keep studying — you'll get there!"}
      </div>
      {sel.quiz.map((q, qi) => (
        <div key={qi} style={{ padding: '11px 14px', background: '#090f1e', borderRadius: 9, border: `1px solid ${ans[qi] === q.ans ? 'rgba(0,214,143,.25)' : 'rgba(255,61,90,.25)'}`, marginBottom: 9, textAlign: 'left' }}>
          <div style={{ fontSize: 12, marginBottom: 4, color: '#c8d8e8' }}>{q.q}</div>
          <div style={{ fontSize: 12, color: ans[qi] === q.ans ? '#00d68f' : '#ff3d5a', fontWeight: 700 }}>
            {ans[qi] === q.ans ? 'Correct!' : `Wrong — ${q.opts[q.ans]}`}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
        <button onClick={() => { setAns({}); setSub(false); }} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#00b8d4,#00e5ff)', color: '#030711', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>Retry Quiz</button>
        <button onClick={() => setSel(null)} style={{ padding: '10px 22px', background: 'transparent', border: '1px solid #1e2d45', color: '#7090a8', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>All Modules</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, maxWidth: 300, height: 5, borderRadius: 99, background: '#0c1424', overflow: 'hidden' }}>
          <div style={{ width: `${(totalDone / totalLessons) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#00b8d4,#00e5ff)' }} />
        </div>
        <span style={{ fontSize: 12, color: '#3a5068' }}>{totalDone}/{totalLessons} lessons · {Math.round(totalDone / totalLessons * 100)}%</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 14 }}>
        {MODS.map(m => (
          <div key={m.id} onClick={() => !m.locked && m.quiz.length && (setSel(m), setAns({}), setSub(false))}
            style={{ '--mc': m.col, ...S.card, padding: 22, opacity: m.locked ? .45 : 1, cursor: m.locked ? 'not-allowed' : m.quiz.length ? 'pointer' : 'default', transition: 'all .2s' }}
            onMouseEnter={e => !m.locked && (e.currentTarget.style.borderColor = m.col, e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => !m.locked && (e.currentTarget.style.borderColor = '#182236', e.currentTarget.style.transform = '')}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${m.col}15`, border: `1px solid ${m.col}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 18, color: m.col, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
              {m.id}
            </div>
            {m.locked && <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 6, fontWeight: 600, background: 'rgba(240,165,0,.1)', color: '#fbbf24', border: '1px solid rgba(240,165,0,.2)', marginBottom: 10, display: 'inline-block' }}>LOCKED</span>}
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{m.title}</div>
            <div style={{ fontSize: 12, color: '#3a5068', marginBottom: 14, lineHeight: 1.5 }}>{m.desc}</div>
            <div style={{ fontSize: 11, color: '#3a5068', marginBottom: 8, display: 'flex', gap: 12 }}>
              <span>{m.lessons} lessons</span>
              {m.quiz.length > 0 && <span>{m.quiz.length} quiz questions</span>}
            </div>
            <div style={{ height: 4, borderRadius: 99, background: '#0c1424', marginBottom: 6, overflow: 'hidden' }}>
              <div style={{ width: `${(m.done / m.lessons) * 100}%`, height: '100%', background: m.col, transition: 'width .6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#3a5068' }}>
              <span>{m.done}/{m.lessons}</span>
              <span style={{ color: m.done === m.lessons ? '#00d68f' : '#3a5068' }}>
                {m.done === m.lessons ? 'Complete' : `${Math.round(m.done / m.lessons * 100)}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Academy page ────────────────────────────────────────────────────────
export default function Academy() {
  const [tab, setTab] = useState('courses');

  const tabs = [
    { id: 'courses',    label: 'Courses',          badge: `${MODS.length} modules` },
    { id: 'books',      label: 'Books & Stories',   badge: `${BOOKS.length} books · ${STORIES.length} stories`  },
    { id: 'flashcards', label: 'Flashcards',         badge: `${FLASHCARD_DECKS.reduce((a,d)=>a+d.cards.length,0)} cards` },
  ];

  return (
    <div style={{ padding: '26px 28px', maxWidth: 1280, fontFamily: "'DM Sans',sans-serif", color: '#c8d8e8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .acad-tab-content{animation:fadeUp .25s ease both}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ ...S.sl, marginBottom: 5 }}>Learning Center</div>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 26, fontWeight: 400, margin: '0 0 16px' }}>
          Finance <em style={{ color: '#00e5ff' }}>Academy</em>
        </h2>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #182236', paddingBottom: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '10px 18px', borderRadius: '9px 9px 0 0', border: `1px solid ${tab === t.id ? '#182236' : 'transparent'}`, borderBottom: tab === t.id ? '1px solid #090f1e' : 'none', background: tab === t.id ? 'rgba(9,15,30,.9)' : 'transparent', color: tab === t.id ? '#00e5ff' : '#3a5068', fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', display: 'flex', gap: 8, alignItems: 'center', position: 'relative', top: 1 }}>
              {t.label}
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 5, background: tab === t.id ? 'rgba(0,229,255,.12)' : 'rgba(255,255,255,.05)', color: tab === t.id ? '#00e5ff' : '#3a5068', fontWeight: 700 }}>{t.badge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="acad-tab-content" key={tab}>
        {tab === 'courses'    && <CoursesTab />}
        {tab === 'books'      && <BooksLibrary />}
        {tab === 'flashcards' && <Flashcards />}
      </div>
    </div>
  );
}
