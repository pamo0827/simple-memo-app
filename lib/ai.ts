import { GoogleGenerativeAI, ModelParams, Content } from '@google/generative-ai'

const models = ['gemini-2.5-flash', 'gemini-2.5-pro','gemini-2.5-flash-lite', 'gemini-2.0-flash'];

export const systemPrompt = `ウェブページやテキストの内容を要約して、以下のJSON形式で出力してください。

{
  "type": "summary",
  "data": {
    "title": "内容を表すタイトル（15-30文字）",
    "content": "## 要約\n{2-3文で要約}\n\n## ポイント\n- 重要なポイント1\n- 重要なポイント2\n- 重要なポイント3"
  }
}

**指針:**
- titleは内容の本質を表す
- 簡潔で読みやすく
- 重要な情報を優先
- マークダウン形式を使用`

async function callGenerativeAI(apiKey: string, modelParams: Omit<ModelParams, 'model'>, content: any) {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: any;

  for (let i = 0; i < models.length; i++) {
    const modelName = models[i];
    try {
      const model = genAI.getGenerativeModel({ ...modelParams, model: modelName });
      const result = await model.generateContent(content);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || '';
      const isLastModel = i === models.length - 1;

      // 503エラー（過負荷）または429エラー（クォータ超過）の場合、次のモデルを試す
      const isRetryableError =
        errorMessage.includes('503') ||
        errorMessage.toLowerCase().includes('overloaded') ||
        errorMessage.includes('429') ||
        errorMessage.toLowerCase().includes('quota exceeded') ||
        errorMessage.toLowerCase().includes('rate limit');

      if (isRetryableError && !isLastModel) {
        continue; // 次のモデルを試す
      }

      // その他のエラーまたは最後のモデルの場合は即座にスロー
      throw error;
    }
  }
  // すべてのモデルが失敗した場合、最後のエラーをスロー
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

export async function processUrl(
  url: string,
  apiKey: string,
  customPrompt?: string | null,
  summaryLength?: 'short' | 'medium' | 'long'
) {
  if (!url) {
    throw new Error('Input URL is empty.')
  }

  let prompt = customPrompt || systemPrompt;

  // 文字数設定に基づいてプロンプトを調整
  if (!customPrompt && summaryLength) {
    const lengthInstructions = {
      short: '\n\n# 要約の文字数設定\n重要なポイントのみを簡潔に抽出してください。箇条書きは2-3個に絞り、各項目は1行で完結させてください。',
      medium: '\n\n# 要約の文字数設定\n適度な詳細さでバランスよく要約してください。箇条書きは3-5個、各項目は1-2行で記述してください。',
      long: '\n\n# 要約の文字数設定\n詳細な情報を含めて丁寧に要約してください。箇条書きは5-8個、各項目は必要に応じて複数行で詳しく記述してください。'
    };
    prompt += lengthInstructions[summaryLength];
  }

  let resultFromAI: string | undefined;
  try {
    resultFromAI = await callGenerativeAI(
      apiKey,
      { systemInstruction: prompt },
      `以下のURLのコンテンツを処理してください：\n\n${url}\n\nURLにアクセスしてコンテンツを確認し、上記の指示に従って情報を抽出してください。`
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
    console.error('Error during URL processing:', error)
    if (error instanceof SyntaxError) {
      console.error('Failed to parse AI response as JSON. Response was:', resultFromAI);
      throw new Error('AI returned an invalid format. Please try again.');
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    throw new Error(`Failed to process URL: ${errorMessage}`)
  }
}

export async function processText(
  text: string,
  apiKey: string,
  customPrompt?: string | null,
  summaryLength?: 'short' | 'medium' | 'long'
) {
  if (!text) {
    throw new Error('Input text is empty.')
  }

  let prompt = customPrompt || systemPrompt;

  // 文字数設定に基づいてプロンプトを調整
  if (!customPrompt && summaryLength) {
    const lengthInstructions = {
      short: '\n\n# 要約の文字数設定\n重要なポイントのみを簡潔に抽出してください。箇条書きは2-3個に絞り、各項目は1行で完結させてください。',
      medium: '\n\n# 要約の文字数設定\n適度な詳細さでバランスよく要約してください。箇条書きは3-5個、各項目は1-2行で記述してください。',
      long: '\n\n# 要約の文字数設定\n詳細な情報を含めて丁寧に要約してください。箇条書きは5-8個、各項目は必要に応じて複数行で詳しく記述してください。'
    };
    prompt += lengthInstructions[summaryLength];
  }

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

export const imageSystemPrompt = `画像の内容を要約して、以下のJSON形式で出力してください。

{
  "type": "summary",
  "data": {
    "title": "画像の内容を表すタイトル（15-30文字）",
    "content": "## 要約\n{2-3文で要約}\n\n## ポイント\n- 重要なポイント1\n- 重要なポイント2\n- 重要なポイント3"
  }
}

**指針:**
- titleは画像の本質を表す
- 簡潔で読みやすく
- テキストが含まれる場合は正確に転記`

export async function processImage(
  base64Image: string,
  apiKey: string,
  caption?: string,
  customPrompt?: string | null,
  summaryLength?: 'short' | 'medium' | 'long'
) {
  if (!base64Image) {
    throw new Error('Image data is empty.')
  }

  let systemInst = customPrompt || imageSystemPrompt;

  // 文字数設定に基づいてプロンプトを調整
  if (!customPrompt && summaryLength) {
    const lengthInstructions = {
      short: '\n\n# 要約の文字数設定\n重要なポイントのみを簡潔に抽出してください。箇条書きは2-3個に絞り、各項目は1行で完結させてください。',
      medium: '\n\n# 要約の文字数設定\n適度な詳細さでバランスよく要約してください。箇条書きは3-5個、各項目は1-2行で記述してください。',
      long: '\n\n# 要約の文字数設定\n詳細な情報を含めて丁寧に要約してください。箇条書きは5-8個、各項目は必要に応じて複数行で詳しく記述してください。'
    };
    systemInst += lengthInstructions[summaryLength];
  }

  try {
    const prompt = caption
    ? `この画像から情報を抽出してください。\n\n投稿の説明文:\n${caption}`
    : 'この画像から情報を抽出してください。'

    const content = [
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

export const videoSystemPrompt = `動画の内容を要約して、以下のJSON形式で出力してください。

{
  "type": "summary",
  "data": {
    "title": "動画の内容を表すタイトル（15-30文字）",
    "content": "## 要約\n{2-3文で要約}\n\n## ポイント\n- 重要なポイント1\n- 重要なポイント2\n- 重要なポイント3"
  }
}

**指針:**
- titleは動画の本質を表す
- 簡潔で読みやすく
- 時系列に沿って整理`

export async function processVideo(
  videoUrl: string,
  apiKey: string,
  customPrompt?: string | null,
  summaryLength?: 'short' | 'medium' | 'long'
) {
  if (!videoUrl) {
    throw new Error('Video URL is empty.')
  }

  let systemInst = customPrompt || videoSystemPrompt;

  // 文字数設定に基づいてプロンプトを調整
  if (!customPrompt && summaryLength) {
    const lengthInstructions = {
      short: '\n\n# 要約の文字数設定\n重要なポイントのみを簡潔に抽出してください。箇条書きは2-3個に絞り、各項目は1行で完結させてください。',
      medium: '\n\n# 要約の文字数設定\n適度な詳細さでバランスよく要約してください。箇条書きは3-5個、各項目は1-2行で記述してください。',
      long: '\n\n# 要約の文字数設定\n詳細な情報を含めて丁寧に要約してください。箇条書きは5-8個、各項目は必要に応じて複数行で詳しく記述してください。'
    };
    systemInst += lengthInstructions[summaryLength];
  }

  try {
    const content = [
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
