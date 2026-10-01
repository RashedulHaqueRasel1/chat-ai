import { NextRequest, NextResponse } from 'next/server';

const API_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, token, stream = true } = body;

    const activeToken =
      process.env.HUGGINGFACE_API_KEY ||
      process.env.HF_TOKEN ||
      token ||
      process.env.NEXT_PUBLIC_HF_TOKEN;

    if (!activeToken) {
      return NextResponse.json(
        { error: 'Hugging Face API key is required. Please set HUGGINGFACE_API_KEY in your .env.local file.' },
        { status: 401 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid message format.' },
        { status: 400 }
      );
    }

    // Format messages for Hugging Face Router
    const formattedMessages = messages.map((m: any) => {
      // If message has multiple images attached
      if (m.images && Array.isArray(m.images) && m.images.length > 0) {
        const contentArray: any[] = [
          { type: 'text', text: m.content || 'Please analyze the attached image(s).' }
        ];

        // Push each attached image as an image_url object
        m.images.forEach((imgBase64: string) => {
          contentArray.push({
            type: 'image_url',
            image_url: { url: imgBase64 }
          });
        });

        return {
          role: m.role,
          content: contentArray
        };
      }

      // Standard text message
      return {
        role: m.role,
        content: m.content
      };
    });

    const isStreaming = stream !== false;

    const response = await fetch(API_ROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'meta-llama/Llama-3.3-70B-Instruct',
        messages: formattedMessages,
        max_tokens: 2048,
        temperature: 0.7,
        stream: isStreaming
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || errData.error || errData.message || `API Error (${response.status})`;
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    if (isStreaming) {
      // Forward the SSE stream directly for real-time instant response
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await response.json();
    const choice = data.choices && data.choices[0];

    if (!choice || !choice.message) {
      return NextResponse.json(
        { error: 'No response received from AI model.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      content: choice.message.content || '',
      reasoning: choice.message.reasoning_content || null
    });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
