import {
  Document,
  Page,
  View,
  Text,
  Image,
  Font,
  StyleSheet,
} from "@react-pdf/renderer";
import { BATCH_LABEL } from "../config";

// Bundle the same fonts the website uses (react-pdf can't read the CSS <link>,
// so we register the actual .woff files here).
import PlayfairRegular from "@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff?url";
import PlayfairBold from "@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff?url";
import SpecialElite from "@fontsource/special-elite/files/special-elite-latin-400-normal.woff?url";
import GaramondRegular from "@fontsource/eb-garamond/files/eb-garamond-latin-400-normal.woff?url";
import GaramondItalic from "@fontsource/eb-garamond/files/eb-garamond-latin-400-italic.woff?url";

Font.register({
  family: "Playfair Display",
  fonts: [
    { src: PlayfairRegular, fontWeight: 400 },
    { src: PlayfairBold, fontWeight: 700 },
  ],
});
Font.register({ family: "Special Elite", src: SpecialElite });
Font.register({
  family: "EB Garamond",
  fonts: [
    { src: GaramondRegular, fontWeight: 400 },
    { src: GaramondItalic, fontWeight: 400, fontStyle: "italic" },
  ],
});
// Keep long quotes from awkwardly hyphenating.
Font.registerHyphenationCallback((word) => [word]);

const SERIF = "Playfair Display";
const TYPE = "Special Elite";
const QUOTE = "EB Garamond";
const MAROON = "#4a1925";
const GOLD = "#c2a14d";
const CREAM = "#f1e8d0";
const FRAME = "#2c2420";
const INK = "#38302a";

const s = StyleSheet.create({
  // ---- cover ----
  cover: {
    backgroundColor: MAROON,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
    position: "relative",
  },
  coverFrame: {
    position: "absolute",
    top: 28,
    left: 28,
    right: 28,
    bottom: 28,
    border: `2pt solid ${GOLD}`,
  },
  coverFrameInner: {
    position: "absolute",
    top: 36,
    left: 36,
    right: 36,
    bottom: 36,
    border: `0.5pt solid ${GOLD}`,
  },
  coverKicker: {
    fontFamily: TYPE,
    fontSize: 14,
    letterSpacing: 4,
    color: GOLD,
    marginBottom: 18,
  },
  coverTitle: {
    fontFamily: SERIF,
    fontWeight: 700,
    fontSize: 46,
    color: "#f2e3b8",
    textAlign: "center",
  },
  coverRule: { width: 90, height: 1.5, backgroundColor: GOLD, marginVertical: 22 },
  coverSub: {
    fontFamily: TYPE,
    fontSize: 11,
    letterSpacing: 2,
    color: GOLD,
    textAlign: "center",
  },

  // ---- division pages ----
  page: { backgroundColor: CREAM, paddingTop: 78, paddingBottom: 44, paddingHorizontal: 30 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 30,
    backgroundColor: MAROON,
  },
  headerTitle: { fontFamily: SERIF, fontWeight: 700, color: "#f2e3b8", fontSize: 16 },
  headerSub: { fontFamily: TYPE, color: GOLD, fontSize: 8, marginTop: 3, letterSpacing: 1 },
  pageNum: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: TYPE,
    fontSize: 8,
    color: "#8a7a55",
  },

  texture: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  card: { width: "25%", padding: 8, position: "relative" },
  cardInner: { backgroundColor: "#fbf6e9", border: `1pt solid ${FRAME}`, padding: 5, alignItems: "center" },
  photo: { width: "100%", height: 105, objectFit: "cover", border: `0.5pt solid ${FRAME}`, marginBottom: 5 },
  // a strip of "tape" holding the photo to the page
  tape: {
    position: "absolute",
    top: 3,
    left: "36%",
    width: "28%",
    height: 11,
    backgroundColor: "rgba(222, 211, 154, 0.55)",
    borderLeft: "0.5pt dashed rgba(120, 100, 50, 0.55)",
    borderRight: "0.5pt dashed rgba(120, 100, 50, 0.55)",
  },
  name: { fontFamily: SERIF, fontWeight: 700, fontSize: 9, color: INK, textAlign: "center" },
  roll: { fontFamily: TYPE, fontSize: 7, color: "#6d6048", marginTop: 2 },
  quote: { fontFamily: QUOTE, fontSize: 8.5, color: "#4a3f33", textAlign: "center", marginTop: 3, lineHeight: 1.35 },
});

export default function YearbookPdf({ sections, texture }) {
  return (
    <Document title={`The Yearbook — ${BATCH_LABEL}`}>
      {/* Cover */}
      <Page size="A4">
        <View style={s.cover}>
          {texture ? <Image src={texture} style={s.texture} /> : null}
          <View style={s.coverFrame} />
          <View style={s.coverFrameInner} />
          <Text style={s.coverKicker}>THE YEARBOOK</Text>
          <Text style={s.coverTitle}>{BATCH_LABEL}</Text>
          <View style={s.coverRule} />
          <Text style={s.coverSub}>A BOOK OF FACES, NAMES &amp; WORDS TO REMEMBER</Text>
        </View>
      </Page>

      {/* One section per division; flows onto extra pages with a repeating header. */}
      {sections.map((section) => (
        <Page key={section.key} size="A4" style={s.page} wrap>
          {texture ? <Image src={texture} style={s.texture} fixed /> : null}
          <View style={s.header} fixed>
            <Text style={s.headerTitle}>{section.title}</Text>
            <Text style={s.headerSub}>{BATCH_LABEL.toUpperCase()}</Text>
          </View>

          <View style={s.grid}>
            {section.items.map((entry) => (
              <View key={entry.id} style={s.card} wrap={false}>
                <View style={s.cardInner}>
                  <Image style={s.photo} src={entry.image_url} />
                  <Text style={s.name}>{entry.name}</Text>
                  <Text style={s.roll}>Roll No. {entry.roll_number}</Text>
                  {entry.quote ? <Text style={s.quote}>“{entry.quote}”</Text> : null}
                </View>
                {/* rendered last so it sits on top of the photo */}
                <View style={s.tape} />
              </View>
            ))}
          </View>

          <Text
            style={s.pageNum}
            fixed
            render={({ pageNumber }) => `— ${pageNumber} —`}
          />
        </Page>
      ))}
    </Document>
  );
}
