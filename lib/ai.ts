import { GoogleGenerativeAI, ModelParams, Content } from '@google/generative-ai'

const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];

// 要約の詳細レベルに応じた文字数指示を生成
function getSummaryLengthInstruction(summaryLength: number = 3): string {
  const lengthMap: Record<number, string> = {
    1: '\n\n要約は50〜100文字程度の簡潔な箇条書きで記述してください。最も重要なポイントのみを含めてください。',
    2: '\n\n要約は100〜200文字程度で記述してください。重要なポイントを簡潔にまとめてください。',
    3: '\n\n要約は200〜400文字程度で記述してください。内容の主要な点を適度な詳しさでまとめてください。',
    4: '\n\n要約は400〜800文字程度で記述してください。詳細な情報を含めて、内容を丁寧に説明してください。',
    5: '\n\n要約は800文字以上で詳細に記述してください。可能な限り多くの情報を含めて、内容を網羅的に説明してください。'
  };

  return lengthMap[summaryLength] || lengthMap[3];
}

export const systemPrompt = `あなたは、与えられたウェブページやテキストの内容を分析するアシスタントです。

まず、内容が「レシピ」に関するものかどうかを判断してください。

**内容がレシピの場合：**
以下のJSON形式で、レシピ情報を抽出して返してください。材料と作り方のリストは、見やすいように必ずマークダウン形式にしてください。

{
  "type": "recipe",
  "data": {
    "name": "レシピ名",
    "ingredients": "## 材料\n\n- 材料1\n- 材料2",
    "instructions": "## 作り方\n\n1. 手順1\n2. 手順2"
  }
}

**内容がレシピではない場合：**
テキストの内容を要約してください。
要約の先頭には、内容を最もよく表すタイトルを \`## \` を付けて記述してください。
出力は以下のJSON形式で、マークダウン形式の要約を返してください。

{
  "type": "summary",
  "data": "## {生成したタイトル}\n\n- 要約の本文..."
}

**どちらでもない、またはエラーの場合：**
{"type": "error", "data": "内容を処理できませんでした。"} を返してください。`

async function callGenerativeAI(apiKey: string, modelParams: Omit<ModelParams, 'model'>, content: Content) {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: any;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ ...modelParams, model: modelName });
      const result = await model.generateContent(content);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      lastError = error;
      // 503 or similar overload errors can be checked here if the SDK provides structured errors
      if (error.message.includes('503') || error.message.toLowerCase().includes('overloaded')) {
        console.warn(`Model ${modelName} is overloaded, trying next model...`);
        continue; // Try the next model
      }
      // For other errors, rethrow immediately
      throw error;
    }
  }
  // If all models fail, throw the last recorded error
  throw lastError;
}


function extractJson(text: string): string | null {
  const jsonRegex = /\{[\s\S]*\}/;
  const match = text.match(jsonRegex);
  if (match) {
    return match[0];
  }
  return null;
}

export async function processText(text: string, apiKey: string, customPrompt?: string | null, summaryLength: number = 3) {
  if (!text) {
    throw new Error('Input text is empty.')
  }

  const lengthInstruction = getSummaryLengthInstruction(summaryLength);
  const prompt = customPrompt || (systemPrompt + lengthInstruction);

  let resultFromAI: string | undefined;
  try {
    resultFromAI = await callGenerativeAI(
      apiKey,
      { systemInstruction: prompt },
      `以下のテキストを処理してください：\n\n${text}`
    );

    if (!resultFromAI) {
      throw new Error('AI model did not return a result.')
    }

    const jsonString = extractJson(resultFromAI);

    if (!jsonString) {
      console.error('Could not extract JSON from AI response. Response was:', resultFromAI);
      throw new Error('AI returned an invalid format.');
    }

    const parsedResult = JSON.parse(jsonString)

    if (parsedResult.type === 'error' || !parsedResult.data) {
      throw new Error(parsedResult.data || 'AI failed to process content.')
    }

    return parsedResult
  } catch (error) {
    console.error('Error during text processing:', error)
    if (error instanceof SyntaxError) {
      // JSON.parse failed
      console.error('Failed to parse AI response as JSON. Response was:', resultFromAI);
      throw new Error('AI returned an invalid format. Please try again.');
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new Error(`Failed to process text: ${errorMessage}`)
  }
}

export const imageSystemPrompt = `あなたは画像から情報を抽出するアシスタントです。
まず、画像が「レシピ」に関するものかどうかを判断してください。

**画像がレシピの場合：**
以下のJSON形式で、レシピ情報を抽出して返してください。材料と作り方のリストは、見やすいように必ずマークダウン形式にしてください。
{
  "type": "recipe",
  "data": {
    "name": "レシピ名",
    "ingredients": "## 材料...",
    "instructions": "## 作り方..."
  }
}

**画像がレシピではない場合：**
画像の内容を説明するテキストを生成し、以下のJSON形式で返してください。
{
  "type": "summary",
  "data": "## 画像の説明\n\n- この画像には..."
}

**どちらでもない、またはエラーの場合：**
{"type": "error", "data": "内容を処理できませんでした。"} を返してください。`

export async function processImage(base64Image: string, apiKey: string, caption?: string, customPrompt?: string | null, summaryLength: number = 3) {
  if (!base64Image) {
    throw new Error('Image data is empty.')
  }

  const lengthInstruction = getSummaryLengthInstruction(summaryLength);
  const systemInst = customPrompt || (imageSystemPrompt + lengthInstruction);

  try {
    const prompt = caption
    ? `この画像から情報を抽出してください。\n\n投稿の説明文:\n${caption}`
    : 'この画像から情報を抽出してください。'

    const content: Content = [
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg',
        },
      },
    ];

    const result = await callGenerativeAI(
      apiKey,
      { systemInstruction: systemInst },
      content
    );

    if (!result) {
      throw new Error('AI model did not return a result.')
    }

    const jsonString = extractJson(result);
    if (!jsonString) {
      console.error('Could not extract JSON from AI response. Response was:', result);
      throw new Error('AI returned an invalid format.');
    }

    const parsedResult = JSON.parse(jsonString)

    if (parsedResult.type === 'error' || !parsedResult.data) {
      throw new Error(parsedResult.data || 'Failed to process image.')
    }

    return parsedResult
  } catch (error) {
    console.error('Error during image processing:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new Error(`Failed to process image: ${errorMessage}`)
  }
}

export const videoSystemPrompt = `あなたは動画から情報を抽出するアシスタントです。
まず、動画が「レシピ」に関するものかどうかを判断してください。

**動画がレシピの場合：**
以下のJSON形式で、レシピ情報を抽出して返してください。材料と作り方のリストは、見やすいように必ずマークダウン形式にしてください。
{
  "type": "recipe",
  "data": {
    "name": "レシピ名",
    "ingredients": "## 材料...",
    "instructions": "## 作り方..."
  }
}

**動画がレシピではない場合：**
動画の内容を要約するテキストを生成し、以下のJSON形式で返してください。
{
  "type": "summary",
  "data": "## 動画の要約\n\n- この動画は..."
}

**どちらでもない、またはエラーの場合：**
{"type": "error", "data": "内容を処理できませんでした。"} を返してください。`

export async function processVideo(videoUrl: string, apiKey: string, customPrompt?: string | null, summaryLength: number = 3) {
  if (!videoUrl) {
    throw new Error('Video URL is empty.')
  }

  const lengthInstruction = getSummaryLengthInstruction(summaryLength);
  const systemInst = customPrompt || (videoSystemPrompt + lengthInstruction);

  try {
    const content: Content = [
      'この動画から情報を抽出してください。',
      {
        fileData: {
          fileUri: videoUrl,
          mimeType: 'video/mp4',
        },
      },
    ];

    const result = await callGenerativeAI(
      apiKey,
      { systemInstruction: systemInst },
      content
    );

    if (!result) {
      throw new Error('AI model did not return a result.')
    }

    const jsonString = extractJson(result);
    if (!jsonString) {
      console.error('Could not extract JSON from AI response. Response was:', result);
      throw new Error('AI returned an invalid format.');
    }

    const parsedResult = JSON.parse(jsonString)

    if (parsedResult.type === 'error' || !parsedResult.data) {
      throw new Error(parsedResult.data || 'Failed to process video.')
    }

    return parsedResult
  } catch (error) {
    console.error('Error during video processing:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new Error(`Failed to process video: ${errorMessage}`)
  }
}
