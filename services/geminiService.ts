
// @google/genai Coding Guidelines followed:
// - Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// - Always use response.text property (not a method).
// - Correct model names used (gemini-3-flash-preview, gemini-flash-lite-latest).

import { GoogleGenAI, Type } from "@google/genai";
import { OFFLINE_EXERCISES } from "../constants";
import { RubricItem, CourseModule } from "../types";

/**
 * Generates a tutor response from Gemini.
 */
export const generateTutorResponse = async (
  prompt: string,
  context: string = ''
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const finalPrompt = `
      Contexto académico: ${context}
      
      Eres "QLASE Core", el motor de inteligencia artificial académica de la plataforma QLASE.
      Responde de forma profesional, educativa y concisa.
      Tu objetivo es facilitar la gestión académica y el aprendizaje.
      Si te preguntan por código, dalo optimizado.
      Si te preguntan por idiomas, explica la gramática con precisión.
      
      Usuario: ${prompt}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: finalPrompt,
    });

    return response.text || "No pude procesar la respuesta.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Modo Offline: No puedo conectar con QLASE Core en este momento. Por favor verifica tu conexión.";
  }
};

/**
 * Generates a structured course description including modules for the brochure.
 */
export const generateAIDescription = async (topic: string, numModules: number = 4): Promise<{
    title: string,
    description: string,
    objectives: string[],
    requirements: string[],
    targetAudience: string,
    durationInfo: string,
    modules: CourseModule[]
}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Actúa como un diseñador curricular experto. Genera un esquema de curso completo para el tema: "${topic}". Incluye exactamente ${numModules} módulos detallados.`;

    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                    targetAudience: { type: Type.STRING },
                    durationInfo: { type: Type.STRING },
                    modules: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING }
                            },
                            required: ["title", "description"]
                        }
                    }
                },
                required: ["title", "description", "objectives", "requirements", "targetAudience", "durationInfo", "modules"]
            }
        }
    });

    return JSON.parse(response.text || '{}');
};

/**
 * Generates a professional academic biography.
 */
export const generateAIBio = async (name: string, title: string, location: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Genera una biografía académica profesional y elegante de 3 párrafos para ${name}, quien es ${title} en ${location}. Usa un tono formal e inspirador.`;
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt
    });
    return response.text || "";
};

/**
 * Translates text with grammatical and contextual insights.
 */
export const translateWithContext = async (text: string, targetLang: string): Promise<{ translation: string, explanation: string }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Actúa como un traductor experto de lingüística aplicada en el ecosistema QLASE.
            Traduce el siguiente texto al ${targetLang}.
            
            IMPORTANTE: Tu respuesta debe seguir ESTRICTAMENTE este formato:
            [Traducción exacta]
            ||
            [Explicación breve del contexto, formalidad y gramática utilizada]

            Texto a traducir: "${text}"
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        const parts = (response.text || '').split('||');
        return {
            translation: parts[0]?.trim() || "Error de traducción",
            explanation: parts[1]?.trim() || "No se pudo generar la explicación."
        };

    } catch (error) {
        return { 
            translation: "Offline Mode: Unavailable", 
            explanation: "El traductor inteligente requiere conexión para analizar el contexto y la semántica." 
        };
    }
};

/**
 * Generates language learning exercises with an AI or offline fallback.
 */
export const generateLanguageExercise = async (topic: string, language: 'english' | 'french'): Promise<{text: string, source: 'ai' | 'offline'}> => {
  const getOfflineContent = () => {
    const langData = OFFLINE_EXERCISES[language] || OFFLINE_EXERCISES['english'];
    const topicExercises = langData[topic] || langData['default'];
    const randomExercise = topicExercises[Math.floor(Math.random() * topicExercises.length)];
    return { text: randomExercise, source: 'offline' as const };
  };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langName = language === 'english' ? 'Inglés (Nivel B2/C1 Profesional)' : 'Francés (Nivel A1/A2 Fundamentos)';
    
    const prompt = `
      Actúa como un profesor experto de ${langName} dentro de la plataforma QLASE.
      Genera un ejercicio MUY BREVE sobre el tema: "${topic}".
      
      IMPORTANTE: Tu respuesta debe seguir ESTRICTAMENTE este formato (sin markdown extra):
      
      [Frase de contexto o pregunta en el idioma objetivo]
      [Salto de línea]
      [Pregunta sobre gramática o vocabulario]
      ||
      [Respuesta correcta explicada en español muy brevemente]
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    if (!response.text) throw new Error("Empty response");
    
    return { text: response.text, source: 'ai' };
    
  } catch (error) {
    console.log("Fallback to offline content");
    return getOfflineContent();
  }
};

/**
 * Generates a grading rubric for a specific task.
 */
export const generateRubric = async (title: string, description: string, maxPoints: number): Promise<RubricItem[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Actúa como un diseñador instruccional experto de QLASE.
            Crea una Rúbrica de Calificación ESTÁNDAR y PROFESIONAL para la siguiente tarea.
            La estructura debe ser genérica pero aplicable al tema específico.
            
            Tarea: ${title}
            Contexto: ${description}
            Puntaje Total Máximo: ${maxPoints}
            
            Genera EXACTAMENTE 4 criterios de evaluación estandarizados.
            Usa nombres de criterios formales como: "Profundidad de Análisis", "Calidad Técnica/Ejecución", "Estructura y Organización", "Originalidad/Creatividad".
            
            IMPORTANTE: Responde SOLAMENTE con un array JSON válido. Sin markdown, sin explicaciones.
            Formato:
            [
              { "criteria": "Nombre del criterio", "description": "Descripción específica de qué se evalúa en este contexto", "points": 25 },
              ...
            ]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
        return JSON.parse(text);
    } catch (error) {
        console.error("Error creating rubric:", error);
        return [
            { criteria: "Evaluación General", description: "Calidad global del trabajo entregado.", points: maxPoints }
        ];
    }
};

/**
 * Generates a comprehensive course-level rubric.
 */
export const generateCourseRubric = async (courseTitle: string, courseDescription: string): Promise<RubricItem[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Genera una rúbrica de evaluación general para un curso titulado: "${courseTitle}". 
            Descripción del curso: "${courseDescription}".
            
            La rúbrica debe evaluar el desempeño global del estudiante en el curso.
            Debe sumar exactamente 100 puntos.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            criteria: { type: Type.STRING, description: "Nombre del criterio de evaluación (ej: Participación, Proyecto Final, Exámenes)" },
                            description: { type: Type.STRING, description: "Descripción detallada de lo que se espera para obtener el puntaje completo." },
                            points: { type: Type.NUMBER, description: "Puntos asignados a este criterio." }
                        },
                        required: ["criteria", "description", "points"]
                    }
                }
            }
        });

        return JSON.parse(response.text || '[]');
    } catch (error) {
        console.error("Error generating course rubric:", error);
        return [
            { criteria: "Asistencia y Participación", description: "Participación activa en clases y foros.", points: 20 },
            { criteria: "Evaluaciones Parciales", description: "Promedio de exámenes y quizzes.", points: 30 },
            { criteria: "Trabajos Prácticos", description: "Entrega de tareas y laboratorios.", points: 20 },
            { criteria: "Proyecto Final", description: "Calidad y ejecución del proyecto integrador.", points: 30 }
        ];
    }
};
