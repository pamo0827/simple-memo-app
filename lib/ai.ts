import { GoogleGenerativeAI } from '@google/generative-ai'

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
テキストの要点を抽出し、重要なポイントをまとめたマークダウン形式のテキストを返してください。出力は以下のJSON形式にしてください。

{
  "type": "summary",
  "data": "## 要約\n\n- このテキストは...についてです。\n- 重要な点は..."
}

**どちらでもない、またはエラーの場合：**
{"type": "error", "data": "内容を処理できませんでした。"} を返してください。`

async function callGemini(apiKey: string, text: string, systemInstruction: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
  })
  const result = await model.generateContent(`以下のテキストを処理してください：\n\n${text}`)
  const response = await result.response
  // Gemini may return the JSON wrapped in markdown, so we clean it
  return response.text().replace(/```json\n?/, '').replace(/```$/, '')
}

export async function processText(text: string, apiKey: string) {
  if (!text) {
    throw new Error('Input text is empty.')
  }

  try {
    const result = await callGemini(apiKey, text, systemPrompt)

    if (!result) {
      throw new Error('AI model did not return a result.')
    }

    const parsedResult = JSON.parse(result)

    if (parsedResult.type === 'error' || !parsedResult.data) {
      throw new Error(parsedResult.data || 'Failed to process content.')
    }

    return parsedResult
  } catch (error) {
    console.error('Error during text processing:', error)
    throw new Error('Failed to process text.')
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

async function extractFromImageWithGemini(apiKey: string, base64Image: string, additionalText?: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: imageSystemPrompt,
  })

  const prompt = additionalText
    ? `この画像から情報を抽出してください。\n\n投稿の説明文:\n${additionalText}`
    : 'この画像から情報を抽出してください。'

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg',
      },
    },
  ])

  const response = await result.response
  return response.text().replace(/```json\n?/, '').replace(/```$/, '')
}

export async function processImage(base64Image: string, apiKey: string, caption?: string) {
  if (!base64Image) {
    throw new Error('Image data is empty.')
  }

  try {
    const result = await extractFromImageWithGemini(apiKey, base64Image, caption)

    if (!result) {
      throw new Error('AI model did not return a result.')
    }

    const parsedResult = JSON.parse(result)

    if (parsedResult.type === 'error' || !parsedResult.data) {
      throw new Error(parsedResult.data || 'Failed to process image.')
    }

    return parsedResult
  } catch (error) {
    console.error('Error during image processing:', error)
    throw new Error('Failed to process image.')
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

async function extractFromVideoWithGemini(apiKey: string, videoUrl: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: videoSystemPrompt,
  })

  const result = await model.generateContent([
    'この動画から情報を抽出してください。',
    {
      fileData: {
        fileUri: videoUrl,
        mimeType: 'video/mp4',
      },
    },
  ])

  const response = await result.response
  return response.text().replace(/```json\n?/, '').replace(/```$/, '')
}

export async function processVideo(videoUrl: string, apiKey: string) {
  if (!videoUrl) {
    throw new Error('Video URL is empty.')
  }

  try {
    const result = await extractFromVideoWithGemini(apiKey, videoUrl)

    if (!result) {
      throw new Error('AI model did not return a result.')
    }

    const parsedResult = JSON.parse(result)

    if (parsedResult.type === 'error' || !parsedResult.data) {
      throw new Error(parsedResult.data || 'Failed to process video.')
    }

    return parsedResult
  } catch (error) {
    console.error('Error during video processing:', error)
    throw new Error('Failed to process video.')
  }
}