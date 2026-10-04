// ─── Sample Text Presets ───
// Pre-filled examples users can load to quickly test the parser.

export interface Preset {
  label: string;
  value: string;
}

export const PRESETS: Preset[] = [
  {
    label: "Markdown Bold List",
    value: `1. **Bohemian Rhapsody** – Queen
2. **Hotel California** – Eagles
3. **Stairway to Heaven** – Led Zeppelin
4. **Imagine** – John Lennon
5. **Smells Like Teen Spirit** – Nirvana
6. **Like a Rolling Stone** – Bob Dylan
7. **Hey Jude** – The Beatles
8. **Purple Rain** – Prince
9. **Billie Jean** – Michael Jackson
10. **Wonderwall** – Oasis`,
  },
  {
    label: "Simple Numbered List",
    value: `1. Blinding Lights - The Weeknd
2. Shape of You - Ed Sheeran
3. Uptown Funk - Mark Ronson
4. Someone Like You - Adele
5. Rolling in the Deep - Adele
6. Thinking Out Loud - Ed Sheeran
7. Stay With Me - Sam Smith
8. Happy - Pharrell Williams`,
  },
  {
    label: '"by" Format',
    value: `Flowers by Miley Cyrus
Anti-Hero by Taylor Swift
As It Was by Harry Styles
Kill Bill by SZA
Vampire by Olivia Rodrigo
Cruel Summer by Taylor Swift
Snooze by SZA
Paint The Town Red by Doja Cat`,
  },
  {
    label: "Artist – Title",
    value: `Daft Punk – Get Lucky
Arctic Monkeys – Do I Wanna Know?
Gotye – Somebody That I Used to Know
Lorde – Royals
Hozier – Take Me to Church
Tame Impala – The Less I Know the Better
Glass Animals – Heat Waves
Dua Lipa – Levitating`,
  },
  {
    label: "Tab-Separated",
    value: `Lose Yourself\tEminem
In Da Club\t50 Cent
Numb\tLinkin Park
Clocks\tColdplay
Toxic\tBritney Spears
Hey Ya!\tOutKast
Mr. Brightside\tThe Killers`,
  },
];
