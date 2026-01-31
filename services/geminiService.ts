
import { GoogleGenAI } from "@google/genai";
import { StoryType, Tense } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  /**
   * METHODE_LISTER_MOT implementation
   */
  async extractWords(text: string): Promise<string> {
    const prompt = `
      Tu es un expert linguiste japonais. Analyse le texte suivant et extrais uniquement les mots ou unités lexicales (composés, noms, radicaux verbaux/adjectivaux) qui contiennent au moins un kanji.
      
      METHODE_LISTER_MOT :
      - Un mot est une unité de langue réalisée graphiquement par un ou plusieurs kanji, éventuellement complétés par des kana (okurigana) qui forment l'unité (ex: 食べる).
      - Segmentes selon les frontières naturelles : kanji seul ou groupe de kanji + okurigana adjacent formant une unité de sens.
      - Ignore les séquences purement en hiragana/katakana (particules, terminaisons isolées).
      - Les mots sont listés dans le sens d'apparition du texte.
      - Chaque mot apparaît une SEULE fois dans la liste (supprime les doublons).
      - Pour chaque unité : Donne la forme exacte (avec kanji), la lecture en hiragana et une traduction française brève.
      - Vérification finale : Assure-toi que CHAQUE kanji présent dans le texte de référence se retrouve dans au moins un mot de la liste.
      
      Format attendu : Markdown numéroté, "1. Mot、Lecture、Traduction".
      
      Texte à analyser :
      ${text}
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "";
  }

  async generateStory(listeA: string, type: StoryType, tense: Tense): Promise<string> {
    const prompt = `
      Tu es un expert linguistique en Japonais. Écris un nouveau texte court pour un étudiant.
      
      CONTRAINTES :
      - Style d'histoire : ${type}
      - Temps des conjugaisons : ${tense}
      - Utilise CHAQUE mot de la liste suivante au moins une fois : ${listeA}
      - Le texte doit être différent du texte de référence original mais avoir un sens logique.
      - Maximum 20 phrases.
      - Chaque phrase commence à une nouvelle ligne.
      - Ponctuation japonaise uniquement.
      - Les mots clés issus de la liste doivent être mis en GRAS (format **mot**).
      - Ne pas mettre la lecture hiragana après les mots dans le texte.
      - Noms de pays : en Katakana, sauf pour le Japon qui s'écrit 日本.
      
      Réponds directement avec le texte japonais uniquement.
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.2,
        topK: 2,
        topP: 0.4,
      }
    });

    return response.text || "";
  }

  /**
   * METHODE_KANJI_MOT_COURANT implementation
   */
  async getCommonWords(kanji: string, count: string): Promise<string> {
    const prompt = `
      Tu es un expert linguiste japonais. 
      METHODE_KANJI_MOT_COURANT :
      A partir du KANJI_REFERENCE "${kanji}", liste les ${count} mots japonais les plus courants contenant ce kanji.
      
      Format strict de sortie (respecte scrupuleusement les tirets et virgules) :
      Introduction : "Voici les ${count} mots les plus courants contenant le kanji ${kanji}, avec leurs significations principales et un exemple simple d’usage. Les exemples sont donnés en japonais, puis en français."

      Structure de chaque mot :
      X-Mot、Lecture en hiragana、Traduction(s)
      Exemple : [Phrase en japonais] 、Lecture en hiragana→ [Traduction en français]

      Utilise la ponctuation japonaise pour les phrases d'exemple. Ne mets pas de texte superflu en dehors de cette structure.
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    return response.text || "";
  }
}
