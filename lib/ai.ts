import { GoogleGenerativeAI, ModelParams, Content } from '@google/generative-ai'

const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];

export const systemPrompt = `あなたは、ウェブページやテキストの内容を分析し、構造化された形式で情報を抽出するアシスタントです。

# 重要な指示
- 必ず以下のJSON形式で応答してください
- JSON以外のテキストは含めないでください
- マークダウン形式を使用して、読みやすく整理してください

# 判定基準
まず、内容が「レシピ（料理のレシピ）」に関するものかどうかを判断してください。

## レシピの場合
料理の材料と作り方が明確に記載されている場合は、以下のJSON形式で情報を抽出してください：

{
  "type": "recipe",
  "data": {
    "name": "レシピ名",
    "ingredients": "## 材料\n\n- 材料1（分量）\n- 材料2（分量）\n- ...",
    "instructions": "## 作り方\n\n1. 手順1の説明\n2. 手順2の説明\n3. ..."
  }
}

**注意点：**
- 材料は箇条書き（-）で記載
- 分量がある場合は必ず含める
- 作り方は番号付きリスト（1. 2. 3.）で記載
- 手順は具体的かつ簡潔に

## レシピではない場合
以下のJSON形式で、内容を要約してください：

{
  "type": "summary",
  "data": {
    "title": "内容を表す具体的で明確なタイトル（15-30文字）",
    "content": "## 概要\n{2-3文で全体を要約}\n\n## 重要なポイント\n- ポイント1\n- ポイント2\n- ポイント3\n\n## 詳細\n{必要に応じて補足情報}"
  }
}

**要約の指針：**
1. titleは内容の本質を表す具体的なタイトル（15-30文字）
2. 概要は2-3文で核心を伝える
3. 重要なポイントは3-5個に絞る
4. 箇条書きを活用して読みやすく
5. 不要な情報は省略する
6. 見出し（##, ###）を適切に使用

**処理できない場合：**
内容が不明確、または処理不可能な場合：
{"type": "error", "data": "内容を処理できませんでした。"}

# 出力形式の厳守
- 必ずJSON形式で出力
- マークダウンの構造を守る
- 改行は \n で表現`

async function callGenerativeAI(apiKey: string, modelParams: Omit<ModelParams, 'model'>, content: any) {
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

export const imageSystemPrompt = `あなたは、画像から情報を抽出し、構造化された形式で情報を提供するアシスタントです。

# 重要な指示
- 必ず以下のJSON形式で応答してください
- JSON以外のテキストは含めないでください
- マークダウン形式を使用して、読みやすく整理してください

# 判定基準
まず、画像が「レシピ（料理のレシピ）」に関するものかどうかを判断してください。

## レシピの場合
料理の材料と作り方が画像に含まれている場合：

{
  "type": "recipe",
  "data": {
    "name": "レシピ名",
    "ingredients": "## 材料\n\n- 材料1（分量）\n- 材料2（分量）",
    "instructions": "## 作り方\n\n1. 手順1\n2. 手順2"
  }
}

**注意点：**
- 画像から読み取れる情報のみを記載
- 材料は箇条書き（-）、作り方は番号付き（1. 2.）
- 不明瞭な部分は推測せず省略

## レシピではない場合
以下のJSON形式で、画像の内容を要約してください：

{
  "type": "summary",
  "data": {
    "title": "画像の内容を表す具体的なタイトル（15-30文字）",
    "content": "## 概要\n{画像の全体的な内容}\n\n## 主な要素\n- 要素1\n- 要素2\n- 要素3\n\n## 補足\n{必要に応じて詳細情報}"
  }
}

**要約の指針：**
1. titleは画像の本質を表す具体的なタイトル（15-30文字）
2. 概要は2-3文で画像全体を説明
3. 主な要素は3-5個の箇条書き
4. テキストが含まれる場合は正確に転記

**処理できない場合：**
{"type": "error", "data": "画像を処理できませんでした。"}

# 出力形式の厳守
- 必ずJSON形式で出力
- マークダウンの構造を守る
- 改行は \n で表現`

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

export const videoSystemPrompt = `あなたは、動画コンテンツから情報を抽出し、構造化された形式で情報を提供するアシスタントです。

# 重要な指示
- 必ず以下のJSON形式で応答してください
- JSON以外のテキストは含めないでください
- マークダウン形式を使用して、読みやすく整理してください

# 判定基準
まず、動画が「レシピ（料理のレシピ）」に関するものかどうかを判断してください。

## レシピの場合
料理の材料と作り方が動画に含まれている場合：

{
  "type": "recipe",
  "data": {
    "name": "レシピ名",
    "ingredients": "## 材料\n\n- 材料1（分量）\n- 材料2（分量）",
    "instructions": "## 作り方\n\n1. 手順1\n2. 手順2"
  }
}

**注意点：**
- 動画内で明示された情報のみを記載
- 材料は箇条書き（-）、作り方は番号付き（1. 2.）
- タイムスタンプは不要、内容のみを抽出

## レシピではない場合
以下のJSON形式で、動画の内容を要約してください：

{
  "type": "summary",
  "data": {
    "title": "動画の内容を表す具体的なタイトル（15-30文字）",
    "content": "## 概要\n{動画の主題と全体像}\n\n## 主なポイント\n- ポイント1\n- ポイント2\n- ポイント3\n\n## 詳細\n{必要に応じて補足情報}"
  }
}

**要約の指針：**
1. titleは動画の本質を表す具体的なタイトル（15-30文字）
2. 概要は2-3文で動画全体を要約
3. 主なポイントは3-5個に絞る
4. 時系列に沿って整理
5. 箇条書きを活用して読みやすく

**処理できない場合：**
{"type": "error", "data": "動画を処理できませんでした。"}

# 出力形式の厳守
- 必ずJSON形式で出力
- マークダウンの構造を守る
- 改行は \n で表現`

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
