/* Pixel glyphs for the mosaic illustrations.
   One char per pixel: '.' is transparent, letters are H.PAL keys (js/mosaic.js).
   Every glyph is <= 17x17 and odd so the engine centres it on the 33x33 tile and
   adds the navy halo; no outline is drawn here. Bright inks only (w c G g a q p m u e l),
   dark n only for small inner detail. */
(function(){
const H = window.H = window.H || {};
H.glyphs = Object.assign(H.glyphs || {}, {

  /* home: chat bubble with a four-point burst */
  home: [
    '.................',
    '.................',
    '..GGGGGGGGGGGGG..',
    '.GGGGGGGGGGGGGGG.',
    '.GGGGGGGwGGGGGGG.',
    '.GGGGGGGwGGGGGGG.',
    '.GGGGGGwwwGGGGGG.',
    '.GGGGwwwwwwwGGGG.',
    '.GGGGGGwwwGGGGGG.',
    '.GGGGGGGwGGGGGGG.',
    '.GGGGGGGwGGGGGGG.',
    '.GGGGGGGGGGGGGGG.',
    '..GGGGGGGGGGGGG..',
    '...GGGG..........',
    '...GGG...........',
    '...GG............',
    '.................'
  ],

  /* inbox: open envelope, letter peeking out, small spark */
  inbox: [
    '.................',
    '..............w..',
    '.....wwwwwww.www.',
    '.....wwwwwww..w..',
    '.....wgggggw.....',
    '.....wggggww.....',
    '.....wwwwwww.....',
    '..aGGGGGGGGGGGa..',
    '.GGaGGGGGGGGGaGG.',
    '.GGGaGGGGGGGaGGG.',
    '.GGGGaGGGGGaGGGG.',
    '.GGGGGaGGGaGGGGG.',
    '.GGGGGGaGaGGGGGG.',
    '.GGGGGGGaGGGGGGG.',
    '.GGGGGGGGGGGGGGG.',
    '..GGGGGGGGGGGGG..',
    '.................'
  ],

  /* routines: round clock at 8:00 with four rays */
  routines: [
    '.................',
    '.w.............w.',
    '........G........',
    '.....GGGGGGG.....',
    '....GGccaccGG....',
    '...GGcccacccGG...',
    '...GccccaccccG...',
    '...GccccaccccG...',
    '..GGccccaccccGG..',
    '...GcccacccccG...',
    '...GccaccccccG...',
    '...GGcccccccGG...',
    '....GGcccccGG....',
    '.....GGGGGGG.....',
    '........G........',
    '.w.............w.',
    '.................'
  ],

  /* library: open book, bookmark ribbon, spark */
  library: [
    '.................',
    '...G.............',
    '..GGG.....mmm....',
    '...G......mmm....',
    '....ccccacmmm....',
    '...cccccacmmmc...',
    '..ccccccacmmmcc..',
    '..ccccccacmmmcc..',
    '..ccccccacmcmcc..',
    '..ccccccacccccc..',
    '..ccccccacccccc..',
    '..ccccccacccccc..',
    '..ccccccacccccc..',
    '..ccccccacccccc..',
    '.aaaaaaaaaaaaaaa.',
    '.................',
    '.................'
  ],

  /* channels: lattice antenna tower with signal arcs */
  channels: [
    '.................',
    '.................',
    '........w........',
    '...q....G....q...',
    '...q....G....q...',
    '..q...q.G.q...q..',
    '..q..q..G..q..q..',
    '..q..q.GGG.q..q..',
    '...q..qG.Gq..q...',
    '...q..G...G..q...',
    '......GaaaG......',
    '.....G.....G.....',
    '.....GaaaaaG.....',
    '....G.......G....',
    '....GGGGGGGGG....',
    '.................',
    '.................'
  ],

  /* insights: five rising bars, star over the tallest */
  insights: [
    '.................',
    '..............G..',
    '.............GGG.',
    '..............G..',
    '.................',
    '..............ww.',
    '...........gg.ww.',
    '...........gg.ww.',
    '........gg.gg.ww.',
    '........gg.gg.ww.',
    '.....gg.gg.gg.ww.',
    '.....gg.gg.gg.ww.',
    '..gg.gg.gg.gg.ww.',
    '..gg.gg.gg.gg.ww.',
    '..gg.gg.gg.gg.ww.',
    '..gg.gg.gg.gg.ww.',
    '.................'
  ],

  /* settings: gear with a round centre hole */
  settings: [
    '.................',
    '......GGGGG......',
    '......GGGGG......',
    '.....ggggggg.....',
    '....ggggggggg....',
    '...ggggggggggg...',
    '.GGgggggngggggGG.',
    '.GGggggnnnggggGG.',
    '.GGgggnnnnngggGG.',
    '.GGggggnnnggggGG.',
    '.GGgggggngggggGG.',
    '...ggggggggggg...',
    '....ggggggggg....',
    '.....ggggggg.....',
    '......GGGGG......',
    '......GGGGG......',
    '.................'
  ],

  /* history: hourglass with sand in both halves */
  history: [
    '.................',
    '..GGGGGGGGGGGGG..',
    '...ccccccccccc...',
    '....caaaaaaac....',
    '.....caaaaac.....',
    '......caaac......',
    '.......cac.......',
    '........a........',
    '........a........',
    '........a........',
    '.......cac.......',
    '......caaac......',
    '.....caaaaac.....',
    '....caaaaaaac....',
    '...caaaaaaaaac...',
    '..GGGGGGGGGGGGG..',
    '.................'
  ],

  /* terminal: window frame, prompt chevron, cursor */
  terminal: [
    '.................',
    '.................',
    '..GGGGGGGGGGGGG..',
    '..GaaaaaaaaaaaG..',
    '..GawawawaaaaaG..',
    '..GaaaaaaaaaaaG..',
    '..GnnnnnnnnnnnG..',
    '..GnnnnnnnnnnnG..',
    '..GnnnnnnnnnnnG..',
    '..GnnwnnqqnnnnG..',
    '..GnnnwnqqnnnnG..',
    '..GnnwnnqqnnnnG..',
    '..GnnnnnnnnnnnG..',
    '..GnnnnnnnnnnnG..',
    '..GnnnnnnnnnnnG..',
    '..GGGGGGGGGGGGG..',
    '.................'
  ],

  /* clear: big check inside a ring */
  clear: [
    '.................',
    '......eeeee......',
    '....eeeeeeeee....',
    '...eeeeeeeeeee...',
    '..eeennnnnnneee..',
    '..eeennnnnnneee..',
    '.eeennnnnnnwneee.',
    '.eeennnnnnwwneee.',
    '.eeewwnnnwwnneee.',
    '.eeenwwnwwnnneee.',
    '.eeennwwwwnnneee.',
    '..eeennwnnnneee..',
    '..eeennnnnnneee..',
    '...eeeeeeeeeee...',
    '....eeeeeeeee....',
    '......eeeee......',
    '.................'
  ]

});
})();
