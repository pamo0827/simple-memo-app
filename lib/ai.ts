import { GoogleGenerativeAI, ModelParams, Content } from '@google/generative-ai'

const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];

const systemPrompt = `あなたは、与えられたウェブページやテキストの内容を分析するアシスタントです。

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

export async function processText(text: string, apiKey: string) {
  if (!text) {
    throw new Error('Input text is empty.')
  }

  let resultFromAI: string | undefined;
  try {
    resultFromAI = await callGenerativeAI(
      apiKey,
      { systemInstruction: systemPrompt },
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

const imageSystemPrompt = `あなたは画像から情報を抽出するアシスタントです。
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

export async function processImage(base64Image: string, apiKey: string, caption?: string) {
  if (!base64Image) {
    throw new Error('Image data is empty.')
  }

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
      { systemInstruction: imageSystemPrompt },
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

const videoSystemPrompt = `あなたは動画から情報を抽出するアシスタントです。
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

export async function processVideo(videoUrl: string, apiKey: string) {
  if (!videoUrl) {
    throw new Error('Video URL is empty.')
  }

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
      { systemInstruction: videoSystemPrompt },
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
