
import { GoogleGenAI } from "@google/genai";
import { StoryType, Tense, Language } from "../types";
import { translations } from "../translations";

const MODEL_NAME = 'gemini-3-flash-preview';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  /**
   * METHODE_LISTER_MOT implementation
   */
  async extractWords(text: string, language: Language): Promise<string> {
    const langLabel = translations[language].name;
    const prompt = `
      Tu es un expert linguiste japonais. Analyse le texte suivant et extrais uniquement les mots ou unités lexicales (composés, noms, radicaux verbaux/adjectivaux) qui contiennent au moins un kanji.
      
      METHODE_LISTER_MOT :
      - Un mot est une unité de langue réalisée graphiquement par un ou plusieurs kanji, éventuellement complétés par des kana (okurigana) qui forment l'unité (ex: 食べる).
      - Segmentes selon les frontières naturelles : kanji seul ou groupe de kanji + okurigana adjacent formant une unité de sens.
      - Ignore les séquences purement en hiragana/katakana (particules, terminaisons isolées).
      - Les mots sont listés dans le sens d'apparition du texte.
      - Chaque mot apparaît une SEULE fois dans la liste (supprime les doublons).
      - Pour chaque unité : Donne la forme exacte (avec kanji), la lecture en hiragana et une traduction brève en ${langLabel}.
      - Vérification finale : Assure-toi que CHAQUE kanji présent dans le texte de référence se retrouve dans au moins un mot de la liste.
      
      IMPORTANT : La réponse doit être rédigée pour un utilisateur parlant ${langLabel}.
      Format attendu : Markdown numéroté, "1. Mot、Lecture、[Traduction en ${langLabel}]".
      
      Texte à analyser :
      ${text}
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "";
  }

  async generateStory(listeA: string, type: StoryType, tense: Tense, language: Language): Promise<string> {
    const langLabel = translations[language].name;
    const prompt = `
      Tu es un expert linguistique en Japonais aidant un étudiant dont la langue maternelle est le ${langLabel}. 
      Écris un nouveau texte court en japonais pour cet étudiant.
      
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
  async getCommonWords(kanji: string, count: string, language: Language): Promise<string> {
    const langLabel = translations[language].name;
    const prompt = `
      Tu es un expert linguiste japonais. 
      METHODE_KANJI_MOT_COURANT :
      A partir du KANJI_REFERENCE "${kanji}", liste les ${count} mots japonais les plus courants contenant ce kanji.
      
      IMPORTANT : Toute la réponse (introduction, explications, traductions) doit être rédigée en ${langLabel}.
      
      Format de sortie :
      Introduction : Une introduction naturelle en ${langLabel} expliquant que voici les ${count} mots les plus courants contenant le kanji ${kanji}.

      Structure de chaque mot :
      X-Mot、Lecture en hiragana、[Traduction en ${langLabel}]
      Exemple : [Phrase en japonais] 、Lecture en hiragana→ [Traduction en ${langLabel}]

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
